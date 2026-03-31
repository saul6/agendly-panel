import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

const PLANS = [
  {
    key: 'basic',
    name: 'Básico',
    price: '347',
    description: 'Para negocios pequeños',
    popular: false,
    features: [
      'Hasta 200 citas/mes',
      '1 empleado',
      'Agendamiento por WhatsApp',
      'Recordatorios automáticos',
      'Soporte por correo',
    ],
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '695',
    description: 'Para negocios en crecimiento',
    popular: true,
    features: [
      'Hasta 500 citas/mes',
      'Hasta 5 empleados',
      'Cobros con tarjeta (Stripe)',
      'Reportes avanzados',
      'Soporte prioritario',
    ],
  },
  {
    key: 'negocio',
    name: 'Negocio',
    price: '1,159',
    description: 'Para cadenas y sucursales',
    popular: false,
    features: [
      'Citas ilimitadas',
      'Empleados ilimitados',
      'Multi-sucursal',
      'API access',
      'Gerente de cuenta',
    ],
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-violet-600 text-xl leading-none">✦</span>
            <span className="font-bold text-xl">Agendly</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Iniciar sesión</Button>
            </Link>
            <Link href="/registro">
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white">
                Comenzar
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-violet-50 border border-violet-100 text-violet-700 text-xs font-medium px-3 py-1.5 rounded-full mb-8">
          ✦ Agendamiento por WhatsApp para México
        </div>
        <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
          Tus clientes agendan por WhatsApp.<br />
          <span className="text-violet-600">Tú solo apareces.</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          Agenda, servicio, horario y pago — todo sin salir de WhatsApp.
          Gestiona tu negocio desde un panel simple y sin complicaciones.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/registro">
            <Button size="lg" className="bg-violet-600 hover:bg-violet-700 text-white px-8 h-12 text-base">
              Comenzar
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="h-12 text-base px-8">
              Iniciar sesión
            </Button>
          </Link>
        </div>
        <p className="text-sm text-gray-400 mt-4">Cancela cuando quieras</p>
      </section>

      {/* Features */}
      <section className="bg-gray-50 border-y border-gray-100 py-16">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-8 text-center">
          {[
            { emoji: '📱', title: 'Solo WhatsApp', desc: 'Tus clientes agendan desde donde ya están. Sin apps, sin descargas.' },
            { emoji: '💳', title: 'Cobros automáticos', desc: 'Acepta tarjeta de crédito y débito vía Stripe. El dinero llega directo a tu banco.' },
            { emoji: '⏰', title: 'Recordatorios', desc: 'Reduce el 70% de los no-shows con recordatorios automáticos por WhatsApp.' },
          ].map(f => (
            <div key={f.title} className="p-6">
              <div className="text-3xl mb-4">{f.emoji}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-gray-900">Precios claros, sin sorpresas</h2>
          <p className="text-gray-500 mt-3">IVA incluido · Pago mensual · Cancela cuando quieras</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {PLANS.map((plan) => (
            <div
              key={plan.key}
              className="rounded-2xl border border-gray-200 bg-white p-8 flex flex-col transition-all duration-200 hover:border-purple-600 hover:shadow-lg hover:shadow-purple-200"
            >
              {plan.popular && (
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
              <Link href={`/registro?plan=${plan.key}`}>
                <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white">
                  Comenzar
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-10 text-center text-sm text-gray-400">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-violet-500">✦</span>
          <span className="font-semibold text-gray-600">Agendly</span>
        </div>
        DuoMind Solutions · Zamora, Michoacán · México
      </footer>
    </div>
  )
}
