'use client'

import { useState, useEffect } from 'react'
import {
  CheckCircle2, Circle, ChevronRight, Building2, Scissors,
  Users, CalendarDays, MessageCircle, Mail,
} from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useBusiness } from '@/hooks/use-business'
import { useServices } from '@/hooks/use-services'
import { useStaff } from '@/hooks/use-staff'

// ── Helpers ────────────────────────────────────────────────────────────────────

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + minutes
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

const DAYS = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mié' },
  { value: 4, label: 'Jue' },
  { value: 5, label: 'Vie' },
  { value: 6, label: 'Sáb' },
  { value: 0, label: 'Dom' },
]

// ── Page ───────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const { business, loading: bizLoading } = useBusiness()
  const { services } = useServices(business?.id)
  const { staff, addStaff, refresh: refreshStaff } = useStaff(business?.id)

  // ── Staff dialog ──────────────────────────────────────────────────────────
  const [staffOpen, setStaffOpen] = useState(false)
  const [staffName, setStaffName] = useState('')
  const [staffActive, setStaffActive] = useState(true)
  const [staffSaving, setStaffSaving] = useState(false)
  const [staffError, setStaffError] = useState<string | null>(null)

  function openStaffDialog() {
    setStaffName('')
    setStaffActive(true)
    setStaffError(null)
    setStaffOpen(true)
  }

  async function handleSaveStaff() {
    if (!staffName.trim()) { setStaffError('El nombre es obligatorio'); return }
    if (!business?.id) { setStaffError('Configura tu negocio primero'); return }
    setStaffSaving(true)
    setStaffError(null)
    const { error } = await addStaff({
      business_id: business.id,
      name: staffName.trim(),
      active: staffActive,
    })
    setStaffSaving(false)
    if (error) { setStaffError(error); return }
    setStaffOpen(false)
  }

  // ── Schedule dialog ───────────────────────────────────────────────────────
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [openTime, setOpenTime] = useState('09:00')
  const [closeTime, setCloseTime] = useState('18:00')
  const [slotDuration, setSlotDuration] = useState('60')
  const [scheduleSaving, setScheduleSaving] = useState(false)
  const [scheduleError, setScheduleError] = useState<string | null>(null)
  const [scheduleSuccess, setScheduleSuccess] = useState<string | null>(null)

  function toggleDay(day: number) {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  async function handleGenerateSchedule() {
    if (!business?.id) return
    if (!selectedDays.length) { setScheduleError('Selecciona al menos un día'); return }
    const duration = Number(slotDuration)
    if (!duration || duration < 5) { setScheduleError('Duración mínima: 5 minutos'); return }
    if (openTime >= closeTime) { setScheduleError('La hora de apertura debe ser antes del cierre'); return }

    setScheduleSaving(true)
    setScheduleError(null)
    setScheduleSuccess(null)

    try {
      const supabase = createClient()

      const { data: activeStaff } = await supabase
        .from('staff')
        .select('id')
        .eq('business_id', business.id)
        .eq('active', true)

      if (!activeStaff?.length) {
        setScheduleError('Registra al menos un empleado activo primero')
        return
      }

      type SlotInsert = {
        business_id: string
        staff_id: string
        date: string
        start_time: string
        end_time: string
        booked: boolean
      }

      const slotsToInsert: SlotInsert[] = []

      for (let i = 0; i < 7; i++) {
        const d = new Date()
        d.setDate(d.getDate() + i)
        const dayOfWeek = d.getDay()
        if (!selectedDays.includes(dayOfWeek)) continue
        const dateStr = d.toISOString().split('T')[0]

        let current = openTime
        while (true) {
          const end = addMinutes(current, duration)
          if (end > closeTime) break
          for (const s of activeStaff) {
            slotsToInsert.push({
              business_id: business.id,
              staff_id: s.id,
              date: dateStr,
              start_time: current,
              end_time: end,
              booked: false,
            })
          }
          current = end
        }
      }

      if (!slotsToInsert.length) {
        setScheduleError('No se generaron slots. Revisa los días y horarios.')
        return
      }

      const { error } = await supabase.from('slots').insert(slotsToInsert)
      if (error) throw error

      setScheduleSuccess(`${slotsToInsert.length} slots generados para los próximos 7 días`)
      setHasSlots(true)
    } catch (err: any) {
      setScheduleError(err.message ?? 'Error al generar slots')
    } finally {
      setScheduleSaving(false)
    }
  }

  // ── WhatsApp dialog ───────────────────────────────────────────────────────
  const [waOpen, setWaOpen] = useState(false)

  // ── Step 4: verificar si ya existen slots en la BD ────────────────────────
  const [hasSlots, setHasSlots] = useState(false)

  useEffect(() => {
    if (!business?.id) return
    const supabase = createClient()
    supabase
      .from('slots')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', business.id)
      .then(({ count }) => setHasSlots((count ?? 0) > 0))
  }, [business?.id])

  // ── Completion logic ──────────────────────────────────────────────────────
  function isCompleted(stepId: number): boolean {
    if (stepId === 1) return !!business
    if (stepId === 2) return !!business && services.length > 0
    if (stepId === 3) return !!business && staff.length > 0
    if (stepId === 4) return hasSlots
    return false
  }

  if (bizLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-16 w-full" />
        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
      </div>
    )
  }

  const STEPS = [
    {
      id: 1,
      icon: Building2,
      title: 'Configura tu negocio',
      description: 'Agrega el nombre, tipo y número de WhatsApp de tu negocio.',
      action: 'Completar',
      type: 'link' as const,
      href: '/configuracion',
      requiresBusiness: false,
    },
    {
      id: 2,
      icon: Scissors,
      title: 'Agrega tus servicios',
      description: 'Define los servicios que ofreces con precios y duración.',
      action: 'Agregar servicios',
      type: 'link' as const,
      href: '/servicios',
      requiresBusiness: true,
    },
    {
      id: 3,
      icon: Users,
      title: 'Registra tu equipo',
      description: 'Añade los empleados o profesionales de tu negocio.',
      action: 'Agregar empleado',
      type: 'dialog' as const,
      onClick: openStaffDialog,
      requiresBusiness: true,
    },
    {
      id: 4,
      icon: CalendarDays,
      title: 'Genera tu primer horario',
      description: 'Define los días y horas de atención y genera los slots para los próximos 7 días.',
      action: 'Generar horario',
      type: 'dialog' as const,
      onClick: () => { setScheduleError(null); setScheduleSuccess(null); setScheduleOpen(true) },
      requiresBusiness: true,
    },
    {
      id: 5,
      icon: MessageCircle,
      title: 'Conecta WhatsApp Business',
      description: 'Vincula tu número para empezar a recibir citas automáticamente.',
      action: 'Ver instrucciones',
      type: 'dialog' as const,
      onClick: () => setWaOpen(true),
      requiresBusiness: true,
    },
  ]

  const completedCount = STEPS.filter(s => isCompleted(s.id)).length
  const totalSteps = STEPS.length
  const pct = Math.round((completedCount / totalSteps) * 100)

  return (
    <>
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Configuración inicial</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Completa estos pasos para empezar a recibir citas por WhatsApp
          </p>
        </div>

        {/* Progress */}
        <Card className="border-gray-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-sm font-medium text-gray-700">Progreso general</span>
              <span className="text-sm font-bold text-violet-600">{completedCount} / {totalSteps} pasos</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-600 rounded-full transition-all duration-500"
                style={{ width: pct === 0 ? '4px' : `${pct}%` }}
              />
            </div>
            {completedCount === 0 && (
              <p className="text-xs text-gray-400 mt-2">Comienza configurando tu negocio</p>
            )}
            {completedCount === totalSteps && (
              <p className="text-xs text-emerald-600 font-medium mt-2">Todo listo. Ya puedes recibir citas.</p>
            )}
          </CardContent>
        </Card>

        {/* Steps */}
        <div className="space-y-2">
          {STEPS.map((step) => {
            const Icon = step.icon
            const completed = isCompleted(step.id)
            const blocked = step.requiresBusiness && !business

            return (
              <Card
                key={step.id}
                className={`border-gray-200 transition-all ${
                  completed ? 'bg-gray-50/60' : blocked ? 'opacity-50' : 'hover:border-violet-200'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-300" />
                      )}
                    </div>

                    <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-violet-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                    </div>

                    {!completed && !blocked && (
                      step.type === 'link' ? (
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="flex-shrink-0 text-xs text-violet-600 hover:text-violet-700 hover:bg-violet-50 gap-1 h-7 px-2"
                        >
                          <Link href={step.href}>
                            {step.action}
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={step.onClick}
                          className="flex-shrink-0 text-xs text-violet-600 hover:text-violet-700 hover:bg-violet-50 gap-1 h-7 px-2"
                        >
                          {step.action}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="text-center pt-1">
          <p className="text-xs text-gray-400">
            ¿Necesitas ayuda?{' '}
            <span className="text-violet-600 font-medium">hola@duomindsolutions.com</span>
          </p>
        </div>
      </div>

      {/* ── Staff dialog ─────────────────────────────────────────────────────── */}
      <Dialog open={staffOpen} onOpenChange={open => { if (!staffSaving) setStaffOpen(open) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Agregar empleado</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="staff-name">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="staff-name"
                placeholder="Ej. Carlos López"
                value={staffName}
                onChange={e => { setStaffName(e.target.value); setStaffError(null) }}
                className="focus-visible:ring-violet-500"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-800">Activo</p>
                <p className="text-xs text-gray-400">El empleado estará disponible para citas</p>
              </div>
              <Switch
                checked={staffActive}
                onCheckedChange={setStaffActive}
                className="data-[state=checked]:bg-violet-600"
              />
            </div>

            {staffError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
                {staffError}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setStaffOpen(false)} disabled={staffSaving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveStaff}
              disabled={staffSaving}
              className="bg-violet-600 hover:bg-violet-700 text-white min-w-[100px]"
            >
              {staffSaving ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Schedule dialog ──────────────────────────────────────────────────── */}
      <Dialog open={scheduleOpen} onOpenChange={open => { if (!scheduleSaving) setScheduleOpen(open) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Generar horario semanal</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {/* Day toggles */}
            <div className="space-y-1.5">
              <Label>Días de atención</Label>
              <div className="flex gap-1.5 flex-wrap">
                {DAYS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleDay(value)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                      selectedDays.includes(value)
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Open / close time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="open-time">Hora apertura</Label>
                <Input
                  id="open-time"
                  type="time"
                  value={openTime}
                  onChange={e => { setOpenTime(e.target.value); setScheduleError(null) }}
                  className="focus-visible:ring-violet-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="close-time">Hora cierre</Label>
                <Input
                  id="close-time"
                  type="time"
                  value={closeTime}
                  onChange={e => { setCloseTime(e.target.value); setScheduleError(null) }}
                  className="focus-visible:ring-violet-500"
                />
              </div>
            </div>

            {/* Slot duration */}
            <div className="space-y-1.5">
              <Label htmlFor="slot-duration">Duración de cada cita (minutos)</Label>
              <Input
                id="slot-duration"
                type="number"
                min="5"
                step="5"
                placeholder="60"
                value={slotDuration}
                onChange={e => { setSlotDuration(e.target.value); setScheduleError(null) }}
                className="focus-visible:ring-violet-500"
              />
            </div>

            {scheduleError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
                {scheduleError}
              </p>
            )}
            {scheduleSuccess && (
              <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-md">
                {scheduleSuccess}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setScheduleOpen(false)} disabled={scheduleSaving}>
              {scheduleSuccess ? 'Cerrar' : 'Cancelar'}
            </Button>
            {!scheduleSuccess && (
              <Button
                onClick={handleGenerateSchedule}
                disabled={scheduleSaving}
                className="bg-violet-600 hover:bg-violet-700 text-white min-w-[120px]"
              >
                {scheduleSaving ? 'Generando...' : 'Generar slots'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── WhatsApp instructions dialog ─────────────────────────────────────── */}
      <Dialog open={waOpen} onOpenChange={setWaOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Conectar WhatsApp Business</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {[
              {
                step: '1',
                title: 'Crea una cuenta en Meta Business',
                body: 'Ve a business.facebook.com y crea tu cuenta de Meta Business Suite si aún no tienes una.',
              },
              {
                step: '2',
                title: 'Obtén tu Phone Number ID y Token',
                body: 'En Meta for Developers → tu app → WhatsApp → API Setup. Copia el Phone Number ID y genera un token de acceso permanente.',
              },
              {
                step: '3',
                title: 'Contacta al soporte de Agendly',
                body: 'Envíanos tus credenciales (Phone Number ID y Token) y nosotros activamos tu bot en menos de 24 horas.',
              },
            ].map(({ step, title, body }) => (
              <div key={step} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {step}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{body}</p>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="pt-2">
            <Button asChild className="w-full bg-violet-600 hover:bg-violet-700 text-white gap-2">
              <a href="mailto:hola@duomindsolutions.com">
                <Mail className="w-4 h-4" />
                Ya tengo mis credenciales — contactar soporte
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
