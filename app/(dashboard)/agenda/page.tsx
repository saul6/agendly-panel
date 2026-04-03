'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, CalendarX2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatusBadge } from '@/components/ui/status-badge'
import { useBusiness } from '@/hooks/use-business'
import { useAppointments } from '@/hooks/use-appointments'
import { useServices } from '@/hooks/use-services'
import { useStaff } from '@/hooks/use-staff'

// ── Helpers ────────────────────────────────────────────────────────────────────

function toDateStr(d: Date) {
  return d.toISOString().split('T')[0]
}

function formatDateLabel(d: Date) {
  return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + minutes
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AgendaPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const { business, loading: bizLoading } = useBusiness()
  const { appointments, stats, loading, refresh } = useAppointments(business?.id, toDateStr(selectedDate))
  const { services } = useServices(business?.id)
  const { staff } = useStaff(business?.id)

  const isToday = toDateStr(selectedDate) === toDateStr(new Date())

  function prevDay() { setSelectedDate(d => { const n = new Date(d); n.setDate(n.getDate() - 1); return n }) }
  function nextDay() { setSelectedDate(d => { const n = new Date(d); n.setDate(n.getDate() + 1); return n }) }

  // ── Nueva Cita dialog ────────────────────────────────────────────────────
  const [newAptOpen, setNewAptOpen] = useState(false)
  const [aptStaffId, setAptStaffId] = useState('')
  const [aptServiceId, setAptServiceId] = useState('')
  const [aptDate, setAptDate] = useState('')
  const [aptTime, setAptTime] = useState('09:00')
  const [aptCustomerName, setAptCustomerName] = useState('')
  const [aptCustomerPhone, setAptCustomerPhone] = useState('')
  const [aptSaving, setAptSaving] = useState(false)
  const [aptError, setAptError] = useState<string | null>(null)

  function openNewAptDialog() {
    setAptDate(toDateStr(selectedDate))
    setAptTime('09:00')
    setAptStaffId(staff[0]?.id ?? '')
    setAptServiceId(services[0]?.id ?? '')
    setAptCustomerName('')
    setAptCustomerPhone('')
    setAptError(null)
    setNewAptOpen(true)
  }

  async function handleSaveAppointment() {
    if (!aptStaffId)           { setAptError('Selecciona un empleado'); return }
    if (!aptServiceId)         { setAptError('Selecciona un servicio'); return }
    if (!aptDate)              { setAptError('Selecciona una fecha'); return }
    if (!aptTime)              { setAptError('Selecciona una hora'); return }
    if (!aptCustomerName.trim()) { setAptError('El nombre del cliente es obligatorio'); return }

    setAptSaving(true)
    setAptError(null)

    try {
      const supabase = createClient()
      const service = services.find(s => s.id === aptServiceId)
      const endTime = addMinutes(aptTime, service?.duration_min ?? 60)

      // Find existing slot or create a new one
      const { data: existingSlot } = await supabase
        .from('slots')
        .select('id')
        .eq('business_id', business!.id)
        .eq('staff_id', aptStaffId)
        .eq('date', aptDate)
        .eq('start_time', aptTime)
        .maybeSingle()

      let slotId: string

      if (existingSlot) {
        slotId = existingSlot.id
        await supabase.from('slots').update({ booked: true }).eq('id', slotId)
      } else {
        const { data: newSlot, error: slotErr } = await supabase
          .from('slots')
          .insert({
            business_id: business!.id,
            staff_id: aptStaffId,
            date: aptDate,
            start_time: aptTime,
            end_time: endTime,
            booked: true,
          })
          .select('id')
          .single()
        if (slotErr) throw slotErr
        slotId = newSlot.id
      }

      // Create appointment
      const { error: aptErr } = await supabase.from('appointments').insert({
        business_id: business!.id,
        slot_id: slotId,
        service_id: aptServiceId,
        customer_name: aptCustomerName.trim(),
        customer_phone: aptCustomerPhone.trim() || 'N/A',
        status: 'confirmed',
        amount: service?.price ?? 0,
        paid: false,
        reminder_sent: false,
      })
      if (aptErr) throw aptErr

      setNewAptOpen(false)
      // Refresh if the saved date matches the currently displayed date
      if (aptDate === toDateStr(selectedDate)) refresh()
    } catch (err: unknown) {
      setAptError((err as Error).message ?? 'Error al guardar la cita')
    } finally {
      setAptSaving(false)
    }
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (bizLoading) {
    return (
      <div className="space-y-5">
        <div className="flex justify-between items-center">
          <div><Skeleton className="h-6 w-24 mb-1" /><Skeleton className="h-4 w-48" /></div>
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    )
  }

  // ── No business configured ─────────────────────────────────────────────────
  if (!business) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-14 h-14 rounded-full bg-violet-50 flex items-center justify-center mb-4">
          <CalendarX2 className="w-6 h-6 text-violet-400" />
        </div>
        <h2 className="text-base font-semibold text-gray-800">Configura tu negocio primero</h2>
        <p className="text-sm text-gray-400 mt-1 max-w-xs">
          Para ver citas necesitas registrar los datos de tu negocio.
        </p>
        <Button asChild className="mt-5 bg-violet-600 hover:bg-violet-700 text-white gap-2">
          <Link href="/onboarding">
            Ir a configuración <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    )
  }

  // ── Main view ──────────────────────────────────────────────────────────────
  return (
    <>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Agenda</h1>
            <p className="text-sm text-gray-400 mt-0.5">{business.name}</p>
          </div>
          <Button
            onClick={openNewAptDialog}
            className="bg-violet-600 hover:bg-violet-700 text-white gap-2 text-sm h-9"
          >
            <Plus className="w-4 h-4" />
            Nueva cita
          </Button>
        </div>

        {/* Date navigation */}
        <div className="flex items-center gap-2">
          <button onClick={prevDay} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors" aria-label="Día anterior">
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 capitalize text-sm">{formatDateLabel(selectedDate)}</span>
            {isToday && <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">Hoy</span>}
          </div>
          <button onClick={nextDay} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors" aria-label="Día siguiente">
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="border-gray-200">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Total</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              <p className="text-xs text-gray-400 mt-0.5">citas agendadas</p>
            </CardContent>
          </Card>
          <Card className="border-gray-200">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Confirmadas</p>
              <p className="text-3xl font-bold text-violet-600 mt-1">{stats.confirmed}</p>
              <p className="text-xs text-gray-400 mt-0.5">por atender</p>
            </CardContent>
          </Card>
          <Card className="border-gray-200">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Completadas</p>
              <p className="text-3xl font-bold text-emerald-600 mt-1">{stats.completed}</p>
              <p className="text-xs text-gray-400 mt-0.5">finalizadas hoy</p>
            </CardContent>
          </Card>
          <Card className="border-violet-50 border">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Ingreso estimado</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">${stats.revenue.toLocaleString('es-MX')}</p>
              <p className="text-xs text-gray-400 mt-0.5">sin cancelaciones</p>
            </CardContent>
          </Card>
        </div>

        {/* Appointments */}
        <Card className="border-gray-200">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800">
              {loading ? 'Cargando...' : appointments.length > 0
                ? `${appointments.length} cita${appointments.length !== 1 ? 's' : ''}`
                : 'Sin citas para este día'}
            </h2>
            <span className="text-xs text-gray-400">{toDateStr(selectedDate)}</span>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <CalendarX2 className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-600">Sin citas para este día</p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">Las citas de WhatsApp aparecerán aquí automáticamente</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-gray-100">
                    <TableHead className="w-20 text-xs">Hora</TableHead>
                    <TableHead className="text-xs">Cliente</TableHead>
                    <TableHead className="text-xs">Servicio</TableHead>
                    <TableHead className="text-xs">Empleado</TableHead>
                    <TableHead className="text-xs text-right">Precio</TableHead>
                    <TableHead className="text-xs">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map(apt => (
                    <TableRow key={apt.id} className="hover:bg-gray-50/60 transition-colors border-gray-100 cursor-default">
                      <TableCell className="font-mono text-sm font-semibold text-gray-900 py-3.5">{apt.start_time}</TableCell>
                      <TableCell className="py-3.5">
                        <p className="text-sm font-medium text-gray-900">{apt.customer_name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{apt.customer_phone}</p>
                      </TableCell>
                      <TableCell className="text-sm text-gray-700 py-3.5">{apt.service_name}</TableCell>
                      <TableCell className="text-sm text-gray-600 py-3.5">{apt.staff_name}</TableCell>
                      <TableCell className="text-right py-3.5">
                        <span className="text-sm font-semibold text-gray-900">
                          {apt.service_price != null ? `$${apt.service_price.toLocaleString('es-MX')}` : '—'}
                        </span>
                      </TableCell>
                      <TableCell className="py-3.5"><StatusBadge status={apt.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      {/* ── Nueva Cita dialog ────────────────────────────────────────────────── */}
      <Dialog open={newAptOpen} onOpenChange={open => { if (!aptSaving) setNewAptOpen(open) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Nueva cita</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {/* Staff */}
            <div className="space-y-1.5">
              <Label>Empleado <span className="text-red-500">*</span></Label>
              <Select value={aptStaffId} onValueChange={v => { setAptStaffId(v); setAptError(null) }}>
                <SelectTrigger className="focus:ring-violet-500">
                  <SelectValue placeholder="Selecciona un empleado" />
                </SelectTrigger>
                <SelectContent>
                  {staff.filter(s => s.active).map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {staff.length === 0 && (
                <p className="text-xs text-amber-600">Sin empleados registrados. Agrega uno en Onboarding.</p>
              )}
            </div>

            {/* Service */}
            <div className="space-y-1.5">
              <Label>Servicio <span className="text-red-500">*</span></Label>
              <Select value={aptServiceId} onValueChange={v => { setAptServiceId(v); setAptError(null) }}>
                <SelectTrigger className="focus:ring-violet-500">
                  <SelectValue placeholder="Selecciona un servicio" />
                </SelectTrigger>
                <SelectContent>
                  {services.filter(s => s.active).map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} — ${Number(s.price).toLocaleString('es-MX')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date + Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="apt-date">Fecha <span className="text-red-500">*</span></Label>
                <Input
                  id="apt-date"
                  type="date"
                  value={aptDate}
                  onChange={e => { setAptDate(e.target.value); setAptError(null) }}
                  className="focus-visible:ring-violet-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="apt-time">Hora <span className="text-red-500">*</span></Label>
                <Input
                  id="apt-time"
                  type="time"
                  value={aptTime}
                  onChange={e => { setAptTime(e.target.value); setAptError(null) }}
                  className="focus-visible:ring-violet-500"
                />
              </div>
            </div>

            {/* Customer */}
            <div className="space-y-1.5">
              <Label htmlFor="apt-name">Nombre del cliente <span className="text-red-500">*</span></Label>
              <Input
                id="apt-name"
                placeholder="Ej. Juan Pérez"
                value={aptCustomerName}
                onChange={e => { setAptCustomerName(e.target.value); setAptError(null) }}
                className="focus-visible:ring-violet-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="apt-phone">
                Teléfono <span className="text-gray-400 font-normal text-xs">(opcional)</span>
              </Label>
              <Input
                id="apt-phone"
                type="tel"
                placeholder="52443XXXXXXX"
                value={aptCustomerPhone}
                onChange={e => { setAptCustomerPhone(e.target.value); setAptError(null) }}
                className="font-mono focus-visible:ring-violet-500"
              />
            </div>

            {aptError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
                {aptError}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setNewAptOpen(false)} disabled={aptSaving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveAppointment}
              disabled={aptSaving}
              className="bg-violet-600 hover:bg-violet-700 text-white min-w-[100px]"
            >
              {aptSaving ? 'Guardando...' : 'Guardar cita'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
