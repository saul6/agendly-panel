'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

const PLANS = [
  {
    key: 'basic',
    name: 'Básico',
    price: '347',
    description: 'Para negocios pequeños',
    features: [
      'Hasta 200 citas/mes',
      '1 empleado',
      'Agendamiento por WhatsApp',
      'Recordatorios automáticos',
      'Soporte por correo',
    ],
    highlighted: false,
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '695',
    description: 'Para negocios en crecimiento',
    features: [
      'Hasta 500 citas/mes',
      'Hasta 5 empleados',
      'Pagos integrados (Conekta)',
      'Reportes avanzados',
      'Soporte prioritario',
    ],
    highlighted: true,
  },
  {
    key: 'negocio',
    name: 'Negocio',
    price: '1,159',
    description: 'Para cadenas y sucursales',
    features: [
      'Citas ilimitadas',
      'Empleados ilimitados',
      'Multi-sucursal',
      'API access',
      'Gerente de cuenta',
    ],
    highlighted: false,
  },
]

export default function PlanesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/registro')
    })
  }, [router])

  async function handleSelect(planKey: string) {
    setLoading(planKey)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al crear la sesión de pago')
      window.location.href = data.url
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Error inesperado')
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-14">
          <Link href="/" className="inline-flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity">
            <span className="text-violet-600 text-xl leading-none">✦</span>
            <span className="font-bold text-xl">Agendly</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Elige tu plan</h1>
          <p className="text-gray-500 mt-2">
            IVA incluido · Pago seguro con Stripe · Cancela cuando quieras
          </p>
        </div>

        {error && (
          <p className="text-center text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-8 max-w-md mx-auto">
            {error}
          </p>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          {PLANS.map((plan) => (
            <div
              key={plan.key}
              className={`rounded-2xl border p-8 flex flex-col bg-white ${
                plan.highlighted
                  ? 'border-violet-600 shadow-xl shadow-violet-100'
                  : 'border-gray-200 shadow-sm'
              }`}
            >
              {plan.highlighted && (
                <span className="text-xs font-semibold text-violet-600 uppercase tracking-wider mb-3">
                  Más popular
                </span>
              )}
              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <p className="text-sm text-gray-500 mt-1 mb-6">{plan.description}</p>
              <div className="mb-8">
                <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                <span className="text-gray-500 text-sm ml-1">MXN/mes</span>
              </div>
              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-violet-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => handleSelect(plan.key)}
                disabled={loading !== null}
                className={`w-full ${
                  plan.highlighted
                    ? 'bg-violet-600 hover:bg-violet-700 text-white'
                    : 'bg-gray-900 hover:bg-gray-800 text-white'
                }`}
              >
                {loading === plan.key ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Redirigiendo...
                  </>
                ) : (
                  'Comenzar'
                )}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
