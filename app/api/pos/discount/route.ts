export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const { code, business_id, subtotal } = await req.json()
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('discounts')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('business_id', business_id)
      .eq('active', true)
      .single()

    if (error || !data) return NextResponse.json({ error: 'Cupón no válido' }, { status: 404 })

    const now = new Date()
    if (data.expires_at && new Date(data.expires_at) < now)
      return NextResponse.json({ error: 'Cupón expirado' }, { status: 400 })
    if (data.max_uses && data.uses_count >= data.max_uses)
      return NextResponse.json({ error: 'Cupón agotado' }, { status: 400 })
    if (data.min_purchase && subtotal < data.min_purchase)
      return NextResponse.json({ error: `Compra mínima $${data.min_purchase}` }, { status: 400 })

    const discountAmount = data.type === 'percentage'
      ? Math.round(subtotal * data.value) / 100
      : Math.min(data.value, subtotal)

    return NextResponse.json({ discount: data, amount: discountAmount })
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
