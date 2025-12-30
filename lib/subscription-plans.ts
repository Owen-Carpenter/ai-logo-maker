// Subscription plans configuration (client-safe - no environment variables)
export const SUBSCRIPTION_PLANS = {
  starter: {
    name: 'Starter Pack',
    price: 5,
    priceId: 'starter', // Resolved server-side
    credits: 25,
    isOneTime: true,
    features: [
      '25 credits (one-time)',
      'GPT Image 1 powered logo generation',
      'All style options',
      'Download as PNG',
      'Save logos to library',
      'Commercial usage rights'
    ]
  },
  proMonthly: {
    name: 'Pro Monthly',
    price: 10,
    priceId: 'proMonthly', // Resolved server-side
    credits: 50,
    interval: 'month',
    features: [
      '50 credits per month',
      'GPT Image 1 powered logo generation',
      'All style options',
      'Download as PNG',
      'Save logos to library',
      'Logo improvement & iteration',
      'Commercial usage rights',
      'Priority support'
    ]
  },
  proYearly: {
    name: 'Pro Yearly',
    price: 96,
    priceId: 'proYearly', // Resolved server-side
    credits: 700,
    interval: 'year',
    features: [
      '700 credits per year',
      '100 bonus credits included',
      'Save 20% vs monthly',
      'GPT Image 1 powered logo generation',
      'All style options',
      'Logo improvement & iteration',
      'Commercial usage rights',
      'Priority support'
    ]
  },
  // Legacy plans kept for backwards compatibility
  base: {
    name: 'Base (Legacy)',
    price: 5,
    priceId: 'base',
    credits: 25,
    features: []
  },
  pro: {
    name: 'Pro (Legacy)',
    price: 10,
    priceId: 'pro',
    credits: 100,
    features: []
  },
  proPlus: {
    name: 'Pro+ (Legacy)',
    price: 15,
    priceId: 'proPlus',
    credits: 200,
    features: []
  }
} as const

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS 

const PLAN_PRIORITY: Record<string, number> = {
  starter: 0, // Starter is a refill, not a tiered plan
  base: 1, // Legacy
  proMonthly: 2,
  pro: 2, // Legacy
  proYearly: 3,
  proPlus: 3, // Legacy
}

export function getPlanPriority(plan?: string | null): number {
  if (!plan) {
    return 0
  }

  return PLAN_PRIORITY[plan] ?? 0
}