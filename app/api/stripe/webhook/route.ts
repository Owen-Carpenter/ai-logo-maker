import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe, extractStripePeriod } from '../../../../lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// Create a service role client for webhooks to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

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

  // ============================================================================
  // STARTER PACK (ONE-TIME PURCHASE) LOGIC
  // ============================================================================
  // Starter pack credits go into bonus_token_balance — a separate bucket that
  // never resets and is always spent before subscription credits.
  // - If user has NO subscription: create a starter subscription with bonus credits
  // - If user HAS ANY subscription: just add to bonus_token_balance (works as refill)
  // - monthly_token_limit is never touched here
  // ============================================================================
  if (!subscriptionId || planType === 'starter') {
    console.log('Processing starter pack purchase — adding to bonus_token_balance')
    try {
      const creditsToAdd = 25

      const { data: existingSubscription, error: fetchError } = await supabase
        .from('subscriptions')
        .select('id, plan_type, status')
        .eq('user_id', userId)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching subscription:', fetchError)
        throw fetchError
      }

      if (existingSubscription) {
        // Fetch current bonus balance then increment (service role = no RLS issues)
        const { data: current, error: readErr } = await supabase
          .from('subscriptions')
          .select('bonus_token_balance')
          .eq('id', existingSubscription.id)
          .single()
        if (readErr) throw readErr

        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            bonus_token_balance: (current?.bonus_token_balance || 0) + creditsToAdd,
            stripe_customer_id: customerId,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSubscription.id)
        if (updateError) throw updateError

        console.log(`Added ${creditsToAdd} bonus credits to user ${userId} (plan: ${existingSubscription.plan_type})`)
      } else {
        // No existing subscription — create a starter one with bonus credits
        const { error: insertError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: userId,
            plan_type: 'starter',
            status: 'active',
            monthly_token_limit: 0,       // starter has no recurring base
            bonus_token_balance: creditsToAdd,
            stripe_customer_id: customerId
          })

        if (insertError) throw insertError
        console.log(`Created starter subscription with ${creditsToAdd} bonus credits for user ${userId}`)
      }

      return
    } catch (error) {
      console.error('Error handling starter pack purchase:', error)
      throw error
    }
  }

  // ============================================================================
  // RECURRING SUBSCRIPTION (PROMONTHLY/PROYEARLY) LOGIC
  // ============================================================================
  // Recurring subscriptions reset credits each billing period:
  // - proMonthly: 50 credits reset every month
  // - proYearly: 600 credits reset every year
  // - Billing periods are set from Stripe subscription
  // - Refill credits from starter pack purchases are preserved across resets
  // ============================================================================
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
      p_plan_type: planType || 'starter',
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
  const { data: existingSubscription } = await supabase
    .from('subscriptions')
    .select('user_id, plan_type')
    .eq('stripe_subscription_id', subscription.id)
    .single()

  if (!existingSubscription) {
    console.error(`No subscription found for subscription ${subscription.id}`)
    return
  }

  const priceId = subscription.items.data[0]?.price.id
  const planType = getPlanTypeFromPriceId(priceId)
  const { start: periodStart, end: periodEnd } = extractStripePeriod(subscription as any)

  // monthly_token_limit = base subscription credits only (bonus_token_balance is untouched)
  const newMonthlyLimit = getCreditsForPlan(planType)

  await supabase
    .from('subscriptions')
    .update({
      plan_type: planType,
      status: subscription.status,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      monthly_token_limit: newMonthlyLimit,
      // bonus_token_balance intentionally not touched
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

  // Get the full Stripe subscription to get updated billing periods
  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)
  const { start: newPeriodStart, end: newPeriodEnd } = extractStripePeriod(stripeSubscription as any)

  // Find user by subscription (using new database structure)
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('id, user_id, plan_type, monthly_token_limit, current_period_start, current_period_end')
    .eq('stripe_subscription_id', subscriptionId)
    .single()

  if (!subscription) {
    console.error(`No subscription found for subscription ${subscriptionId}`)
    return
  }

  // ============================================================================
  // CREDIT RESET FOR RECURRING SUBSCRIPTIONS (invoice.payment_succeeded)
  // ============================================================================
  // Only recurring plans hit this path. When the billing period renews:
  //   - Update current_period_start / current_period_end from Stripe
  //   - Reset monthly_token_limit to the plan base (50 or 600)
  //   - bonus_token_balance is NEVER touched — starter pack credits persist forever
  // Usage records from the previous period remain in usage_tracking but will no
  // longer be counted once current_period_start advances past them.
  // ============================================================================
  if (subscription.plan_type === 'proMonthly' || subscription.plan_type === 'proYearly') {
    const basePlanCredits = getCreditsForPlan(subscription.plan_type)

    console.log(`Billing period reset for user ${subscription.user_id} (${subscription.plan_type}): resetting to ${basePlanCredits} subscription credits`)

    await supabase
      .from('subscriptions')
      .update({
        current_period_start: newPeriodStart,
        current_period_end: newPeriodEnd,
        monthly_token_limit: basePlanCredits,
        // bonus_token_balance intentionally untouched
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id)
  }
  // Starter-only users never get recurring invoices so no else branch needed
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  
  const customerId = invoice.customer as string
  
  // Find user by customer ID in subscriptions table
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!subscription) {
    console.error(`No subscription found for customer ${customerId}`)
    return
  }

  // You might want to send an email notification here
  // For now, we'll just log it
}

function getPlanTypeFromPriceId(priceId: string): string {
  // Plan types
  const starterPriceId = process.env.STRIPE_STARTER_PRICE_ID
  const proMonthlyPriceId = process.env.STRIPE_PRO_MONTHLY_PRICE_ID
  const proYearlyPriceId = process.env.STRIPE_PRO_YEARLY_PRICE_ID

  if (priceId === starterPriceId) return 'starter'
  if (priceId === proMonthlyPriceId) return 'proMonthly'
  if (priceId === proYearlyPriceId) return 'proYearly'
  
  // Default to starter if price ID doesn't match (shouldn't happen)
  return 'starter'
}

function getCreditsForPlan(planType: string): number {
  switch (planType) {
    case 'starter':
      return 25 // Starter pack: $10 one-time for 25 credits
    case 'proMonthly':
      return 50 // Pro Monthly: $20/month for 50 credits
    case 'proYearly':
      return 600 // Pro Yearly: $200/year for 600 credits
    default:
      return 0
  }
} 