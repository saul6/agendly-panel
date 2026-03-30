'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Business } from '@/types'

export function useBusiness() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }

        const { data, error } = await supabase
          .from('businesses')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()

        if (error) throw error
        setBusiness(data)
      } catch (err) {
        setError('Error al cargar el negocio')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function saveBusiness(
    updates: Partial<Omit<Business, 'id' | 'created_at' | 'user_id'>>
  ): Promise<{ error: string | null; data: Business | null }> {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { error: 'No autenticado', data: null }

      if (business?.id) {
        // Update existing record
        const { data, error } = await supabase
          .from('businesses')
          .update(updates)
          .eq('id', business.id)
          .select()
          .single()
        if (error) throw error
        setBusiness(data)
        return { error: null, data }
      } else {
        // Create new record
        const { data, error } = await supabase
          .from('businesses')
          .insert({ ...updates, user_id: user.id, plan: 'starter' })
          .select()
          .single()
        if (error) throw error
        setBusiness(data)
        return { error: null, data }
      }
    } catch (err: any) {
      return { error: err.message ?? 'Error al guardar', data: null }
    }
  }

  return { business, loading, error, saveBusiness }
}
