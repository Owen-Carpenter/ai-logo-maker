'use client';

import React from 'react';
import { SUBSCRIPTION_PLANS, SubscriptionPlan, getPlanPriority } from '../../lib/subscription-plans';
import SubscriptionButton from './SubscriptionButton';

interface PricingCardProps {
  plan: SubscriptionPlan;
  currentPlan?: string;
  isPopular?: boolean;
  variant?: 'dark' | 'light';
}

export default function PricingCard({ plan, currentPlan, isPopular, variant = 'light' }: PricingCardProps) {
  const planData = SUBSCRIPTION_PLANS[plan];
  const isCurrentPlan = currentPlan === plan;
  const planPriority = getPlanPriority(plan);
  const currentPlanPriority = getPlanPriority(currentPlan);
  // Starter pack is always available as a refill, not a downgrade
  const isDowngrade = plan === 'starter' ? false : currentPlanPriority > planPriority;

  // Safety check - if planData is undefined, return error state
  if (!planData) {
    console.error(`Invalid plan type: ${plan}. Available plans: ${Object.keys(SUBSCRIPTION_PLANS).join(', ')}`);
    return (
      <div className="relative bg-red-500/10 backdrop-blur-sm rounded-2xl shadow-xl border border-red-500/20 p-8">
        <div className="text-center">
          <h3 className="text-xl font-bold text-red-400 mb-2">Invalid Plan</h3>
          <p className="text-red-300 text-sm">Plan '{plan}' not found</p>
        </div>
      </div>
    );
  }

  // Get plan-specific styling matching marketing page
  const getCardStyles = () => {
    if (plan === 'starter') {
      return 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-md rounded-2xl p-8 border border-neutral-200 shadow-xl hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-500 hover:scale-105 relative h-full flex flex-col';
    } else if (plan === 'proMonthly') {
      return 'bg-gradient-to-br from-sunset-500/20 to-coral-500/20 backdrop-blur-md rounded-2xl p-8 border-2 border-sunset-500/50 shadow-2xl hover:shadow-3xl hover:shadow-sunset-500/30 transition-all duration-500 hover:scale-105 relative h-full flex flex-col';
    } else if (plan === 'proYearly') {
      return 'bg-gradient-to-br from-purple-500/20 to-indigo-500/20 backdrop-blur-md rounded-2xl p-8 border-2 border-purple-500/50 shadow-xl hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-105 relative h-full flex flex-col';
    }
    return 'bg-gradient-to-br from-white to-neutral-50 backdrop-blur-md rounded-2xl shadow-xl border border-neutral-200 p-8 transition-all duration-300 hover:shadow-2xl hover:scale-105 relative h-full flex flex-col';
  };

  // Get checkmark color based on plan
  const getCheckColor = () => {
    if (plan === 'starter' || plan === 'proMonthly') {
      return 'text-green-400';
    } else if (plan === 'proYearly') {
      return 'text-purple-500';
    }
    return 'text-green-400';
  };

  // Get button styles based on plan
  const getButtonStyles = () => {
    if (plan === 'starter') {
      return 'w-full bg-gradient-to-r from-green-500 to-emerald-500 text-neutral-900 py-3 px-6 rounded-full font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-300 text-center block shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed';
    } else if (plan === 'proMonthly') {
      return 'w-full bg-gradient-to-r from-primary-600 to-accent-500 text-neutral-900 py-3 px-6 rounded-full font-semibold hover:from-sunset-600 hover:to-primary-700 transition-all duration-300 text-center block shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed';
    } else if (plan === 'proYearly') {
      return 'w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 rounded-full font-semibold hover:from-purple-500 hover:to-indigo-500 transition-all duration-300 text-center block shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed';
    }
    return 'w-full py-3 px-6 rounded-full font-semibold transition-all duration-300 text-center block';
  };

  // Format plan name for display
  const getFormattedPlanName = (planType: string) => {
    if (planType === 'starter') return 'Starter Pack';
    if (planType === 'proMonthly') return 'Pro Monthly';
    if (planType === 'proYearly') return 'Pro Yearly';
    if (planType === 'base') return 'Base';
    if (planType === 'pro') return 'Pro';
    if (planType === 'proPlus') return 'Pro+';
    if (planType === 'enterprise') return 'Enterprise';
    // Fallback: capitalize first letter and add space before capital letters
    return planType.replace(/([A-Z])/g, ' $1').trim().replace(/^./, str => str.toUpperCase());
  };

  return (
    <div className={getCardStyles()}>
      {/* Starter Pack Badge */}
      {plan === 'starter' && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
            💰 Credit Refill
          </div>
        </div>
      )}

      {/* Pro Monthly Popular Badge */}
      {plan === 'proMonthly' && isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-sunset-500 text-neutral-900 px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
            Most Popular
          </div>
        </div>
      )}

      {/* Pro Yearly Badge */}
      {plan === 'proYearly' && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-1.5 rounded-full text-xs font-bold shadow-lg whitespace-nowrap">
            Save 20% 🎉
          </div>
        </div>
      )}

      <div className="text-center mb-8 mt-4">
        <h3 className="text-2xl font-bold text-neutral-900 mb-2">{planData.name}</h3>
        <div className={plan === 'proYearly' ? 'mb-2' : 'mb-4'}>
          <span className="text-4xl font-bold text-neutral-900">${planData.price}</span>
          {'isOneTime' in planData && planData.isOneTime ? (
            <span className="text-lg font-normal text-neutral-600"></span>
          ) : 'interval' in planData && planData.interval === 'year' ? (
            <span className="text-lg font-normal text-neutral-600">/year</span>
          ) : 'interval' in planData && planData.interval === 'month' ? (
            <span className="text-lg font-normal text-neutral-600">/month</span>
          ) : (
            <span className="text-lg font-normal text-neutral-600"></span>
          )}
        </div>
        {plan === 'proYearly' && (
          <>
            <div className="text-sm text-neutral-500 line-through mb-2">$240/year at monthly rate</div>
            <p className="text-neutral-600">Best value - same monthly rate, billed annually!</p>
          </>
        )}
        {plan === 'proMonthly' && (
          <p className="text-neutral-600">For regular creators</p>
        )}
        {plan === 'starter' && (
          <p className="text-neutral-600">&nbsp;</p>
        )}
      </div>

      <ul className="space-y-4 mb-8 flex-1">
        {planData.features.map((feature, index) => (
          <li key={index} className="flex items-center text-neutral-600">
            <svg className={`w-5 h-5 ${getCheckColor()} mr-3`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className={plan === 'proYearly' && index === 0 ? 'font-semibold' : ''}>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto">
        {isCurrentPlan ? (
          <div className="w-full bg-green-600 text-white py-3 px-6 rounded-full text-center font-semibold cursor-default pointer-events-none shadow-lg opacity-90">
            ✓ {getFormattedPlanName(plan)}
          </div>
        ) : (
          <SubscriptionButton
            priceId={planData.priceId!}
            planType={plan}
            className={getButtonStyles()}
            loadingClassName="opacity-50 cursor-not-allowed"
            disabled={isDowngrade}
            disabledClassName="opacity-50 cursor-not-allowed"
          >
            {plan === 'starter' 
              ? (currentPlan ? 'Refill Credits (+25)' : 'Buy Credits')
              : isDowngrade 
                ? 'Included in Your Plan' 
                : plan === 'proMonthly'
                  ? 'Subscribe Monthly'
                  : plan === 'proYearly'
                    ? 'Subscribe Yearly'
                    : `Upgrade to ${planData.name}`}
          </SubscriptionButton>
        )}
      </div>
    </div>
  );
} 