import { createClient } from './server'
import type { AppointmentRow } from '@/types'
import type { Service } from '@/types'

export async function getAppointmentsByDate(
  businessId: string,
  date: string
): Promise<AppointmentRow[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      id,
      customer_name,
      customer_phone,
      status,
      paid,
      reminder_sent,
      services ( name, price ),
      staff ( name ),
      slots ( date, start_time )
    `)
    .eq('business_id', businessId)
    .order('created_at', { ascending: true })

  if (error) throw error

  return (data ?? [])
    .filter((row: any) => row.slots?.date === date)
    .map((row: any) => ({
      id: row.id,
      date: row.slots?.date ?? date,
      start_time: row.slots?.start_time ?? '00:00',
      customer_name: row.customer_name,
      customer_phone: row.customer_phone,
      service_name: row.services?.name ?? '',
      service_price: row.services?.price ?? 0,
      staff_name: row.staff?.name ?? '',
      status: row.status,
      paid: row.paid,
      reminder_sent: row.reminder_sent,
    }))
}

export async function getBusinessServices(businessId: string): Promise<Service[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('business_id', businessId)
    .order('name')

  if (error) throw error
  return data ?? []
}

export async function getMonthStats(businessId: string, yearMonth: string) {
  const supabase = createClient()

  const startDate = `${yearMonth}-01`
  const endDate = `${yearMonth}-31`

  const { data, error } = await supabase
    .from('appointments')
    .select('status, slots ( date ), services ( price )')
    .eq('business_id', businessId)
    .gte('slots.date', startDate)
    .lte('slots.date', endDate)

  if (error) throw error

  const rows = data ?? []
  const total = rows.length
  const completed = rows.filter((r: any) => r.status === 'completed').length
  const revenue = rows
    .filter((r: any) => r.status === 'completed')
    .reduce((sum: number, r: any) => sum + (r.services?.price ?? 0), 0)

  return { total, completed, revenue }
}
