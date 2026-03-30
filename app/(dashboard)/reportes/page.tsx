import { TrendingUp, Users, CalendarCheck, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

const KPI = [
  {
    label: 'Ingresos del mes',
    value: '$18,420',
    change: '+12%',
    positive: true,
    sub: 'vs mes anterior',
    icon: DollarSign,
  },
  {
    label: 'Citas completadas',
    value: '89',
    change: '+8%',
    positive: true,
    sub: 'este mes',
    icon: CalendarCheck,
  },
  {
    label: 'Clientes únicos',
    value: '47',
    change: '+5%',
    positive: true,
    sub: 'este mes',
    icon: Users,
  },
  {
    label: 'Ticket promedio',
    value: '$207',
    change: '-2%',
    positive: false,
    sub: 'por cita',
    icon: TrendingUp,
  },
]

const TOP_SERVICES = [
  { name: 'Corte + Barba',       count: 38, revenue: 10_640 },
  { name: 'Corte de cabello',    count: 27, revenue:  4_860 },
  { name: 'Tinte completo',      count: 12, revenue:  5_400 },
  { name: 'Afeitado clásico',    count: 11, revenue:  1_650 },
  { name: 'Mechas / Highlights', count:  1, revenue:    650 },
]

const MONTH_BREAKDOWN = [
  { label: 'Confirmadas',      count: 14, color: 'bg-violet-500' },
  { label: 'Completadas',      count: 89, color: 'bg-emerald-500' },
  { label: 'Canceladas',       count:  9, color: 'bg-gray-300' },
  { label: 'No se presentaron', count: 3, color: 'bg-red-400' },
]

export default function ReportesPage() {
  const maxCount = TOP_SERVICES[0].count

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Reportes</h1>
        <p className="text-sm text-gray-400 mt-0.5">Resumen de marzo 2026</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {KPI.map(({ label, value, change, positive, sub, icon: Icon }) => (
          <Card key={label} className="border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide leading-tight">
                  {label}
                </p>
                <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-violet-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`text-xs font-semibold ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
                  {change}
                </span>
                <span className="text-xs text-gray-400">{sub}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Top services */}
        <Card className="border-gray-200 lg:col-span-2">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold text-gray-800">
              Servicios más solicitados
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="space-y-4">
              {TOP_SERVICES.map((svc, i) => (
                <div key={svc.name} className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-gray-300 w-4 text-right">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-800">{svc.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">{svc.count} citas</span>
                        <span className="text-xs font-bold text-gray-900">
                          ${svc.revenue.toLocaleString('es-MX')}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-violet-500 rounded-full transition-all"
                        style={{ width: `${Math.round((svc.count / maxCount) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status breakdown */}
        <Card className="border-gray-200">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold text-gray-800">
              Estado de citas
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="space-y-3">
              {MONTH_BREAKDOWN.map((item, i) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${item.color}`} />
                      <span className="text-xs text-gray-700">{item.label}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-900">{item.count}</span>
                  </div>
                  {i < MONTH_BREAKDOWN.length - 1 && <Separator className="mt-2" />}
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-gray-100">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Total del mes</span>
                <span className="font-bold text-gray-900">
                  {MONTH_BREAKDOWN.reduce((s, i) => s + i.count, 0)} citas
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info note */}
      <div className="bg-violet-50 border border-violet-100 rounded-lg p-4">
        <p className="text-sm font-semibold text-violet-800">Datos en tiempo real próximamente</p>
        <p className="text-xs text-violet-600 mt-0.5">
          Cuando configures tu número de WhatsApp, los reportes se actualizarán automáticamente con datos reales de tu negocio.
        </p>
      </div>
    </div>
  )
}
