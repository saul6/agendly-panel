'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Pencil, Tag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Discount {
  id: string
  code: string
  type: 'percentage' | 'fixed'
  value: number
  min_purchase: number
  max_uses: number | null
  uses_count: number
  expires_at: string | null
  active: boolean
}

const EMPTY = { code: '', type: 'percentage' as const, value: 10, min_purchase: 0, max_uses: '', expires_at: '', active: true }

export default function DescuentosPage() {
  const supabase = createClient()
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Discount | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: biz } = await supabase.from('businesses').select('id').eq('user_id', user.id).single()
      if (!biz) return
      setBusinessId(biz.id)
      const { data } = await supabase.from('discounts').select('*').eq('business_id', biz.id).order('created_at', { ascending: false })
      setDiscounts(data ?? [])
    }
    load()
  }, [supabase])

  function openNew() { setEditing(null); setForm(EMPTY); setOpen(true) }
  function openEdit(d: Discount) {
    setEditing(d)
    setForm({ code: d.code, type: d.type, value: d.value, min_purchase: d.min_purchase, max_uses: d.max_uses?.toString() ?? '', expires_at: d.expires_at?.split('T')[0] ?? '', active: d.active })
    setOpen(true)
  }

  async function save() {
    if (!businessId || !form.code) return
    setSaving(true)
    const payload = {
      code: form.code.toUpperCase(),
      type: form.type,
      value: form.value,
      min_purchase: form.min_purchase,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      active: form.active,
      business_id: businessId,
    }
    if (editing) {
      await supabase.from('discounts').update(payload).eq('id', editing.id)
      setDiscounts(prev => prev.map(d => d.id === editing.id ? { ...editing, ...payload, uses_count: editing.uses_count } : d))
    } else {
      const { data } = await supabase.from('discounts').insert({ ...payload, uses_count: 0 }).select().single()
      if (data) setDiscounts(prev => [data, ...prev])
    }
    setSaving(false)
    setOpen(false)
  }

  async function toggleActive(d: Discount) {
    await supabase.from('discounts').update({ active: !d.active }).eq('id', d.id)
    setDiscounts(prev => prev.map(x => x.id === d.id ? { ...x, active: !x.active } : x))
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Descuentos</h1>
          <p className="text-xs text-gray-500 mt-0.5">Cupones de descuento aplicables en el POS</p>
        </div>
        <Button onClick={openNew} className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
          <Plus className="w-4 h-4" /> Nuevo cupón
        </Button>
      </div>

      <div className="space-y-2">
        {discounts.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Tag className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Sin cupones — crea el primero</p>
          </div>
        )}
        {discounts.map(d => (
          <div key={d.id} className="flex items-center gap-4 px-4 py-3 bg-white border border-gray-100 rounded-xl">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-mono font-bold text-gray-900">{d.code}</p>
                <Badge variant="outline" className="text-xs">{d.type === 'percentage' ? `${d.value}%` : `$${d.value}`}</Badge>
              </div>
              <p className="text-xs text-gray-400">
                {d.uses_count}{d.max_uses ? `/${d.max_uses}` : ''} usos
                {d.min_purchase > 0 ? ` · Mín $${d.min_purchase}` : ''}
                {d.expires_at ? ` · Vence ${new Date(d.expires_at).toLocaleDateString('es-MX')}` : ''}
              </p>
            </div>
            <Switch checked={d.active} onCheckedChange={() => toggleActive(d)} className="data-[state=checked]:bg-violet-600" />
            <Button variant="ghost" size="icon" onClick={() => openEdit(d)}><Pencil className="w-4 h-4" /></Button>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar cupón' : 'Nuevo cupón'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Código *</Label><Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="EJ: BIENVENIDO20" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as 'percentage' | 'fixed' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                    <SelectItem value="fixed">Monto fijo ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Valor {form.type === 'percentage' ? '(%)' : '($)'}</Label><Input type="number" min="0" step="0.01" value={form.value} onChange={e => setForm(f => ({ ...f, value: parseFloat(e.target.value) || 0 }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Compra mínima ($)</Label><Input type="number" min="0" step="0.01" value={form.min_purchase} onChange={e => setForm(f => ({ ...f, min_purchase: parseFloat(e.target.value) || 0 }))} /></div>
              <div className="space-y-1"><Label>Usos máximos</Label><Input type="number" min="1" placeholder="Ilimitado" value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))} /></div>
            </div>
            <div className="space-y-1"><Label>Fecha de expiración</Label><Input type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving || !form.code} className="bg-violet-600 hover:bg-violet-700 text-white">
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
