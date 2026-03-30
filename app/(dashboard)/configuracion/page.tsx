'use client'

import { useEffect, useState } from 'react'
import { Save, Building2, MessageSquare, Phone, CheckCircle2, CalendarDays, RefreshCw, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
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
import { createClient } from '@/lib/supabase/client'
import { useBusiness } from '@/hooks/use-business'

// ── Schedule helpers ────────────────────────────────────────────────────────────

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

interface ScheduleConfig {
  days: number[]
  openTime: string
  closeTime: string
  durationMin: number
  maxDate: string   // última fecha con slots (para extender semana)
}

const BUSINESS_TYPES = [
  { value: 'barbería',     label: '✂️  Barbería' },
  { value: 'salón',        label: '💇  Salón de belleza' },
  { value: 'consultorio',  label: '🩺  Consultorio médico' },
  { value: 'restaurante',  label: '🍽️  Restaurante' },
  { value: 'spa',          label: '🧖  Spa / Bienestar' },
  { value: 'otro',         label: '🏪  Otro' },
]

export default function ConfiguracionPage() {
  const { business, loading, saveBusiness } = useBusiness()

  const [form, setForm] = useState({
    name: '',
    type: 'barbería',
    whatsapp_number: '',
    welcome_message: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // ── Schedule ────────────────────────────────────────────────────────────────
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig | null>(null)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [openTime, setOpenTime] = useState('09:00')
  const [closeTime, setCloseTime] = useState('18:00')
  const [slotDuration, setSlotDuration] = useState('60')
  const [scheduleSaving, setScheduleSaving] = useState(false)
  const [scheduleError, setScheduleError] = useState<string | null>(null)
  const [scheduleSuccess, setScheduleSuccess] = useState<string | null>(null)
  const [extending, setExtending] = useState(false)
  const [extendMsg, setExtendMsg] = useState<string | null>(null)

  // Populate form when business loads
  useEffect(() => {
    if (business) {
      setForm({
        name:            business.name ?? '',
        type:            business.type ?? 'barbería',
        whatsapp_number: business.whatsapp_number ?? '',
        welcome_message: business.welcome_message ?? '',
      })
    }
  }, [business])

  // Detect current schedule from existing future slots
  useEffect(() => {
    if (!business?.id) return
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    supabase
      .from('slots')
      .select('date, start_time, end_time')
      .eq('business_id', business.id)
      .gte('date', today)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(500)
      .then(({ data }) => {
        if (!data?.length) { setScheduleConfig(null); return }

        const daySet = new Set(
          data.map(s => new Date(s.date + 'T12:00:00').getDay())
        )
        const openT  = data.reduce((min, s) => s.start_time < min ? s.start_time : min, data[0].start_time)
        const closeT = data.reduce((max, s) => s.end_time   > max ? s.end_time   : max, data[0].end_time)
        const [h1, m1] = data[0].start_time.split(':').map(Number)
        const [h2, m2] = data[0].end_time.split(':').map(Number)
        const dur = (h2 * 60 + m2) - (h1 * 60 + m1)
        const maxDate = data[data.length - 1].date

        setScheduleConfig({ days: Array.from(daySet).sort((a, b) => a - b), openTime: openT, closeTime: closeT, durationMin: dur, maxDate })
      })
  }, [business?.id])

  function set(field: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setSaved(false)
    setFormError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setFormError('El nombre del negocio es obligatorio'); return }
    if (!form.whatsapp_number.trim()) { setFormError('El número de WhatsApp es obligatorio'); return }

    setSaving(true)
    setFormError(null)

    const { error } = await saveBusiness({
      name:            form.name.trim(),
      type:            form.type,
      whatsapp_number: form.whatsapp_number.trim().replace(/\D/g, ''),
      welcome_message: form.welcome_message.trim() || null,
    })

    setSaving(false)
    if (error) { setFormError(error); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  // ── Schedule modal ────────────────────────────────────────────────────────

  function openScheduleDialog() {
    if (scheduleConfig) {
      setSelectedDays(scheduleConfig.days)
      setOpenTime(scheduleConfig.openTime)
      setCloseTime(scheduleConfig.closeTime)
      setSlotDuration(String(scheduleConfig.durationMin))
    } else {
      setSelectedDays([1, 2, 3, 4, 5])
      setOpenTime('09:00')
      setCloseTime('18:00')
      setSlotDuration('60')
    }
    setScheduleError(null)
    setScheduleSuccess(null)
    setScheduleOpen(true)
  }

  async function handleSaveSchedule() {
    if (!business?.id) return
    if (!selectedDays.length) { setScheduleError('Selecciona al menos un día'); return }
    const duration = Number(slotDuration)
    if (!duration || duration < 5) { setScheduleError('Duración mínima: 5 minutos'); return }
    if (openTime >= closeTime)     { setScheduleError('La hora de apertura debe ser antes del cierre'); return }

    setScheduleSaving(true)
    setScheduleError(null)

    try {
      const supabase = createClient()
      const today = new Date().toISOString().split('T')[0]

      // a) Borrar slots futuros no reservados
      const { error: delErr } = await supabase
        .from('slots')
        .delete()
        .eq('business_id', business.id)
        .eq('booked', false)
        .gte('date', today)
      if (delErr) throw delErr

      // b) Obtener empleados activos
      const { data: activeStaff } = await supabase
        .from('staff').select('id')
        .eq('business_id', business.id)
        .eq('active', true)
      if (!activeStaff?.length) { setScheduleError('Registra al menos un empleado activo primero'); return }

      // c) Generar nuevos slots para los próximos 7 días
      type SlotInsert = { business_id: string; staff_id: string; date: string; start_time: string; end_time: string; booked: boolean }
      const slots: SlotInsert[] = []

      for (let i = 0; i < 7; i++) {
        const d = new Date(); d.setDate(d.getDate() + i)
        if (!selectedDays.includes(d.getDay())) continue
        const dateStr = d.toISOString().split('T')[0]
        let cur = openTime
        while (true) {
          const end = addMinutes(cur, duration)
          if (end > closeTime) break
          for (const s of activeStaff) slots.push({ business_id: business.id, staff_id: s.id, date: dateStr, start_time: cur, end_time: end, booked: false })
          cur = end
        }
      }

      if (!slots.length) { setScheduleError('No se generaron slots. Revisa días y horarios.'); return }

      const { error: insErr } = await supabase.from('slots').insert(slots)
      if (insErr) throw insErr

      const newConfig: ScheduleConfig = {
        days: selectedDays, openTime, closeTime, durationMin: duration,
        maxDate: slots[slots.length - 1].date,
      }
      setScheduleConfig(newConfig)
      setScheduleSuccess(`Horario actualizado — ${slots.length} slots generados para los próximos 7 días`)
    } catch (err: unknown) {
      setScheduleError((err as Error).message ?? 'Error al guardar horario')
    } finally {
      setScheduleSaving(false)
    }
  }

  async function handleExtendWeek() {
    if (!business?.id || !scheduleConfig) return
    setExtending(true)
    setExtendMsg(null)

    try {
      const supabase = createClient()
      const { days, openTime: oT, closeTime: cT, durationMin: dur, maxDate } = scheduleConfig

      // Fechas que ya tienen slots (para no duplicar)
      const { data: existing } = await supabase
        .from('slots').select('date')
        .eq('business_id', business.id)
      const existingDates = new Set(existing?.map(s => s.date) ?? [])

      const { data: activeStaff } = await supabase
        .from('staff').select('id')
        .eq('business_id', business.id)
        .eq('active', true)
      if (!activeStaff?.length) { setExtendMsg('No hay empleados activos'); return }

      type SlotInsert = { business_id: string; staff_id: string; date: string; start_time: string; end_time: string; booked: boolean }
      const slots: SlotInsert[] = []
      const base = new Date(maxDate + 'T12:00:00')

      for (let i = 1; i <= 7; i++) {
        const d = new Date(base); d.setDate(base.getDate() + i)
        if (!days.includes(d.getDay())) continue
        const dateStr = d.toISOString().split('T')[0]
        if (existingDates.has(dateStr)) continue

        let cur = oT
        while (true) {
          const end = addMinutes(cur, dur)
          if (end > cT) break
          for (const s of activeStaff) slots.push({ business_id: business.id, staff_id: s.id, date: dateStr, start_time: cur, end_time: end, booked: false })
          cur = end
        }
      }

      if (!slots.length) { setExtendMsg('Los slots de la próxima semana ya están generados'); return }

      const { error } = await supabase.from('slots').insert(slots)
      if (error) throw error

      setScheduleConfig(prev => prev ? { ...prev, maxDate: slots[slots.length - 1].date } : prev)
      setExtendMsg(`${slots.length} slots generados`)
    } catch (err: unknown) {
      setExtendMsg(`Error: ${(err as Error).message ?? 'No se pudo extender'}`)
    } finally {
      setExtending(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="h-48 rounded-lg bg-gray-100 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Configuración</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {business ? 'Edita los datos de tu negocio' : 'Configura tu negocio para empezar a recibir citas'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Información del negocio */}
        <Card className="border-gray-200">
          <CardHeader className="pb-3 pt-5 px-5">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-violet-600" />
              <CardTitle className="text-sm font-semibold text-gray-800">Datos del negocio</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Esta información aparecerá en los mensajes de WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre del negocio <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                placeholder="Ej. Barbería El Estilo"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                className="focus-visible:ring-violet-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="type">Tipo de negocio <span className="text-red-500">*</span></Label>
              <Select value={form.type} onValueChange={v => set('type', v)}>
                <SelectTrigger id="type" className="focus:ring-violet-500">
                  <SelectValue placeholder="Selecciona el tipo" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPES.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp */}
        <Card className="border-gray-200">
          <CardHeader className="pb-3 pt-5 px-5">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-violet-600" />
              <CardTitle className="text-sm font-semibold text-gray-800">WhatsApp Business</CardTitle>
            </div>
            <CardDescription className="text-xs">
              El número desde el que tu bot enviará mensajes
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="whatsapp">Número de WhatsApp <span className="text-red-500">*</span></Label>
              <Input
                id="whatsapp"
                placeholder="52443XXXXXXX (con código de país, sin +)"
                value={form.whatsapp_number}
                onChange={e => set('whatsapp_number', e.target.value)}
                className="font-mono focus-visible:ring-violet-500"
              />
              <p className="text-xs text-gray-400">
                Formato: código de país + lada + número. Ej: 524431234567
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Mensaje de bienvenida */}
        <Card className="border-gray-200">
          <CardHeader className="pb-3 pt-5 px-5">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-violet-600" />
              <CardTitle className="text-sm font-semibold text-gray-800">Mensaje de bienvenida</CardTitle>
            </div>
            <CardDescription className="text-xs">
              El bot lo enviará cuando un cliente escriba por primera vez
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="space-y-1.5">
              <Label htmlFor="welcome">Mensaje</Label>
              <Textarea
                id="welcome"
                placeholder="¡Hola! Bienvenido a [tu negocio]. ¿En qué te puedo ayudar hoy?"
                value={form.welcome_message}
                onChange={e => set('welcome_message', e.target.value)}
                rows={4}
                className="resize-none focus-visible:ring-violet-500"
              />
              <p className="text-xs text-gray-400">
                {form.welcome_message.length}/500 caracteres
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Error */}
        {formError && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
            {formError}
          </p>
        )}

        {/* Save button */}
        <div className="flex items-center justify-between pt-1">
          {saved && (
            <div className="flex items-center gap-1.5 text-emerald-600 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Guardado correctamente</span>
            </div>
          )}
          {!saved && <div />}

          <Button
            type="submit"
            className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
            disabled={saving}
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : business ? 'Guardar cambios' : 'Crear negocio'}
          </Button>
        </div>
      </form>

      {/* ── Horario de atención ─────────────────────────────────────────────── */}
      {business && (
        <Card className="border-gray-200">
          <CardHeader className="pb-3 pt-5 px-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-violet-600" />
                <CardTitle className="text-sm font-semibold text-gray-800">Horario de atención</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={openScheduleDialog}
                className="h-8 text-xs gap-1.5"
              >
                <Pencil className="w-3 h-3" />
                Editar horario
              </Button>
            </div>
            <CardDescription className="text-xs">
              Días y horas en que tu negocio acepta citas
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-4">
            {/* Vista del horario actual */}
            {scheduleConfig ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {DAYS.filter(d => scheduleConfig.days.includes(d.value)).map(d => (
                    <span key={d.value} className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full font-medium">
                      {d.label}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-gray-600">
                  {scheduleConfig.openTime} – {scheduleConfig.closeTime}
                  <span className="text-gray-400 ml-2">· {scheduleConfig.durationMin} min por slot</span>
                </p>
                <p className="text-xs text-gray-400">
                  Slots disponibles hasta el {new Date(scheduleConfig.maxDate + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Sin horario configurado aún</p>
            )}

            <Separator />

            {/* Generar próxima semana */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">Extender disponibilidad</p>
                <p className="text-xs text-gray-400">Genera slots para los 7 días siguientes al último slot actual</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExtendWeek}
                disabled={extending || !scheduleConfig}
                className="h-8 text-xs gap-1.5 shrink-0"
              >
                <RefreshCw className={`w-3 h-3 ${extending ? 'animate-spin' : ''}`} />
                {extending ? 'Generando...' : 'Generar próxima semana'}
              </Button>
            </div>
            {extendMsg && (
              <p className={`text-xs px-3 py-2 rounded-md border ${
                extendMsg.startsWith('Error')
                  ? 'text-red-600 bg-red-50 border-red-100'
                  : 'text-emerald-700 bg-emerald-50 border-emerald-100'
              }`}>
                {extendMsg}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Schedule dialog ─────────────────────────────────────────────────── */}
      <Dialog open={scheduleOpen} onOpenChange={open => { if (!scheduleSaving) setScheduleOpen(open) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Editar horario de atención</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {/* Días */}
            <div className="space-y-2">
              <Label className="text-sm">Días de atención</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map(d => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setSelectedDays(prev =>
                      prev.includes(d.value) ? prev.filter(x => x !== d.value) : [...prev, d.value]
                    )}
                    className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                      selectedDays.includes(d.value)
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Horario */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sch-open">Hora de apertura</Label>
                <Input
                  id="sch-open"
                  type="time"
                  value={openTime}
                  onChange={e => setOpenTime(e.target.value)}
                  className="focus-visible:ring-violet-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sch-close">Hora de cierre</Label>
                <Input
                  id="sch-close"
                  type="time"
                  value={closeTime}
                  onChange={e => setCloseTime(e.target.value)}
                  className="focus-visible:ring-violet-500"
                />
              </div>
            </div>

            {/* Duración */}
            <div className="space-y-1.5">
              <Label htmlFor="sch-dur">Duración por slot (minutos)</Label>
              <Input
                id="sch-dur"
                type="number"
                min="5"
                placeholder="60"
                value={slotDuration}
                onChange={e => setSlotDuration(e.target.value)}
                className="focus-visible:ring-violet-500"
              />
            </div>

            {/* Aviso */}
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 px-3 py-2 rounded-md">
              Al guardar se eliminarán los slots futuros sin reserva y se generarán los nuevos. Las citas ya reservadas no se verán afectadas.
            </p>

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
            <Button
              type="button"
              variant="outline"
              onClick={() => setScheduleOpen(false)}
              disabled={scheduleSaving}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveSchedule}
              disabled={scheduleSaving}
              className="bg-violet-600 hover:bg-violet-700 text-white min-w-[120px]"
            >
              {scheduleSaving ? 'Guardando...' : 'Guardar horario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
