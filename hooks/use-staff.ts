'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Staff } from '@/types'

export function useStaff(businessId: string | null | undefined) {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!businessId) { setStaff([]); return }
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('business_id', businessId)
        .order('name')
      if (!error) setStaff(data ?? [])
    } finally {
      setLoading(false)
    }
  }, [businessId])

  useEffect(() => { load() }, [load])

  async function addStaff(
    member: { business_id: string; name: string; active: boolean }
  ): Promise<{ error: string | null }> {
    try {
      const supabase = createClient()
      const { error } = await supabase.from('staff').insert(member)
      if (error) throw error
      await load()
      return { error: null }
    } catch (err: any) {
      return { error: err.message ?? 'Error al guardar' }
    }
  }

  return { staff, loading, addStaff, refresh: load }
}
