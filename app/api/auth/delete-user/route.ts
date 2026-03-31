export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const { user_id } = await req.json()
    if (!user_id) return NextResponse.json({ error: 'user_id requerido' }, { status: 400 })

    const supabase = createAdminClient()
    const { error } = await supabase.auth.admin.deleteUser(user_id)
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    return NextResponse.json(
      { error: (err as Error).message ?? 'Error al eliminar usuario' },
      { status: 500 }
    )
  }
}
