'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, ChevronDown, Settings, LogOut, Clock } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useBusiness } from '@/hooks/use-business'

// ── Types ─────────────────────────────────────────────────────────────────────

interface TodayAppointment {
  id: string
  customer_name: string | null
  start_time: string
  service_name: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitial(name: string): string {
  return name.trim()[0]?.toUpperCase() ?? '?'
}

/** Hook that closes a panel when a click lands outside `ref` */
function useClickOutside(ref: React.RefObject<HTMLElement | null>, onClose: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    function handler(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [enabled, onClose, ref])
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Header() {
  const router = useRouter()
  const { business } = useBusiness()

  // User email
  const [userEmail, setUserEmail] = useState<string | null>(null)
  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null))
  }, [])

  // Today's pending appointments
  const [todayApts, setTodayApts] = useState<TodayAppointment[]>([])
  useEffect(() => {
    if (!business?.id) return
    const today = new Date().toISOString().split('T')[0]
    const supabase = createClient()

    supabase
      .from('appointments')
      .select(`id, customer_name, services!service_id (name), slots!slot_id (date, start_time)`)
      .eq('business_id', business.id)
      .eq('status', 'confirmed')
      .then(({ data }) => {
        if (!data) return
        type AptRow = {
          id: string
          customer_name: string
          services: { name: string } | null
          slots: { date: string; start_time: string } | null
        }
        const filtered = (data as AptRow[])
          .filter(a => a.slots?.date === today)
          .map(a => ({
            id: a.id,
            customer_name: a.customer_name,
            start_time: a.slots?.start_time ?? '',
            service_name: a.services?.name ?? '',
          }))
          .sort((a, b) => a.start_time.localeCompare(b.start_time))
        setTodayApts(filtered)
      })
  }, [business?.id])

  // Bell dropdown
  const [bellOpen, setBellOpen] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)
  useClickOutside(bellRef, () => setBellOpen(false), bellOpen)

  // User dropdown
  const [userOpen, setUserOpen] = useState(false)
  const userRef = useRef<HTMLDivElement>(null)
  useClickOutside(userRef, () => setUserOpen(false), userOpen)

  async function handleLogout() {
    await createClient().auth.signOut()
    router.push('/login')
  }

  const displayName = business?.name || userEmail || '…'
  const initial     = getInitial(displayName)

  const today = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      <p className="text-sm text-gray-500 capitalize">{today}</p>

      <div className="flex items-center gap-1">

        {/* ── Bell ─────────────────────────────────────────────────────────── */}
        <div ref={bellRef} className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setBellOpen(v => !v)}
            className="text-gray-500 hover:text-gray-700 relative"
          >
            <Bell className="w-[18px] h-[18px]" />
            {todayApts.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                {todayApts.length > 9 ? '9+' : todayApts.length}
              </span>
            )}
          </Button>

          {bellOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-800">Citas pendientes hoy</p>
              </div>
              {todayApts.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-gray-400">Sin notificaciones pendientes</p>
                </div>
              ) : (
                <ul className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                  {todayApts.map(apt => (
                    <li key={apt.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                      <div className="mt-0.5 w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-3.5 h-3.5 text-violet-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {apt.customer_name || 'Cliente'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{apt.service_name}</p>
                        <p className="text-xs text-violet-600 font-medium mt-0.5">{apt.start_time}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* ── User menu ────────────────────────────────────────────────────── */}
        <div ref={userRef} className="relative ml-2">
          <button
            onClick={() => setUserOpen(v => !v)}
            className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-xs font-semibold select-none">
              {initial}
            </div>
            <span className="font-medium max-w-[120px] truncate">{displayName}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${userOpen ? 'rotate-180' : ''}`} />
          </button>

          {userOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
              {/* Email */}
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-xs text-gray-400">Conectado como</p>
                <p className="text-xs font-medium text-gray-700 truncate mt-0.5">{userEmail ?? '…'}</p>
              </div>
              {/* Options */}
              <div className="py-1">
                <Link
                  href="/configuracion"
                  onClick={() => setUserOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings className="w-4 h-4 text-gray-400" />
                  Mi perfil
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  )
}
