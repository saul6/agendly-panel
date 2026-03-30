/**
 * Mock data — used as fallback / for development until Supabase has real data.
 * Once your business is configured in Supabase, the hooks use real data.
 */
import type { Business, Service, Staff, AppointmentRow } from '@/types'

export const mockBusiness: Business = {
  id: 'mock-biz-001',
  name: 'Barbería El Estilo',
  type: 'barbería',
  whatsapp_number: '524431234567',
  plan: 'starter',
  welcome_message: '¡Hola! Bienvenido a Barbería El Estilo. ¿En qué te puedo ayudar?',
  timezone: 'America/Mexico_City',
  active: true,
  created_at: '2026-01-15T00:00:00Z',
  user_id: null,
}

export const mockStaff: Staff[] = [
  { id: 'staff-1', business_id: 'mock-biz-001', name: 'Juan García',   avatar_url: null, active: true },
  { id: 'staff-2', business_id: 'mock-biz-001', name: 'Carlos López',  avatar_url: null, active: true },
  { id: 'staff-3', business_id: 'mock-biz-001', name: 'Miguel Torres', avatar_url: null, active: true },
]

export const mockServices: Service[] = [
  { id: 'svc-1', business_id: 'mock-biz-001', name: 'Corte de cabello',    description: 'Corte clásico o moderno',                        duration_min: 30,  price: 180, sort_order: 1, active: true  },
  { id: 'svc-2', business_id: 'mock-biz-001', name: 'Corte + Barba',       description: 'Corte más arreglo y perfilado de barba',          duration_min: 45,  price: 280, sort_order: 2, active: true  },
  { id: 'svc-3', business_id: 'mock-biz-001', name: 'Afeitado clásico',    description: 'Afeitado tradicional con navaja y toalla caliente', duration_min: 30, price: 150, sort_order: 3, active: true  },
  { id: 'svc-4', business_id: 'mock-biz-001', name: 'Tinte completo',      description: 'Coloración total con tinte profesional',          duration_min: 90,  price: 450, sort_order: 4, active: true  },
  { id: 'svc-5', business_id: 'mock-biz-001', name: 'Mechas / Highlights', description: 'Técnica de decoloración parcial o balayage',      duration_min: 120, price: 650, sort_order: 5, active: false },
]

const todayStr = new Date().toISOString().split('T')[0]

export const mockAppointments: AppointmentRow[] = [
  { id: 'apt-1', date: todayStr, start_time: '09:00', customer_name: 'Carlos Ramírez',      customer_phone: '524431001001', service_name: 'Corte + Barba',     service_price: 280, staff_name: 'Juan García',   status: 'confirmed',  paid: false, reminder_sent: true  },
  { id: 'apt-2', date: todayStr, start_time: '10:00', customer_name: 'Luis Mendoza',         customer_phone: '524431002002', service_name: 'Corte de cabello',  service_price: 180, staff_name: 'Carlos López',  status: 'completed',  paid: true,  reminder_sent: true  },
  { id: 'apt-3', date: todayStr, start_time: '11:00', customer_name: 'Roberto Soto Ruiz',   customer_phone: '524431003003', service_name: 'Afeitado clásico',  service_price: 150, staff_name: 'Miguel Torres', status: 'confirmed',  paid: false, reminder_sent: false },
  { id: 'apt-4', date: todayStr, start_time: '11:30', customer_name: 'Alejandro Vega',       customer_phone: '524431004004', service_name: 'Corte + Barba',     service_price: 280, staff_name: 'Juan García',   status: 'confirmed',  paid: false, reminder_sent: true  },
  { id: 'apt-5', date: todayStr, start_time: '14:00', customer_name: 'Diego Hernández Cruz', customer_phone: '524431005005', service_name: 'Tinte completo',    service_price: 450, staff_name: 'Carlos López',  status: 'confirmed',  paid: true,  reminder_sent: true  },
  { id: 'apt-6', date: todayStr, start_time: '15:30', customer_name: 'Marco Ríos',           customer_phone: '524431006006', service_name: 'Corte de cabello',  service_price: 180, staff_name: 'Miguel Torres', status: 'confirmed',  paid: false, reminder_sent: false },
  { id: 'apt-7', date: todayStr, start_time: '16:30', customer_name: 'Fernando Castillo',    customer_phone: '524431007007', service_name: 'Corte + Barba',     service_price: 280, staff_name: 'Juan García',   status: 'pending',    paid: false, reminder_sent: false },
  { id: 'apt-8', date: todayStr, start_time: '17:00', customer_name: 'Andrés Morales',       customer_phone: '524431008008', service_name: 'Afeitado clásico',  service_price: 150, staff_name: 'Carlos López',  status: 'cancelled',  paid: false, reminder_sent: false },
]
