import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { data: business } = await supabase
      .from('businesses')
      .select('id, stripe_account_id')
      .eq('user_id', user.id)
      .single()

    if (!business) return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })

    // Get or create Stripe Express account
    let accountId: string = business.stripe_account_id ?? ''
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'MX',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: { business_id: business.id },
      })
      accountId = account.id
      await supabase
        .from('businesses')
        .update({ stripe_account_id: accountId })
        .eq('id', business.id)
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/onboarding?connect=refresh`,
      return_url:  `${appUrl}/onboarding?connect=success`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (err: unknown) {
    console.error('[stripe/connect]', err)
    return NextResponse.json(
      { error: (err as Error).message ?? 'Error interno' },
      { status: 500 }
    )
  }
}
