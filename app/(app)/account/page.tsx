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
import PricingCard from '../../../components/payment/PricingCard';
import { SUBSCRIPTION_PLANS, getPlanPriority } from '../../../lib/subscription-plans';

function AccountPageContent() {
  const { user, userData, hasActiveSubscription, loading, refreshUserData, invalidateCache } = useAuth();
  const searchParams = useSearchParams();
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSubscriptionRequired, setShowSubscriptionRequired] = useState(false);
  const [showError, setShowError] = useState('');
  const [showContent, setShowContent] = useState(false);
  
  const currentPlan = userData?.subscription?.plan_type ?? null;
  const currentPlanPriority = getPlanPriority(currentPlan);
  
  // Starter pack is always available as a refill, regardless of current plan
  const isPlanDisabled = (planType: string) => {
    if (planType === 'starter') {
      return false; // Starter pack is always available as a refill
    }
    // For subscription plans, check if user already has a higher tier
    return currentPlanPriority >= getPlanPriority(planType);
  };
  
  const getPlanButtonLabel = (planType: string, defaultLabel: string) => {
    if (planType === 'starter') {
      // Starter pack is always a refill option, regardless of current plan
      return currentPlan ? 'Refill Credits (+25)' : 'Buy Credits';
    }
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
    const canceled = searchParams.get('canceled');
    const error = searchParams.get('error');

    if (success === 'true') {
      setShowSuccess(true);
      // Invalidate cache and force refresh user data after successful payment
      invalidateCache();
      refreshUserData(true).catch(err => console.error('Error refreshing user data:', err));
      setTimeout(() => setShowSuccess(false), 5000);
    }
    
    if (subscriptionRequired === 'true') {
      setShowSubscriptionRequired(true);
      setTimeout(() => setShowSubscriptionRequired(false), 8000);
    }
    
    if (canceled === 'true') {
      // Clear any loading states and show canceled message
      setShowError('');
      // Remove the canceled parameter from URL to prevent re-triggering
      if (window.history.replaceState) {
        const url = new URL(window.location.href);
        url.searchParams.delete('canceled');
        window.history.replaceState({}, '', url.toString());
      }
    }
    
    if (error) {
      setShowError(error === 'subscription_check_failed' 
        ? 'Unable to verify subscription status. Please try again.' 
        : 'An error occurred. Please try again.');
      setTimeout(() => setShowError(''), 5000);
    }
  }, [searchParams, refreshUserData, invalidateCache]);

  // Don't block rendering if loading takes too long - show content after 3 seconds
  useEffect(() => {
    if (!loading) {
      setShowContent(true);
    } else {
      // Show content after 3 seconds even if still loading
      const timer = setTimeout(() => setShowContent(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (loading && !showContent) {
    return <Loading text="Loading your account..." />;
  }

  const isPaidPlan = hasActiveSubscription;

  return (
    <div className="min-h-screen bg-dark-gradient flex flex-col">
      <div className="min-h-screen flex flex-col">
        <Navbar variant="app" />
        <div className="flex-1 container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 pt-32 pb-8">
        <div className="max-w-6xl mx-auto w-full">
          <h1 className="text-4xl lg:text-5xl font-bold text-neutral-900 mb-6 text-center">
            Account Settings
          </h1>

          {/* Success Message */}
          {showSuccess && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6 flex items-center shadow-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
              <p className="text-green-700 font-medium">Payment successful! Your subscription has been activated.</p>
            </div>
          )}

          {/* Subscription Required Message */}
          {showSubscriptionRequired && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 mb-6 flex items-center shadow-lg">
              <Crown className="h-5 w-5 text-orange-600 mr-3" />
              <p className="text-orange-700 font-medium">A paid subscription is required to access the logo generator. Please choose a plan below.</p>
            </div>
          )}

          {/* Error Message */}
          {showError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 flex items-center shadow-lg">
              <p className="text-red-700 font-medium">{showError}</p>
            </div>
          )}

          {/* Canceled Message */}
          {searchParams.get('canceled') === 'true' && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6 flex items-center shadow-lg">
              <p className="text-blue-700 font-medium">Checkout was canceled. You can try again whenever you're ready.</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Profile Information */}
            <div className="bg-gradient-to-br from-white to-neutral-50 backdrop-blur-md rounded-2xl p-8 border border-neutral-200 shadow-xl hover:shadow-2xl hover:shadow-primary-500/20 transition-all duration-500 hover:scale-105">
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

            {/* Subscription Status */}
            <div className="bg-gradient-to-br from-white to-neutral-50 backdrop-blur-md rounded-2xl p-8 border border-neutral-200 shadow-xl hover:shadow-2xl hover:shadow-primary-500/20 transition-all duration-500 hover:scale-105">
              <h2 className="text-xl font-semibold text-neutral-900 mb-6 flex items-center">
                <Crown className="h-5 w-5 mr-2" />
                Subscription Status
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">Current Plan:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    isPaidPlan 
                      ? 'bg-gradient-to-r from-primary-600 to-accent-500 text-neutral-900' 
                      : 'bg-red-500/20 text-red-700 border border-red-500/30'
                  }`}>
                    {(() => {
                      const plan = userData?.subscription?.plan_type || null;
                      if (!isPaidPlan || !plan) return 'Subscription Required';
                      if (plan === 'enterprise') return 'Enterprise';
                      if (plan === 'starter') return 'Starter Pack';
                      if (plan === 'proMonthly') return 'Pro Monthly';
                      if (plan === 'proYearly') return 'Pro Yearly';
                      if (plan === 'base') return 'Base';
                      if (plan === 'pro') return 'Pro';
                      if (plan === 'proPlus') return 'Pro+';
                      // Fallback: capitalize first letter and add space before capital letters
                      return plan.replace(/([A-Z])/g, ' $1').trim().replace(/^./, str => str.toUpperCase());
                    })()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">Credits Remaining:</span>
                  <span className="flex items-center text-neutral-900 font-semibold">
                    <Logo width={24} height={24} className="mr-2" />
                    {userData?.usage?.tokens_remaining ?? userData?.subscription?.monthly_token_limit ?? 5}
                    {userData?.subscription?.plan_type === 'enterprise' && (
                      <span className="ml-1 text-xs bg-purple-500/20 text-purple-700 px-2 py-0.5 rounded">
                        Enterprise
                      </span>
                    )}
                  </span>
                </div>

                {userData?.usage?.tokens_used_this_month !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">Credits Used:</span>
                    <span className="text-neutral-900 font-semibold">
                      {userData.usage.tokens_used_this_month} / {userData?.subscription?.monthly_token_limit ?? 5}
                    </span>
                  </div>
                )}

                {userData?.usage?.total_generations !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">Total Generations:</span>
                    <span className="text-neutral-900 font-semibold">
                      {userData.usage.total_generations}
                    </span>
                  </div>
                )}

                {!isPaidPlan && (
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 shadow-lg mt-4">
                    <div className="flex items-center mb-2">
                      <Crown className="h-5 w-5 text-orange-600 mr-2" />
                      <span className="text-orange-700 font-semibold">Subscription Required</span>
                    </div>
                    <p className="text-neutral-600 text-sm">
                      Subscribe to unlock more credits and generate unlimited logos with AI. Choose from our flexible plans below.
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
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 shadow-lg">
                    <p className="text-orange-700 text-sm">
                      <strong>Subscription Canceled</strong><br />
                      You'll retain access to all features until {userData.subscription.current_period_end ? new Date(userData.subscription.current_period_end).toLocaleDateString() : 'the end of your billing period'}.
                    </p>
                  </div>
                )}

                {/* Show Cancel button for active subscriptions */}
                {isPaidPlan && !userData?.subscription?.cancel_at_period_end && (
                  <div className="pt-4">
                    <CancelSubscriptionButton className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-lg hover:shadow-xl" />
                  </div>
                )}

                {/* Show Reactivate button for canceled subscriptions still in grace period */}
                {isPaidPlan && userData?.subscription?.cancel_at_period_end && (
                  <div className="pt-4">
                    <ReactivateSubscriptionButton className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-lg hover:shadow-xl" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="text-center mb-12">
            <div className="flex flex-wrap justify-center gap-4">
              <Link 
                href="/generate" 
                className="bg-gradient-to-r from-primary-600 to-accent-500 text-neutral-900 px-8 py-4 rounded-lg font-semibold hover:from-primary-700 hover:to-accent-600 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Generate Logos
              </Link>
              <Link 
                href="/library" 
                className="bg-white hover:bg-neutral-50 text-neutral-900 px-8 py-4 rounded-lg font-semibold transition-colors border border-neutral-300 hover:border-neutral-400 shadow-lg hover:shadow-xl"
              >
                View Library
              </Link>
            </div>
          </div>

          {/* Pricing Section - Always visible for credit refills and plan upgrades */}
          <div className="py-20 bg-neutral-50 rounded-2xl px-4 sm:px-6 md:px-8">
            <div className="container mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-neutral-900 mb-4">
                  {isPaidPlan 
                    ? 'Manage Your Subscription' 
                    : userData?.subscription?.status === 'canceled' 
                      ? 'Resubscribe to Continue' 
                      : 'Choose Your Plan'}
                </h2>
                <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
                  {isPaidPlan 
                    ? 'Upgrade, purchase credit refills, or manage your current subscription' 
                    : userData?.subscription?.status === 'canceled' 
                      ? 'Get back to creating amazing logos with our premium features' 
                      : 'Get more credits and unlock premium features'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {/* Starter Pack - Credit Refill */}
                <PricingCard
                  plan="starter"
                  currentPlan={currentPlan ?? undefined}
                  variant="light"
                />

                {/* Pro Monthly Plan */}
                <PricingCard
                  plan="proMonthly"
                  currentPlan={currentPlan ?? undefined}
                  isPopular={true}
                  variant="light"
                />

                {/* Pro Yearly Plan */}
                <PricingCard
                  plan="proYearly"
                  currentPlan={currentPlan ?? undefined}
                  variant="light"
                />
              </div>

              <div className="text-center mt-12">
                <p className="text-neutral-600 text-sm max-w-2xl mx-auto">
                  All plans include secure payment processing, instant account upgrades, and access to our customer support. 
                  You can change or cancel your subscription at any time through your account settings.
                </p>
              </div>
            </div>
          </div>
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