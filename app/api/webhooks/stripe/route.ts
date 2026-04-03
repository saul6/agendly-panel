export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'

// ── Helpers ───────────────────────────────────────────────────────────────────

function planStatusFromStripe(status: Stripe.Subscription.Status): string {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'active'
    case 'past_due':
      return 'past_due'
    default:
      return 'inactive'
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const stripe = getStripe()
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
    console.error('[stripe-webhook] Firma inválida:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log(`[stripe-webhook] evento recibido: ${event.type}`)

  const supabase = createAdminClient()

  // ── checkout.session.completed ──────────────────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const customerId = typeof session.customer === 'string'
      ? session.customer
      : (session.customer as Stripe.Customer | null)?.id ?? null

    const subscriptionId = typeof session.subscription === 'string'
      ? session.subscription
      : (session.subscription as Stripe.Subscription | null)?.id ?? null

    if (!customerId) {
      console.warn('[stripe-webhook] checkout.session.completed sin customer_id')
      return NextResponse.json({ received: true })
    }

    let periodEnd: string | null = null
    if (subscriptionId) {
      try {
        const sub = await stripe.subscriptions.retrieve(subscriptionId)
        periodEnd = new Date(sub.current_period_end * 1000).toISOString()
      } catch (err) {
        console.error('[stripe-webhook] Error leyendo suscripción:', err)
      }
    }

    const { data: business, error: findErr } = await supabase
      .from('businesses')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle()

    if (findErr) {
      console.error('[stripe-webhook] Error buscando negocio:', findErr)
      return NextResponse.json({ received: true })
    }

    if (!business) {
      // Fallback: buscar por business_id en metadata (compatibilidad con checkout antiguo)
      const businessId = session.metadata?.business_id
      if (businessId) {
        const { error } = await supabase
          .from('businesses')
          .update({
            plan_status: 'active',
            stripe_subscription_id: subscriptionId,
            ...(periodEnd ? { plan_expires_at: periodEnd } : {}),
          })
          .eq('id', businessId)

        if (error) console.error('[stripe-webhook] Error actualizando negocio (metadata):', error)
        else console.log(`[stripe-webhook] negocio activado: ${businessId}`)
      } else {
        console.warn(`[stripe-webhook] Negocio no encontrado para customer: ${customerId}`)
      }
      return NextResponse.json({ received: true })
    }

    const { error } = await supabase
      .from('businesses')
      .update({
        plan_status: 'active',
        stripe_subscription_id: subscriptionId,
        ...(periodEnd ? { plan_expires_at: periodEnd } : {}),
      })
      .eq('id', business.id)

    if (error) console.error('[stripe-webhook] Error actualizando negocio:', error)
    else console.log(`[stripe-webhook] negocio activado: ${business.id}`)
  }

  // ── customer.subscription.created ──────────────────────────────────────────
  else if (event.type === 'customer.subscription.created') {
    const subscription = event.data.object as Stripe.Subscription
    const customerId = typeof subscription.customer === 'string'
      ? subscription.customer
      : (subscription.customer as Stripe.Customer).id

    const periodEnd = new Date(subscription.current_period_end * 1000).toISOString()

    const { data: business, error: findErr } = await supabase
      .from('businesses')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle()

    if (findErr || !business) {
      console.warn(`[stripe-webhook] Negocio no encontrado para customer: ${customerId}`)
      return NextResponse.json({ received: true })
    }

    const { error } = await supabase
      .from('businesses')
      .update({
        plan_status: planStatusFromStripe(subscription.status),
        stripe_subscription_id: subscription.id,
        plan_expires_at: periodEnd,
      })
      .eq('id', business.id)

    if (error) console.error('[stripe-webhook] Error en subscription.created:', error)
    else console.log(`[stripe-webhook] negocio activado: ${business.id}`)
  }

  // ── customer.subscription.updated ──────────────────────────────────────────
  else if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription
    const customerId = typeof subscription.customer === 'string'
      ? subscription.customer
      : (subscription.customer as Stripe.Customer).id

    const periodEnd = new Date(subscription.current_period_end * 1000).toISOString()
    const planStatus = planStatusFromStripe(subscription.status)

    const { data: business, error: findErr } = await supabase
      .from('businesses')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle()

    if (findErr || !business) {
      console.warn(`[stripe-webhook] Negocio no encontrado para customer: ${customerId}`)
      return NextResponse.json({ received: true })
    }

    const { error } = await supabase
      .from('businesses')
      .update({
        plan_status: planStatus,
        plan_expires_at: periodEnd,
      })
      .eq('id', business.id)

    if (error) console.error('[stripe-webhook] Error en subscription.updated:', error)
    else console.log(`[stripe-webhook] negocio actualizado: ${business.id} → plan_status=${planStatus}`)
  }

  // ── customer.subscription.deleted ──────────────────────────────────────────
  else if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const customerId = typeof subscription.customer === 'string'
      ? subscription.customer
      : (subscription.customer as Stripe.Customer).id

    const { data: business, error: findErr } = await supabase
      .from('businesses')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle()

    if (findErr || !business) {
      console.warn(`[stripe-webhook] Negocio no encontrado para customer: ${customerId}`)
      return NextResponse.json({ received: true })
    }

    const { error } = await supabase
      .from('businesses')
      .update({ plan_status: 'inactive' })
      .eq('id', business.id)

    if (error) console.error('[stripe-webhook] Error en subscription.deleted:', error)
    else console.log(`[stripe-webhook] negocio desactivado: ${business.id}`)
  }

  return NextResponse.json({ received: true })
}
