'use client';

import { useAuth } from '../../../contexts/AuthContext';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { CheckCircle, Crown } from 'lucide-react';
import Logo from '../../../components/ui/Logo';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import Loading from '../../../components/ui/Loading';
import CancelSubscriptionButton from '../../../components/payment/CancelSubscriptionButton';
import ReactivateSubscriptionButton from '../../../components/payment/ReactivateSubscriptionButton';
import SubscriptionButton from '../../../components/payment/SubscriptionButton';
import { SUBSCRIPTION_PLANS, getPlanPriority } from '../../../lib/subscription-plans';

function AccountPageContent() {
  const { user, userData, hasActiveSubscription, loading, refreshUserData, invalidateCache } = useAuth();
  const searchParams = useSearchParams();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSubscriptionRequired, setShowSubscriptionRequired] = useState(false);
  const [showError, setShowError] = useState('');
  
  const currentPlan = userData?.subscription?.plan_type ?? 'free';
  const currentPlanPriority = getPlanPriority(currentPlan);
  
  const isPlanDisabled = (planType: string) => currentPlanPriority >= getPlanPriority(planType);
  
  const getPlanButtonLabel = (planType: string, defaultLabel: string) => {
    if (currentPlan === planType) {
      return 'Current Plan';
    }
    if (currentPlanPriority > getPlanPriority(planType)) {
      return 'Included in Your Plan';
    }
    return defaultLabel;
  };

  useEffect(() => {
    const success = searchParams.get('success');
    const subscriptionRequired = searchParams.get('subscription_required');
    const error = searchParams.get('error');

    if (success === 'true') {
      setShowSuccess(true);
      // Invalidate cache and force refresh user data after successful payment
      invalidateCache();
      refreshUserData(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
    
    if (subscriptionRequired === 'true') {
      setShowSubscriptionRequired(true);
      setTimeout(() => setShowSubscriptionRequired(false), 8000);
    }
    
    if (error) {
      setShowError(error === 'subscription_check_failed' 
        ? 'Unable to verify subscription status. Please try again.' 
        : 'An error occurred. Please try again.');
      setTimeout(() => setShowError(''), 5000);
    }
  }, [searchParams, refreshUserData, invalidateCache]);

  if (loading) {
    return <Loading text="Loading your account..." />;
  }

  const isPaidPlan = hasActiveSubscription;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100 flex flex-col">
      <div className="min-h-screen flex flex-col">
        <Navbar variant="app" />
        <div className="flex-1 container mx-auto px-4 pt-32 pb-8">
        <div className="max-w-6xl mx-auto w-full">
          <h1 className="text-4xl font-bold text-neutral-900 mb-6 text-center">
            Account Settings
          </h1>

          {/* Success Message */}
          {showSuccess && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6 flex items-center">
              <CheckCircle className="h-5 w-5 text-primary-600 mr-3" />
              <p className="text-primary-600">Payment successful! Your subscription has been activated.</p>
            </div>
          )}

          {/* Subscription Required Message */}
          {showSubscriptionRequired && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6 flex items-center">
              <Crown className="h-5 w-5 text-primary-600 mr-3" />
              <p className="text-primary-600">A paid subscription is required to access the icon generator. Please choose a plan below.</p>
            </div>
          )}

          {/* Error Message */}
          {showError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 flex items-center">
              <p className="text-red-400">{showError}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Profile Information */}
            <div className="glass-swipe bg-gradient-to-br from-white to-neutral-50 backdrop-blur-md rounded-2xl p-8 border border-neutral-200 shadow-xl hover:shadow-2xl hover:shadow-primary-500/20 transition-all duration-500 hover:scale-105 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <h2 className="text-xl font-semibold text-neutral-900 mb-6 flex items-center">
                  Profile Information
                </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-2">Email</label>
                  <div className="bg-neutral-100 border border-neutral-300 rounded-lg px-4 py-3 text-neutral-900">
                    {user?.email}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-2">Account Created</label>
                  <div className="bg-neutral-100 border border-neutral-300 rounded-lg px-4 py-3 text-neutral-900">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>
              </div>
            </div>

            {/* Subscription Status */}
            <div className="glass-swipe bg-gradient-to-br from-white to-neutral-50 backdrop-blur-md rounded-2xl p-8 border border-neutral-200 shadow-xl hover:shadow-2xl hover:shadow-primary-500/20 transition-all duration-500 hover:scale-105 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <h2 className="text-xl font-semibold text-neutral-900 mb-6 flex items-center">
                  <Crown className="h-5 w-5 mr-2" />
                  Subscription Status
                </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">Current Plan:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    isPaidPlan 
                      ? 'bg-gradient-to-r from-primary-600 to-accent-500 text-white' 
                      : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                  }`}>
                    {(() => {
                      const plan = userData?.subscription?.plan_type || 'free';
                      if (!isPaidPlan) return 'Subscription Required';
                      if (plan === 'enterprise') return 'Enterprise';
                      return plan.charAt(0).toUpperCase() + plan.slice(1);
                    })()}
                  </span>
                </div>
                
                {isPaidPlan ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600">Credits Remaining:</span>
                      <span className="flex items-center text-neutral-900 font-semibold">
                        <Logo width={24} height={24} className="mr-2" />
                        {userData?.usage?.tokens_remaining || 0}
                        {userData?.subscription?.plan_type === 'enterprise' && (
                          <span className="ml-1 text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded border border-primary-200">
                            Enterprise
                          </span>
                        )}
                      </span>
                    </div>

                    {userData?.usage?.total_generations !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-600">Total Generated:</span>
                        <span className="text-neutral-900 font-semibold">
                          {userData.usage.total_generations}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Crown className="h-5 w-5 text-primary-600 mr-2" />
                      <span className="text-primary-600 font-semibold">Access Required</span>
                    </div>
                    <p className="text-neutral-600 text-sm">
                      Subscribe to start generating custom icons with AI. Choose from our flexible plans below to unlock unlimited creativity.
                    </p>
                  </div>
                )}

                {isPaidPlan && userData?.subscription?.current_period_end && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">
                      {userData?.subscription?.cancel_at_period_end ? 'Expires On:' : 'Renews On:'}
                    </span>
                    <span className="text-neutral-900">
                      {new Date(userData.subscription.current_period_end).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {userData?.subscription?.cancel_at_period_end && (
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                    <p className="text-orange-400 text-sm">
                      <strong>Subscription Canceled</strong><br />
                      You'll retain access to all features until {userData.subscription.current_period_end ? new Date(userData.subscription.current_period_end).toLocaleDateString() : 'the end of your billing period'}.
                    </p>
                  </div>
                )}

                {/* Show Cancel button for active subscriptions */}
                {isPaidPlan && !userData?.subscription?.cancel_at_period_end && (
                  <div className="pt-4">
                    <CancelSubscriptionButton className="w-full bg-red-600 hover:bg-red-700 text-neutral-900 px-6 py-3 rounded-lg font-semibold transition-colors" />
                  </div>
                )}

                {/* Show Reactivate button for canceled subscriptions still in grace period */}
                {isPaidPlan && userData?.subscription?.cancel_at_period_end && (
                  <div className="pt-4">
                    <ReactivateSubscriptionButton className="w-full bg-green-600 hover:bg-green-700 text-neutral-900 px-6 py-3 rounded-lg font-semibold transition-colors" />
                  </div>
                )}
              </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="text-center mb-12">
            <div className="flex flex-wrap justify-center gap-4">
              <Link 
                href="/generate" 
                className="bg-gradient-to-r from-orange-500 to-pink-500 text-neutral-900 px-6 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Generate Icons
              </Link>
              <Link 
                href="/library" 
                className="bg-white/10 hover:bg-white/20 text-neutral-900 px-6 py-3 rounded-lg font-semibold transition-colors border border-white/20 hover:border-white/40"
              >
                View Library
              </Link>
            </div>
          </div>

          {/* Pricing Section - Show for users without subscriptions or fully expired subscriptions */}
          {!isPaidPlan && (
            <div className="py-20 bg-neutral-50 rounded-2xl px-4 sm:px-6 md:px-8">
              <div className="container mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-4xl font-bold text-neutral-900 mb-4">
                    {userData?.subscription?.status === 'canceled' ? 'Resubscribe to Continue' : 'Upgrade Your Plan'}
                  </h2>
                  <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
                    {userData?.subscription?.status === 'canceled' ? 'Get back to creating amazing logos with our premium features' : 'Get more credits and unlock premium features'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                  {/* Starter Pack - Credit Refill */}
                  <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-md rounded-2xl p-8 border border-neutral-200 shadow-xl hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-500 hover:scale-105 relative h-full flex flex-col">
                    {/* Credit Refill Badge */}
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                        💰 Credit Refill
                      </div>
                    </div>
                    
                    <div className="text-center mb-8 mt-4">
                      <h3 className="text-2xl font-bold text-neutral-900 mb-2">{SUBSCRIPTION_PLANS.starter.name}</h3>
                      <div className="text-4xl font-bold text-neutral-900 mb-4">
                        ${SUBSCRIPTION_PLANS.starter.price}<span className="text-lg font-normal text-neutral-600"></span>
                      </div>
                      <p className="text-neutral-600">&nbsp;</p>
                    </div>

                    <ul className="space-y-4 mb-8 flex-1">
                      {SUBSCRIPTION_PLANS.starter.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-neutral-600">
                          <svg className="w-5 h-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    
                    <SubscriptionButton
                      priceId={SUBSCRIPTION_PLANS.starter.priceId}
                      planType="starter"
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-neutral-900 py-3 px-6 rounded-full font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-300 text-center block shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      loadingClassName="opacity-50 cursor-not-allowed"
                      disabled={isPlanDisabled('starter')}
                      disabledClassName="opacity-50 cursor-not-allowed"
                    >
                      {getPlanButtonLabel('starter', 'Buy Credits')}
                    </SubscriptionButton>
                  </div>

                  {/* Pro Monthly Plan */}
                  <div className="bg-gradient-to-br from-sunset-500/20 to-coral-500/20 backdrop-blur-md rounded-2xl p-8 border-2 border-sunset-500/50 shadow-2xl hover:shadow-3xl hover:shadow-sunset-500/30 transition-all duration-500 hover:scale-105 relative h-full flex flex-col">
                    {/* Popular Badge */}
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-sunset-500 text-neutral-900 px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                        Most Popular
                      </div>
                    </div>
                    
                    <div className="text-center mb-8 mt-4">
                      <h3 className="text-2xl font-bold text-neutral-900 mb-2">{SUBSCRIPTION_PLANS.proMonthly.name}</h3>
                      <div className="text-4xl font-bold text-neutral-900 mb-4">
                        ${SUBSCRIPTION_PLANS.proMonthly.price}<span className="text-lg font-normal text-neutral-600">/month</span>
                      </div>
                      <p className="text-neutral-600">For regular creators</p>
                    </div>

                    <ul className="space-y-4 mb-8 flex-1">
                      {SUBSCRIPTION_PLANS.proMonthly.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-neutral-600">
                          <svg className="w-5 h-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    
                    <SubscriptionButton
                      priceId={SUBSCRIPTION_PLANS.proMonthly.priceId}
                      planType="proMonthly"
                      className="w-full bg-gradient-to-r from-primary-600 to-accent-500 text-neutral-900 py-3 px-6 rounded-full font-semibold hover:from-sunset-600 hover:to-primary-700 transition-all duration-300 text-center block shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      loadingClassName="opacity-50 cursor-not-allowed"
                      disabled={isPlanDisabled('proMonthly')}
                      disabledClassName="opacity-50 cursor-not-allowed"
                    >
                      {getPlanButtonLabel('proMonthly', 'Subscribe Monthly')}
                    </SubscriptionButton>
                  </div>

                  {/* Pro Yearly Plan - Best Value */}
                  <div className="bg-gradient-to-br from-purple-500/20 to-indigo-500/20 backdrop-blur-md rounded-2xl p-8 border-2 border-purple-500/50 shadow-xl hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-105 relative h-full flex flex-col">
                    {/* Best Value Badge */}
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-1.5 rounded-full text-xs font-bold shadow-lg whitespace-nowrap">
                        Save 20% 🎉
                      </div>
                    </div>
                    
                    <div className="text-center mb-8 mt-4">
                      <h3 className="text-2xl font-bold text-neutral-900 mb-2">{SUBSCRIPTION_PLANS.proYearly.name}</h3>
                      <div className="text-4xl font-bold text-neutral-900 mb-2">
                        ${SUBSCRIPTION_PLANS.proYearly.price}<span className="text-lg font-normal text-neutral-600">/year</span>
                      </div>
                      <div className="text-sm text-neutral-500 line-through mb-2">$120/year at monthly rate</div>
                      <p className="text-neutral-600">Save $24 + get bonus credits!</p>
                    </div>

                    <ul className="space-y-4 mb-8 flex-1">
                      {SUBSCRIPTION_PLANS.proYearly.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-neutral-600">
                          <svg className="w-5 h-5 text-purple-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className={index === 0 ? 'font-semibold' : ''}>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <SubscriptionButton
                      priceId={SUBSCRIPTION_PLANS.proYearly.priceId}
                      planType="proYearly"
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 rounded-full font-semibold hover:from-purple-500 hover:to-indigo-500 transition-all duration-300 text-center block shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      loadingClassName="opacity-50 cursor-not-allowed"
                      disabled={isPlanDisabled('proYearly')}
                      disabledClassName="opacity-50 cursor-not-allowed"
                    >
                      {getPlanButtonLabel('proYearly', 'Subscribe Yearly')}
                    </SubscriptionButton>
                  </div>
                </div>

                <div className="text-center mt-12">
                  <p className="text-neutral-600 text-sm max-w-2xl mx-auto">
                    All plans include secure payment processing, instant account upgrades, and access to our customer support. 
                    You can change or cancel your subscription at any time through your account settings.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<Loading text="Loading account settings..." />}>
      <AccountPageContent />
    </Suspense>
  );
} 