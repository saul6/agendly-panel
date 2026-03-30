'use client'

import { useState } from 'react'
import { Plus, Clock, Pencil, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
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

// ── Form state type ────────────────────────────────────────────────────────────
interface ServiceForm {
  name: string
  free: boolean       // precio a convenir — oculta el campo precio
  price: string
  duration_min: string
  description: string
  active: boolean
}

const EMPTY_FORM: ServiceForm = {
  name: '',
  free: false,
  price: '',
  duration_min: '',
  description: '',
  active: true,
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function ServiciosPage() {
  const { business, loading: bizLoading, saveBusiness } = useBusiness()
  const { services, loading, toggleService, upsertService, refresh } = useServices(business?.id)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ServiceForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  function set<K extends keyof ServiceForm>(field: K, value: ServiceForm[K]) {
    setForm(prev => ({ ...prev, [field]: value }))
    if (formError) setFormError(null)
  }

  function openDialog() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setDialogOpen(true)
  }

  function openEditDialog(service: (typeof services)[number]) {
    setEditingId(service.id)
    setForm({
      name: service.name,
      free: service.price == null,
      price: service.price != null ? String(service.price) : '',
      duration_min: service.duration_min != null ? String(service.duration_min) : '',
      description: service.description ?? '',
      active: service.active,
    })
    setFormError(null)
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
  }

  async function handleSave() {
    // ── Validation ─────────────────────────────────────────────────────────
    const name = form.name.trim()
    const price = Number(form.price)
    const duration = Number(form.duration_min)

    if (!name) { setFormError('El nombre del servicio es obligatorio'); return }
    if (!form.free && (!form.price || isNaN(price) || price <= 0))
                { setFormError('Ingresa un precio válido mayor a 0'); return }
    if (form.duration_min && (isNaN(duration) || duration <= 0))
                { setFormError('La duración debe ser mayor a 0 minutos'); return }

    setSaving(true)
    setFormError(null)

    try {
      // ── Ensure business exists ─────────────────────────────────────────
      let businessId = business?.id

      if (!businessId) {
        // Auto-create a basic business so the service can be saved.
        // The user can complete the details later in /configuracion.
        const result = await saveBusiness({
          name: 'Mi negocio',
          type: 'otro',
          whatsapp_number: `pending_${Date.now()}`,
          timezone: 'America/Mexico_City',
        })
        if (result.error || !result.data) {
          setFormError(result.error ?? 'No se pudo crear el negocio')
          setSaving(false)
          return
        }
        businessId = result.data.id
      }

      // ── Insert or update service ───────────────────────────────────────
      const { error } = await upsertService({
        ...(editingId ? { id: editingId } : { sort_order: services.length + 1 }),
        business_id: businessId,
        name,
        price: form.free ? null : price,
        duration_min: form.duration_min ? duration : null,
        description: form.description.trim() || null,
        active: form.active,
      })

      if (error) {
        setFormError(error)
        setSaving(false)
        return
      }

      // ── On success: close dialog and refresh list ───────────────────────
      // If business was just created, useServices will auto-refresh when
      // business?.id changes in the next render cycle.
      // If business already existed, call refresh() explicitly.
      if (business?.id) await refresh()

      closeDialog()
    } catch (err: unknown) {
      setFormError((err as Error).message ?? 'Error inesperado')
    } finally {
      setSaving(false)
    }
  }

  // ── Loading / no-business states ──────────────────────────────────────────
  if (bizLoading) {
    return (
      <div className="space-y-5">
        <div className="flex justify-between">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-lg" />)}
        </div>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h2 className="text-base font-semibold text-gray-800">Configura tu negocio primero</h2>
        <p className="text-sm text-gray-400 mt-1">
          Necesitas crear tu negocio antes de agregar servicios.
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
  const activeCount = services.filter(s => s.active).length

  return (
    <>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Servicios</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {loading
                ? '...'
                : `${activeCount} activo${activeCount !== 1 ? 's' : ''} de ${services.length}`}
            </p>
          </div>
          <Button
            onClick={openDialog}
            className="bg-violet-600 hover:bg-violet-700 text-white gap-2 text-sm h-9"
          >
            <Plus className="w-4 h-4" />
            Nuevo servicio
          </Button>
        </div>

        {/* Services grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-lg" />)}
          </div>
        ) : services.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[320px] text-center border border-dashed border-gray-200 rounded-xl">
            <p className="text-sm font-medium text-gray-600">Sin servicios aún</p>
            <p className="text-xs text-gray-400 mt-1">
              Agrega el primer servicio con el botón de arriba
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map(service => (
              <Card
                key={service.id}
                className={`border-gray-200 transition-opacity ${!service.active ? 'opacity-55' : ''}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">
                          {service.name}
                        </h3>
                        {!service.active && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4 shrink-0">
                            Inactivo
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2">{service.description}</p>
                    </div>
                    <Switch
                      defaultChecked={service.active}
                      onCheckedChange={checked => toggleService(service.id, checked)}
                      className="flex-shrink-0 data-[state=checked]:bg-violet-600"
                    />
                  </div>

                  <Separator className="mb-4" />

                  <div className="flex items-center justify-between">
                    {service.duration_min
                      ? (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{service.duration_min} min</span>
                        </div>
                      )
                      : <div />
                    }
                    {service.price
                      ? <span className="text-sm font-bold text-gray-900">${Number(service.price).toLocaleString('es-MX')}</span>
                      : <span className="text-xs font-medium text-gray-400 italic">A convenir</span>
                    }
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(service)}
                    className="w-full mt-3 h-7 text-xs text-violet-600 hover:text-violet-700 hover:bg-violet-50 gap-1.5 justify-start"
                  >
                    <Pencil className="w-3 h-3" />
                    Editar servicio
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── New service dialog ──────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={open => { if (!saving) setDialogOpen(open) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">{editingId ? 'Editar servicio' : 'Nuevo servicio'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="svc-name">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="svc-name"
                placeholder="Ej. Corte + Barba"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                className="focus-visible:ring-violet-500"
                autoFocus
              />
            </div>

            {/* Precio a convenir toggle */}
            <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-800">Precio a convenir</p>
                <p className="text-xs text-gray-400">El cliente acuerda el precio directamente</p>
              </div>
              <Switch
                checked={form.free}
                onCheckedChange={v => { set('free', v); if (v) set('price', '') }}
                className="data-[state=checked]:bg-violet-600"
              />
            </div>

            {/* Price + Duration side by side */}
            <div className={`grid gap-3 ${form.free ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {!form.free && (
                <div className="space-y-1.5">
                  <Label htmlFor="svc-price">
                    Precio (MXN) <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                    <Input
                      id="svc-price"
                      type="number"
                      min="1"
                      placeholder="280"
                      value={form.price}
                      onChange={e => set('price', e.target.value)}
                      className="pl-6 focus-visible:ring-violet-500"
                    />
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="svc-duration">
                  Duración (min) <span className="text-gray-400 font-normal text-xs">(opcional)</span>
                </Label>
                <Input
                  id="svc-duration"
                  type="number"
                  min="5"
                  placeholder="45"
                  value={form.duration_min}
                  onChange={e => set('duration_min', e.target.value)}
                  className="focus-visible:ring-violet-500"
                />
                <p className="text-xs text-gray-400">Déjalo vacío si no aplica para este servicio</p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="svc-desc">
                Descripción <span className="text-gray-400 font-normal text-xs">(opcional)</span>
              </Label>
              <Textarea
                id="svc-desc"
                placeholder="Describe brevemente el servicio para tus clientes"
                value={form.description}
                onChange={e => set('description', e.target.value)}
                rows={2}
                className="resize-none focus-visible:ring-violet-500"
              />
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-800">Activo</p>
                <p className="text-xs text-gray-400">El servicio estará disponible para agendar</p>
              </div>
              <Switch
                checked={form.active}
                onCheckedChange={v => set('active', v)}
                className="data-[state=checked]:bg-violet-600"
              />
            </div>

            {/* Error */}
            {formError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-md">
                {formError}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeDialog}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="bg-violet-600 hover:bg-violet-700 text-white min-w-[100px]"
            >
              {saving ? 'Guardando...' : 'Guardar servicio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
