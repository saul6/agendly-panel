'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Pencil, Package } from 'lucide-react'

interface Product {
  id: string
  name: string
  price: number
  category: string | null
  stock: number
  track_inventory: boolean
  active: boolean
}

const EMPTY: Omit<Product, 'id'> = { name: '', price: 0, category: '', stock: 0, track_inventory: false, active: true }

export default function ProductosPage() {
  const supabase = createClient()
  const [products, setProducts] = useState<Product[]>([])
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState<Omit<Product, 'id'>>(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: biz } = await supabase.from('businesses').select('id').eq('user_id', user.id).single()
      if (!biz) return
      setBusinessId(biz.id)
      const { data } = await supabase.from('products').select('*').eq('business_id', biz.id).order('name')
      setProducts(data ?? [])
    }
    load()
  }, [supabase])

  function openNew() { setEditing(null); setForm(EMPTY); setOpen(true) }
  function openEdit(p: Product) { setEditing(p); setForm({ name: p.name, price: p.price, category: p.category ?? '', stock: p.stock, track_inventory: p.track_inventory, active: p.active }); setOpen(true) }

  async function save() {
    if (!businessId || !form.name) return
    setSaving(true)
    const payload = { ...form, business_id: businessId, category: form.category || null }
    if (editing) {
      await supabase.from('products').update(payload).eq('id', editing.id)
      setProducts(prev => prev.map(p => p.id === editing.id ? { ...editing, ...form } : p))
    } else {
      const { data } = await supabase.from('products').insert(payload).select().single()
      if (data) setProducts(prev => [...prev, data])
    }
    setSaving(false)
    setOpen(false)
  }

  async function toggleActive(p: Product) {
    await supabase.from('products').update({ active: !p.active }).eq('id', p.id)
    setProducts(prev => prev.map(x => x.id === p.id ? { ...x, active: !x.active } : x))
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Productos</h1>
          <p className="text-xs text-gray-500 mt-0.5">Catálogo de productos disponibles en el POS</p>
        </div>
        <Button onClick={openNew} className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
          <Plus className="w-4 h-4" /> Nuevo producto
        </Button>
      </div>

      <div className="space-y-2">
        {products.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Sin productos — agrega el primero</p>
          </div>
        )}
        {products.map(p => (
          <div key={p.id} className="flex items-center gap-4 px-4 py-3 bg-white border border-gray-100 rounded-xl">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{p.name}</p>
              <p className="text-xs text-gray-400">{p.category ?? 'Sin categoría'}{p.track_inventory ? ` · Stock: ${p.stock}` : ''}</p>
            </div>
            <p className="text-sm font-semibold text-violet-700">${p.price.toFixed(2)}</p>
            <Switch checked={p.active} onCheckedChange={() => toggleActive(p)} className="data-[state=checked]:bg-violet-600" />
            <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="w-4 h-4" /></Button>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Nombre *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Precio (MXN) *</Label><Input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} /></div>
            <div className="space-y-1"><Label>Categoría</Label><Input placeholder="Ej. Shampoo, Accesorios..." value={form.category ?? ''} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} /></div>
            <div className="flex items-center gap-3">
              <Switch checked={form.track_inventory} onCheckedChange={v => setForm(f => ({ ...f, track_inventory: v }))} className="data-[state=checked]:bg-violet-600" />
              <Label>Rastrear inventario</Label>
            </div>
            {form.track_inventory && (
              <div className="space-y-1"><Label>Stock actual</Label><Input type="number" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: parseInt(e.target.value) || 0 }))} /></div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving || !form.name} className="bg-violet-600 hover:bg-violet-700 text-white">
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
