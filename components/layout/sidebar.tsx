'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  CalendarDays,
  Scissors,
  BarChart2,
  Settings,
  Rocket,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useBusiness } from '@/hooks/use-business'

const NAV_ITEMS = [
  { href: '/agenda',        label: 'Agenda',           icon: CalendarDays },
  { href: '/servicios',     label: 'Servicios',         icon: Scissors },
  { href: '/reportes',      label: 'Reportes',          icon: BarChart2 },
  { href: '/configuracion', label: 'Configuración',     icon: Settings },
]

const PLAN_LABELS: Record<string, string> = {
  starter:  'Plan Starter',
  basic:    'Plan Básico',
  pro:      'Plan Pro',
  business: 'Plan Negocio',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
}

export function Sidebar() {
  const pathname  = usePathname()
  const router    = useRouter()
  const { business } = useBusiness()
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null)
    })
  }, [])

  async function handleLogout() {
    await createClient().auth.signOut()
    router.push('/login')
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  const displayName = business?.name || userEmail || '…'
  const planLabel   = PLAN_LABELS[business?.plan ?? ''] ?? business?.plan ?? ''
  const initials    = business?.name ? getInitials(business.name) : (userEmail?.[0]?.toUpperCase() ?? '?')

  return (
    <aside className="w-64 flex flex-col h-screen bg-sidebar text-white flex-shrink-0">
      {/* Logo */}
      <Link href="/agenda" className="h-16 flex items-center px-6 border-b border-white/10 hover:opacity-80 transition-opacity">
        <span className="text-violet-300 text-xl mr-2 leading-none">✦</span>
        <span className="font-bold text-xl tracking-tight">Agendly</span>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive(href)
                ? 'bg-violet-800 text-white'
                : 'text-violet-200/80 hover:bg-white/10 hover:text-white'
            )}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {label}
          </Link>
        ))}

        <div className="pt-3 mt-3 border-t border-white/10">
          <Link
            href="/onboarding"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive('/onboarding')
                ? 'bg-violet-800 text-white'
                : 'text-violet-300/70 hover:bg-white/10 hover:text-white'
            )}
          >
            <Rocket className="w-5 h-5 flex-shrink-0" />
            Configurar negocio
          </Link>
        </div>
      </nav>

      {/* Business info + logout */}
      <div className="p-4 border-t border-white/10 space-y-2">
        <div className="flex items-center gap-3 px-1">
          <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold flex-shrink-0 select-none">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{displayName}</p>
            {planLabel && <p className="text-xs text-violet-400">{planLabel}</p>}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-violet-300/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
