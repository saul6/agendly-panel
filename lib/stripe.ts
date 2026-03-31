import Stripe from 'stripe'

/** Call inside request handlers — never at module level. */
export function getStripe(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16',
  })
}
