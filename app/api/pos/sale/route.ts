export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      business_id, appointment_id, customer_name, customer_phone,
      subtotal, discount_amount, discount_code, total,
      payment_method, notes, items,
    } = body

    const supabase = createAdminClient()

    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        business_id, appointment_id: appointment_id ?? null,
        customer_name, customer_phone,
        subtotal, discount_amount: discount_amount ?? 0,
        discount_code: discount_code ?? null,
        total, payment_method, notes: notes ?? null,
        status: 'completed',
      })
      .select()
      .single()

    if (saleError) throw saleError

    const saleItems = items.map((item: { product_id?: string; service_id?: string; description: string; quantity: number; unit_price: number; total: number }) => ({
      sale_id: sale.id,
      product_id: item.product_id ?? null,
      service_id: item.service_id ?? null,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.total,
    }))

    const { error: itemsError } = await supabase.from('sale_items').insert(saleItems)
    if (itemsError) throw itemsError

    // Update inventory for tracked products
    for (const item of items) {
      if (item.product_id) {
        await supabase.rpc('decrement_stock', { p_id: item.product_id, qty: item.quantity })
          .then(() => {}) // best-effort
      }
    }

    // Apply discount usage
    if (discount_code) {
      await supabase
        .from('discounts')
        .update({ uses_count: supabase.rpc('increment', { x: 1 }) as unknown as number })
        .eq('code', discount_code)
        .eq('business_id', business_id)
    }

    return NextResponse.json({ sale })
  } catch (err: unknown) {
    console.error('[pos/sale]', err)
    return NextResponse.json({ error: (err as Error).message ?? 'Error interno' }, { status: 500 })
  }
}
