'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ShoppingCart, Trash2, Plus, Minus, Tag, Printer, Mail, RotateCcw, CheckCircle2 } from 'lucide-react'
import { useReactToPrint } from 'react-to-print'

interface CartItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  total: number
  product_id?: string
  service_id?: string
}

interface Discount {
  code: string
  amount: number
  type: string
  value: number
}

interface SaleResult {
  id: string
  total: number
  payment_method: string
  customer_name: string
  created_at: string
}

export default function POSPage() {
  const supabase = createClient()
  const printRef = useRef<HTMLDivElement>(null)

  const [businessId, setBusinessId] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState('')
  const [services, setServices] = useState<{ id: string; name: string; price?: number }[]>([])
  const [products, setProducts] = useState<{ id: string; name: string; price: number; category?: string }[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState<Discount | null>(null)
  const [couponError, setCouponError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash')
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [saleResult, setSaleResult] = useState<SaleResult | null>(null)
  const [emailSending, setEmailSending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: biz } = await supabase.from('businesses').select('id, name').eq('user_id', user.id).single()
      if (!biz) return
      setBusinessId(biz.id)
      setBusinessName(biz.name)
      const [{ data: svcs }, { data: prods }] = await Promise.all([
        supabase.from('services').select('id, name, price').eq('business_id', biz.id).eq('active', true).order('name'),
        supabase.from('products').select('id, name, price, category').eq('business_id', biz.id).eq('active', true).order('name'),
      ])
      setServices(svcs ?? [])
      setProducts(prods ?? [])
    }
    load()
  }, [supabase])

  function addToCart(item: Omit<CartItem, 'quantity' | 'total'>) {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id)
      if (existing) {
        return prev.map(c => c.id === item.id
          ? { ...c, quantity: c.quantity + 1, total: (c.quantity + 1) * c.unit_price }
          : c)
      }
      return [...prev, { ...item, quantity: 1, total: item.unit_price }]
    })
  }

  function updateQty(id: string, delta: number) {
    setCart(prev => prev
      .map(c => c.id === id ? { ...c, quantity: c.quantity + delta, total: (c.quantity + delta) * c.unit_price } : c)
      .filter(c => c.quantity > 0))
  }

  function removeFromCart(id: string) {
    setCart(prev => prev.filter(c => c.id !== id))
  }

  const subtotal = cart.reduce((sum, c) => sum + c.total, 0)
  const discountAmount = discount?.amount ?? 0
  const total = Math.max(0, subtotal - discountAmount)

  async function applyCoupon() {
    if (!couponCode.trim() || !businessId) return
    setCouponError('')
    const res = await fetch('/api/pos/discount', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: couponCode.trim(), business_id: businessId, subtotal }),
    })
    const data = await res.json()
    if (!res.ok) { setCouponError(data.error); return }
    setDiscount({ code: couponCode.trim().toUpperCase(), amount: data.amount, type: data.discount.type, value: data.discount.value })
  }

  async function handleCheckout() {
    if (!businessId || cart.length === 0) return
    setLoading(true)
    try {
      const res = await fetch('/api/pos/sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId,
          customer_name: customerName || null,
          customer_phone: customerPhone || null,
          subtotal,
          discount_amount: discountAmount,
          discount_code: discount?.code ?? null,
          total,
          payment_method: paymentMethod,
          items: cart.map(c => ({
            product_id: c.product_id,
            service_id: c.service_id,
            description: c.description,
            quantity: c.quantity,
            unit_price: c.unit_price,
            total: c.total,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSaleResult({ ...data.sale, customer_name: customerName })
      setShowSuccess(true)
    } catch (err: unknown) {
      alert((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = useReactToPrint({ contentRef: printRef })

  async function handleEmail() {
    if (!customerPhone && !customerName) return
    setEmailSending(true)
    const html = `<div style="font-family:monospace;max-width:300px">
      <h2 style="text-align:center">${businessName}</h2>
      <p style="text-align:center">${new Date().toLocaleString('es-MX')}</p>
      <hr/>
      ${cart.map(c => `<div>${c.quantity}x ${c.description} — $${c.total.toFixed(2)}</div>`).join('')}
      <hr/>
      ${discountAmount > 0 ? `<div>Descuento: -$${discountAmount.toFixed(2)}</div>` : ''}
      <div><strong>TOTAL: $${total.toFixed(2)}</strong></div>
      <div>Pago: ${paymentMethod}</div>
      <hr/>
      <p style="text-align:center">¡Gracias por su preferencia!</p>
    </div>`
    await fetch('/api/pos/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: 'cliente@ejemplo.com', subject: `Ticket ${businessName}`, html }),
    })
    setEmailSending(false)
    setEmailSent(true)
  }

  function newSale() {
    setCart([])
    setCustomerName('')
    setCustomerPhone('')
    setCouponCode('')
    setDiscount(null)
    setPaymentMethod('cash')
    setShowSuccess(false)
    setSaleResult(null)
    setEmailSent(false)
  }

  const paymentLabels = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia' }

  return (
    <div className="h-[calc(100vh-4rem)] flex gap-0 overflow-hidden">
      {/* Left: catalog */}
      <div className="flex-1 overflow-y-auto p-6 border-r border-gray-100">
        <h1 className="text-lg font-bold text-gray-900 mb-4">Punto de Venta</h1>
        <Tabs defaultValue="services">
          <TabsList className="mb-4">
            <TabsTrigger value="services">Servicios</TabsTrigger>
            <TabsTrigger value="products">Productos</TabsTrigger>
          </TabsList>
          <TabsContent value="services">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {services.map(s => (
                <button
                  key={s.id}
                  onClick={() => addToCart({ id: `svc-${s.id}`, description: s.name, unit_price: (s as { price?: number }).price ?? 0, service_id: s.id })}
                  className="text-left p-4 rounded-xl border border-gray-200 hover:border-violet-400 hover:bg-violet-50 transition-all"
                >
                  <p className="font-medium text-sm text-gray-900">{s.name}</p>
                  <p className="text-xs text-violet-600 mt-1">
                    {(s as { price?: number }).price != null ? `$${(s as { price?: number }).price!.toFixed(2)}` : 'A convenir'}
                  </p>
                </button>
              ))}
              {services.length === 0 && <p className="text-sm text-gray-400 col-span-3">No hay servicios activos</p>}
            </div>
          </TabsContent>
          <TabsContent value="products">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {products.map(p => (
                <button
                  key={p.id}
                  onClick={() => addToCart({ id: `prd-${p.id}`, description: p.name, unit_price: p.price, product_id: p.id })}
                  className="text-left p-4 rounded-xl border border-gray-200 hover:border-violet-400 hover:bg-violet-50 transition-all"
                >
                  {p.category && <p className="text-xs text-gray-400 mb-1">{p.category}</p>}
                  <p className="font-medium text-sm text-gray-900">{p.name}</p>
                  <p className="text-xs text-violet-600 mt-1">${p.price.toFixed(2)}</p>
                </button>
              ))}
              {products.length === 0 && <p className="text-sm text-gray-400 col-span-3">No hay productos activos</p>}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Right: cart */}
      <div className="w-96 flex flex-col bg-white">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <ShoppingCart className="w-4 h-4 text-violet-600" />
          <span className="font-semibold text-sm text-gray-800">Carrito</span>
          {cart.length > 0 && <Badge variant="secondary" className="ml-auto">{cart.length}</Badge>}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {cart.length === 0 && (
            <p className="text-center text-sm text-gray-400 mt-8">Agrega servicios o productos</p>
          )}
          {cart.map(item => (
            <div key={item.id} className="flex items-center gap-2 py-2 border-b border-gray-50">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{item.description}</p>
                <p className="text-xs text-gray-400">${item.unit_price.toFixed(2)} c/u</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-sm w-5 text-center">{item.quantity}</span>
                <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <div className="text-right w-16">
                <p className="text-sm font-semibold text-gray-900">${item.total.toFixed(2)}</p>
              </div>
              <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-400">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="px-4 pb-2 pt-1 border-t border-gray-100 space-y-3">
          {/* Customer */}
          <Input placeholder="Nombre del cliente (opcional)" value={customerName} onChange={e => setCustomerName(e.target.value)} className="text-sm h-8" />

          {/* Coupon */}
          <div className="flex gap-2">
            <Input
              placeholder="Código de descuento"
              value={couponCode}
              onChange={e => { setCouponCode(e.target.value.toUpperCase()); setDiscount(null); setCouponError('') }}
              className="text-sm h-8 uppercase"
            />
            <Button variant="outline" size="sm" onClick={applyCoupon} className="h-8 px-3">
              <Tag className="w-3 h-3" />
            </Button>
          </div>
          {couponError && <p className="text-xs text-red-500">{couponError}</p>}
          {discount && <p className="text-xs text-green-600">✓ {discount.code} — -{discount.type === 'percentage' ? `${discount.value}%` : `$${discount.value}`}</p>}

          {/* Totals */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            {discountAmount > 0 && <div className="flex justify-between text-green-600"><span>Descuento</span><span>-${discountAmount.toFixed(2)}</span></div>}
            <div className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t border-gray-100"><span>Total</span><span>${total.toFixed(2)}</span></div>
          </div>

          {/* Payment method */}
          <div className="grid grid-cols-3 gap-1">
            {(['cash', 'card', 'transfer'] as const).map(m => (
              <button
                key={m}
                onClick={() => setPaymentMethod(m)}
                className={`py-1.5 rounded-lg text-xs font-medium border transition-all ${paymentMethod === m ? 'bg-violet-600 text-white border-violet-600' : 'border-gray-200 text-gray-600 hover:border-violet-300'}`}
              >
                {paymentLabels[m]}
              </button>
            ))}
          </div>

          <Button
            onClick={handleCheckout}
            disabled={cart.length === 0 || loading}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white h-11 text-base font-semibold"
          >
            {loading ? 'Procesando...' : `Cobrar $${total.toFixed(2)}`}
          </Button>
        </div>
      </div>

      {/* Hidden print template */}
      <div className="hidden">
        <div ref={printRef} style={{ width: '58mm', fontFamily: 'monospace', fontSize: '11px', padding: '4mm' }}>
          <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}>{businessName}</div>
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>{new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}</div>
          {customerName && <div>Cliente: {customerName}</div>}
          <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
          {cart.map((c, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{c.quantity}x {c.description}</span>
              <span>${c.total.toFixed(2)}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
          {discountAmount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Descuento</span><span>-${discountAmount.toFixed(2)}</span></div>}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px' }}><span>TOTAL</span><span>${total.toFixed(2)}</span></div>
          <div>Pago: {paymentLabels[paymentMethod]}</div>
          {paymentMethod === 'card' && <div style={{ marginTop: '16px', borderTop: '1px solid #000', paddingTop: '4px' }}>Firma: _______________</div>}
          <div style={{ textAlign: 'center', marginTop: '12px' }}>¡Gracias por su preferencia!</div>
        </div>
      </div>

      {/* Success modal */}
      <Dialog open={showSuccess} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="w-5 h-5" /> Venta completada
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-2">
            <p className="text-3xl font-bold text-gray-900">${saleResult?.total?.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-1">{paymentLabels[saleResult?.payment_method as keyof typeof paymentLabels ?? 'cash']}</p>
            {saleResult?.customer_name && <p className="text-sm text-gray-500">{saleResult.customer_name}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="outline" onClick={() => handlePrint()} className="gap-2">
              <Printer className="w-4 h-4" /> Imprimir ticket
            </Button>
            <Button variant="outline" onClick={handleEmail} disabled={emailSending || emailSent} className="gap-2">
              <Mail className="w-4 h-4" /> {emailSent ? 'Email enviado ✓' : emailSending ? 'Enviando...' : 'Enviar por email'}
            </Button>
            <Button onClick={newSale} className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
              <RotateCcw className="w-4 h-4" /> Nueva venta
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
