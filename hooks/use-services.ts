'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { mockServices } from '@/lib/mock-data'
import type { Service } from '@/types'

export function useServices(businessId: string | null | undefined) {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    // No business → fall back to mock data
    if (!businessId) {
      setServices(mockServices)
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', businessId)
        .order('sort_order')
      if (!error) setServices(data ?? [])
    } finally {
      setLoading(false)
    }
  }, [businessId])

  useEffect(() => { load() }, [load])

  async function toggleService(id: string, active: boolean) {
    const supabase = createClient()
    const { error } = await supabase
      .from('services')
      .update({ active })
      .eq('id', id)
    if (!error) {
      setServices(prev => prev.map(s => s.id === id ? { ...s, active } : s))
    }
  }

  async function upsertService(
    service: Partial<Service> & { business_id: string }
  ): Promise<{ error: string | null }> {
    try {
      const supabase = createClient()
      if (service.id) {
        const { error } = await supabase.from('services').update(service).eq('id', service.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('services').insert(service)
        if (error) throw error
      }
      await load()
      return { error: null }
    } catch (err: any) {
      return { error: err.message ?? 'Error al guardar' }
    }
  }

  return { services, loading, toggleService, upsertService, refresh: load }
}
