'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { mockAppointments } from '@/lib/mock-data'
import type { AppointmentRow } from '@/types'

export function useAppointments(
  businessId: string | null | undefined,
  date?: string
) {
  const [appointments, setAppointments] = useState<AppointmentRow[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const dateFilter = date ?? new Date().toISOString().split('T')[0]

  useEffect(() => {
    // No business yet → fall back to mock data for visual preview
    if (!businessId) {
      setAppointments(mockAppointments.filter(a => a.date === dateFilter))
      return
    }

    let cancelled = false
    setLoading(true)

    async function load() {
      try {
        const supabase = createClient()

        // Step 1: booked slots for the selected date
        const { data: slots, error: slotsError } = await supabase
          .from('slots')
          .select('id, start_time, staff ( id, name )')
          .eq('business_id', businessId)
          .eq('date', dateFilter)
          .eq('booked', true)

        if (slotsError) throw slotsError
        if (!slots?.length) {
          if (!cancelled) setAppointments([])
          return
        }

        // Build a map for O(1) look-ups
        const slotMap: Record<string, { start_time: string; staff_name: string }> = {}
        for (const s of slots as any[]) {
          slotMap[s.id] = {
            start_time: s.start_time ?? '00:00',
            staff_name: s.staff?.name ?? '',
          }
        }

        // Step 2: appointments for those slots
        const { data: apts, error: aptsError } = await supabase
          .from('appointments')
          .select('id, customer_name, customer_phone, status, amount, paid, reminder_sent, slot_id, services ( name, price )')
          .in('slot_id', slots.map((s: any) => s.id))

        if (aptsError) throw aptsError

        const rows: AppointmentRow[] = (apts ?? []).map((apt: any) => ({
          id: apt.id,
          date: dateFilter,
          start_time: slotMap[apt.slot_id]?.start_time ?? '00:00',
          customer_name: apt.customer_name ?? 'Cliente',
          customer_phone: apt.customer_phone,
          service_name: apt.services?.name ?? '',
          service_price: Number(apt.amount ?? apt.services?.price ?? 0),
          staff_name: slotMap[apt.slot_id]?.staff_name ?? '',
          status: apt.status as AppointmentRow['status'],
          paid: apt.paid,
          reminder_sent: apt.reminder_sent,
        }))

        rows.sort((a, b) => a.start_time.localeCompare(b.start_time))
        if (!cancelled) setAppointments(rows)
      } catch (err) {
        console.error('[useAppointments]', err)
        if (!cancelled) setAppointments([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [businessId, dateFilter, refreshKey])

  const stats = useMemo(() => {
    const total     = appointments.length
    const confirmed = appointments.filter(a => a.status === 'confirmed').length
    const completed = appointments.filter(a => a.status === 'completed').length
    const cancelled = appointments.filter(a => a.status === 'cancelled').length
    const pending   = appointments.filter(a => a.status === 'pending').length
    const revenue   = appointments
      .filter(a => a.status !== 'cancelled')
      .reduce((sum, a) => sum + (a.service_price ?? 0), 0)
    return { total, confirmed, completed, cancelled, pending, revenue }
  }, [appointments])

  function refresh() { setRefreshKey(k => k + 1) }

  return { appointments, stats, loading, refresh }
}
