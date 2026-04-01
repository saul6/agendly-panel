'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { History, CreditCard, Banknote, ArrowLeftRight } from 'lucide-react'

interface Sale {
  id: string
  customer_name: string | null
  total: number
  subtotal: number
  discount_amount: number
  payment_method: string
  status: string
  notes: string | null
  created_at: string
  sale_items: { description: string; quantity: number; unit_price: number; total: number }[]
}

const methodIcon = { cash: Banknote, card: CreditCard, transfer: ArrowLeftRight }
const methodLabel = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia' }
const methodColor = { cash: 'bg-green-50 text-green-700', card: 'bg-blue-50 text-blue-700', transfer: 'bg-orange-50 text-orange-700' }

export default function HistorialPage() {
  const supabase = createClient()
  const [sales, setSales] = useState<Sale[]>([])
  const [filtered, setFiltered] = useState<Sale[]>([])
  const [selected, setSelected] = useState<Sale | null>(null)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [methodFilter, setMethodFilter] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: biz } = await supabase.from('businesses').select('id').eq('user_id', user.id).single()
      if (!biz) return
      const { data } = await supabase
        .from('sales')
        .select('*, sale_items(*)')
        .eq('business_id', biz.id)
        .order('created_at', { ascending: false })
      setSales(data ?? [])
      setFiltered(data ?? [])
    }
    load()
  }, [supabase])

  useEffect(() => {
    let result = sales
    if (search) result = result.filter(s => s.customer_name?.toLowerCase().includes(search.toLowerCase()))
    if (methodFilter) result = result.filter(s => s.payment_method === methodFilter)
    if (dateFrom) result = result.filter(s => new Date(s.created_at) >= new Date(dateFrom))
    if (dateTo) result = result.filter(s => new Date(s.created_at) <= new Date(dateTo + 'T23:59:59'))
    setFiltered(result)
  }, [search, methodFilter, dateFrom, dateTo, sales])

  const totalShown = filtered.reduce((sum, s) => sum + s.total, 0)

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Historial de ventas</h1>
          <p className="text-xs text-gray-500">{filtered.length} ventas · Total: ${totalShown.toFixed(2)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Input placeholder="Buscar cliente..." value={search} onChange={e => setSearch(e.target.value)} className="text-sm" />
        <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)} className="text-sm border border-gray-200 rounded-md px-3 py-2 bg-white text-gray-700">
          <option value="">Todos los métodos</option>
          <option value="cash">Efectivo</option>
          <option value="card">Tarjeta</option>
          <option value="transfer">Transferencia</option>
        </select>
        <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="text-sm" />
        <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="text-sm" />
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Sin ventas registradas</p>
          </div>
        )}
        {filtered.map(sale => {
          const Icon = methodIcon[sale.payment_method as keyof typeof methodIcon] ?? Banknote
          return (
            <div
              key={sale.id}
              onClick={() => setSelected(sale)}
              className="flex items-center gap-4 px-4 py-3 bg-white border border-gray-100 rounded-xl cursor-pointer hover:border-violet-200 transition-colors"
            >
              <div className={`p-2 rounded-lg ${methodColor[sale.payment_method as keyof typeof methodColor] ?? 'bg-gray-50 text-gray-600'}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{sale.customer_name ?? 'Cliente sin nombre'}</p>
                <p className="text-xs text-gray-400">{new Date(sale.created_at).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })} · {sale.sale_items.length} item{sale.sale_items.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">${sale.total.toFixed(2)}</p>
                <Badge variant="outline" className="text-xs">{methodLabel[sale.payment_method as keyof typeof methodLabel] ?? sale.payment_method}</Badge>
              </div>
            </div>
          )
        })}
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalle de venta</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="text-xs text-gray-500">{new Date(selected.created_at).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}</div>
              {selected.customer_name && <div className="text-sm"><span className="text-gray-500">Cliente: </span>{selected.customer_name}</div>}
              <div className="border-t border-dashed border-gray-200 pt-3 space-y-1">
                {selected.sale_items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.description}</span>
                    <span>${item.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 pt-2 space-y-1">
                <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span>${selected.subtotal.toFixed(2)}</span></div>
                {selected.discount_amount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Descuento</span><span>-${selected.discount_amount.toFixed(2)}</span></div>}
                <div className="flex justify-between text-base font-bold"><span>Total</span><span>${selected.total.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm text-gray-500"><span>Método de pago</span><span>{methodLabel[selected.payment_method as keyof typeof methodLabel] ?? selected.payment_method}</span></div>
              </div>
              {selected.notes && <div className="text-xs text-gray-400 italic">{selected.notes}</div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
