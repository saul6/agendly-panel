import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

const PRICE_MAP: Record<string, string | undefined> = {
  basic:   process.env.STRIPE_PRICE_BASIC,
  pro:     process.env.STRIPE_PRICE_PRO,
  negocio: process.env.STRIPE_PRICE_NEGOCIO,
}

export async function POST(req: NextRequest) {
  try {
    const { plan } = await req.json()
    const priceId = PRICE_MAP[plan]
    if (!priceId) {
      return NextResponse.json({ error: 'Plan inválido o precio no configurado' }, { status: 400 })
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { data: business } = await supabase
      .from('businesses')
      .select('id, stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (!business) return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })

    // Get or create Stripe customer
    let customerId: string = business.stripe_customer_id ?? ''
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { business_id: business.id, user_id: user.id },
      })
      customerId = customer.id
      await supabase
        .from('businesses')
        .update({ stripe_customer_id: customerId })
        .eq('id', business.id)
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${appUrl}/onboarding?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/planes`,
      metadata: { business_id: business.id },
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    console.error('[stripe/checkout]', err)
    return NextResponse.json(
      { error: (err as Error).message ?? 'Error interno' },
      { status: 500 }
    )
  }
}
