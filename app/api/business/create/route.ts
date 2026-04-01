export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const { user_id, name, type } = await req.json()

    if (!user_id || !name || !type) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('businesses')
      .insert({
        user_id,
        name,
        type,
        plan: 'basic',
        plan_status: 'inactive',
        timezone: 'America/Mexico_City',
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ business: data })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message ?? 'Error al crear el negocio' },
      { status: 500 }
    )
  }
}
