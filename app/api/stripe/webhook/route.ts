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

  // Handle one-time payments (like starter pack) - always add credits as refill
  if (!subscriptionId || planType === 'starter') {
    console.log('Processing starter pack refill purchase')
    try {
      // Add credits by increasing the subscription's monthly token limit
      const creditsToAdd = 25 // Starter pack credits
      
      // Get existing subscription for the user (if any)
      const { data: existingSubscription, error: fetchError } = await supabase
        .from('subscriptions')
        .select('id, monthly_token_limit, plan_type, status')
        .eq('user_id', userId)
        .single()
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching subscription:', fetchError)
        throw fetchError
      }

      if (existingSubscription) {
        // User already has a subscription - add credits without changing plan_type
        // This allows starter pack to work as a refill for any plan (proMonthly, proYearly, or previous starter)
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            monthly_token_limit: existingSubscription.monthly_token_limit + creditsToAdd,
            stripe_customer_id: customerId,
            updated_at: new Date().toISOString()
            // Note: We don't update plan_type - keep their existing plan (proMonthly, proYearly, etc.)
          })
          .eq('id', existingSubscription.id)
        
        if (updateError) {
          console.error('Error updating subscription tokens:', updateError)
          throw updateError
        }
        
        console.log(`Successfully added ${creditsToAdd} credits to user ${userId} (existing plan: ${existingSubscription.plan_type})`)
      } else {
        // User has no subscription - create one with starter plan
        const { error: insertError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: userId,
            plan_type: 'starter',
            status: 'active',
            monthly_token_limit: creditsToAdd, // Starter pack credits
            stripe_customer_id: customerId
          })
        
        if (insertError) {
          console.error('Error creating subscription with credits:', insertError)
          throw insertError
        }
        
        console.log(`Successfully created starter subscription with ${creditsToAdd} credits for user ${userId}`)
      }

      return
    } catch (error) {
      console.error('Error handling starter pack purchase:', error)
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
      return 25 // Starter pack: $5 one-time for 25 credits
    case 'proMonthly':
      return 50 // Pro Monthly: $10/month for 50 credits
    case 'proYearly':
      return 700 // Pro Yearly: $96/year for 700 credits (includes 100 bonus)
    default:
      return 0
  }
} 