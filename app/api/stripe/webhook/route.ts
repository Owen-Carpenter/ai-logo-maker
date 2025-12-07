import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe, extractStripePeriod } from '../../../../lib/stripe'
import { supabase } from '../../../../lib/supabase'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (error: any) {
      console.error('Webhook signature verification failed:', error.message)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }


    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  
  const customerId = session.customer as string
  const subscriptionId = session.subscription as string
  const userId = session.metadata?.user_id
  const planType = session.metadata?.plan_type

  if (!userId) {
    console.error('No user_id in session metadata')
    return
  }

  // Handle one-time payments (like starter pack)
  if (!subscriptionId || planType === 'starter') {
    console.log('Processing one-time payment for starter pack')
    try {
      // Add credits directly to user's account
      const creditsToAdd = 25 // Starter pack credits
      
      // Get current user data
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('remaining_tokens')
        .eq('id', userId)
        .single()
      
      if (fetchError) {
        console.error('Error fetching user data:', fetchError)
        throw fetchError
      }

      const currentTokens = userData?.remaining_tokens || 0
      
      // Update user's tokens
      const { error: updateError } = await supabase
        .from('users')
        .update({
          remaining_tokens: currentTokens + creditsToAdd,
          stripe_customer_id: customerId
        })
        .eq('id', userId)
      
      if (updateError) {
        console.error('Error updating user tokens:', updateError)
        throw updateError
      }

      console.log(`Successfully added ${creditsToAdd} credits to user ${userId}`)
      return
    } catch (error) {
      console.error('Error handling one-time payment:', error)
      throw error
    }
  }

  // Handle subscription payments
  try {
    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    
    // Safely convert timestamps (supports both legacy and new Stripe API response shapes)
    const { start: periodStart, end: periodEnd } = extractStripePeriod(subscription as any)
    
    // Use our new webhook subscription upsert function
    const { error } = await supabase.rpc('webhook_upsert_subscription', {
      p_user_id: userId,
      p_stripe_customer_id: customerId,
      p_stripe_subscription_id: subscriptionId,
      p_plan_type: planType || 'free',
      p_status: subscription.status,
      p_current_period_start: periodStart,
      p_current_period_end: periodEnd,
      p_cancel_at_period_end: subscription.cancel_at_period_end || false
    })

    if (error) {
      console.error('Database update error:', error)
      throw error
    }

  } catch (error) {
    console.error('Error handling checkout session completed:', error)
    throw error
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  
  const customerId = subscription.customer as string
  
  // Find user by customer ID in subscriptions table
  const { data: existingSubscription } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!existingSubscription) {
    console.error(`No user found for customer ${customerId}`)
    return
  }

  // Get plan type from price ID
  const priceId = subscription.items.data[0]?.price.id
  const planType = getPlanTypeFromPriceId(priceId)

  const { start: periodStart, end: periodEnd } = extractStripePeriod(subscription as any)

  // Use our new webhook subscription upsert function
  await supabase.rpc('webhook_upsert_subscription', {
    p_user_id: existingSubscription.user_id,
    p_stripe_customer_id: customerId,
    p_stripe_subscription_id: subscription.id,
    p_plan_type: planType,
    p_status: subscription.status,
    p_current_period_start: periodStart,
    p_current_period_end: periodEnd,
    p_cancel_at_period_end: subscription.cancel_at_period_end || false
  })
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  
  // Find subscription record directly
  const { data: existingSubscription } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (!existingSubscription) {
    console.error(`No subscription found for subscription ${subscription.id}`)
    return
  }

  // Get plan type from price ID
  const priceId = subscription.items.data[0]?.price.id
  const planType = getPlanTypeFromPriceId(priceId)

  const { start: periodStart, end: periodEnd } = extractStripePeriod(subscription as any)

  // Update subscription directly
  await supabase
    .from('subscriptions')
    .update({
      plan_type: planType,
      status: subscription.status,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      monthly_token_limit: getCreditsForPlan(planType),
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  
  // Update subscription status to canceled
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      cancel_at_period_end: false,
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id)

}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  
  const customerId = invoice.customer as string
  const subscriptionId = (invoice as any).subscription as string

  if (!subscriptionId) return

  // Find user by subscription (using new database structure)
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('id, user_id, plan_type, monthly_token_limit')
    .eq('stripe_subscription_id', subscriptionId)
    .single()

  if (!subscription) {
    console.error(`No subscription found for subscription ${subscriptionId}`)
    return
  }

  // Note: Token reset is now handled automatically by the usage tracking system
  // based on billing periods. No need to manually reset tokens here.
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  
  const customerId = invoice.customer as string
  
  // Find user by customer ID
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!user) {
    console.error(`No user found for customer ${customerId}`)
    return
  }

  // You might want to send an email notification here
  // For now, we'll just log it
}

function getPlanTypeFromPriceId(priceId: string): string {
  // New plan types
  const starterPriceId = process.env.STRIPE_STARTER_PRICE_ID
  const proMonthlyPriceId = process.env.STRIPE_PRO_MONTHLY_PRICE_ID
  const proYearlyPriceId = process.env.STRIPE_PRO_YEARLY_PRICE_ID
  
  // Legacy plan types
  const basePriceId = process.env.STRIPE_BASE_PRICE_ID
  const proPriceId = process.env.STRIPE_PRO_PRICE_ID
  const proPlusPriceId = process.env.STRIPE_PRO_PLUS_PRICE_ID
  const enterprisePriceId = process.env.STRIPE_UNLIMITED_PRICE_ID

  // New plans
  if (priceId === starterPriceId) return 'starter'
  if (priceId === proMonthlyPriceId) return 'proMonthly'
  if (priceId === proYearlyPriceId) return 'proYearly'
  
  // Legacy plans
  if (priceId === basePriceId) return 'base'
  if (priceId === proPriceId) return 'pro'
  if (priceId === proPlusPriceId) return 'proPlus'
  if (priceId === enterprisePriceId) return 'proPlus'
  
  return 'free'
}

function getCreditsForPlan(planType: string): number {
  switch (planType) {
    case 'free':
      return 0 // Free tier has no credits
    case 'starter':
      return 25 // Starter pack: $5 one-time for 25 credits
    case 'proMonthly':
      return 50 // Pro Monthly: $10/month for 50 credits
    case 'proYearly':
      return 700 // Pro Yearly: $96/year for 700 credits (includes 100 bonus)
    // Legacy plans
    case 'base':
      return 25 // Legacy base tier
    case 'pro':
      return 100 // Legacy pro tier
    case 'proPlus':
      return 200 // Legacy pro+ tier
    case 'enterprise':
      return 200 // Legacy enterprise maps to pro+
    default:
      return 0
  }
} 