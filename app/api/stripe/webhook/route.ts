import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: unknown) {
    console.error('[webhook] Firma inválida:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const businessId = session.metadata?.business_id
    if (!businessId) {
      console.error('[webhook] Sin business_id en metadata')
      return NextResponse.json({ received: true })
    }

    const subscriptionId =
      typeof session.subscription === 'string'
        ? session.subscription
        : (session.subscription as Stripe.Subscription | null)?.id ?? null

    // Determine plan from subscription price
    let plan = 'basic'
    if (subscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = subscription.items.data[0]?.price.id
        const planMap: Record<string, string> = {
          [process.env.STRIPE_PRICE_BASIC ?? '']:   'basic',
          [process.env.STRIPE_PRICE_PRO ?? '']:     'pro',
          [process.env.STRIPE_PRICE_NEGOCIO ?? '']: 'negocio',
        }
        if (priceId && planMap[priceId]) plan = planMap[priceId]
      } catch (err) {
        console.error('[webhook] Error leyendo suscripción:', err)
      }
    }

    const supabase = createAdminClient()
    const { error } = await supabase
      .from('businesses')
      .update({
        plan,
        plan_status: 'active',
        active: true,
        stripe_subscription_id: subscriptionId,
      })
      .eq('id', businessId)

    if (error) console.error('[webhook] Error actualizando negocio:', error)
    else console.log(`[webhook] Negocio ${businessId} activado — plan: ${plan}`)
  }

  return NextResponse.json({ received: true })
}
