// ── DB row types (match Supabase schema exactly) ─────────────────────────────

export interface Business {
  id: string
  name: string
  type: string                  // barbería | salón | consultorio | restaurante
  whatsapp_number: string
  plan: string
  plan_status: string
  welcome_message: string | null
  timezone: string
  active: boolean
  created_at: string
  user_id: string | null
  stripe_customer_id: string | null
  stripe_account_id: string | null
  stripe_subscription_id: string | null
}

export interface Service {
  id: string
  business_id: string
  name: string
  price: number | null
  duration_min: number | null
  description: string | null
  sort_order: number
  active: boolean
}

export interface Staff {
  id: string
  business_id: string
  name: string
  avatar_url: string | null
  active: boolean
}

export interface Slot {
  id: string
  business_id: string
  staff_id: string
  date: string
  start_time: string
  end_time: string
  booked: boolean
}

export interface Appointment {
  id: string
  business_id: string
  slot_id: string
  service_id: string
  customer_phone: string
  customer_name: string | null
  status: string
  amount: number
  paid: boolean
  reminder_sent: boolean
  notes: string | null
  created_at: string
}

export interface Payment {
  id: string
  appointment_id: string
  business_id: string
  amount: number
  method: string
  provider: string
  provider_ref: string | null
  status: string
  payment_link: string | null
  paid_at: string | null
  created_at: string
}

// ── View/UI types ─────────────────────────────────────────────────────────────

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'no_show'

/** Denormalized appointment row used by the panel UI */
export interface AppointmentRow {
  id: string
  date: string
  start_time: string
  customer_name: string
  customer_phone: string
  service_name: string
  service_price: number | null
  staff_name: string
  status: AppointmentStatus
  paid: boolean
  reminder_sent: boolean
}
