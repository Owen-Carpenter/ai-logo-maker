'use client';

import { useAuth } from '../../../contexts/AuthContext';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { CheckCircle, Crown, BarChart3, Calendar, TrendingUp, Zap } from 'lucide-react';
import Logo from '../../../components/ui/Logo';
import Sidebar from '../../../components/generate/Sidebar';
import Footer from '../../../components/Footer';
import Loading from '../../../components/ui/Loading';

function UsagePageContent() {
  const { user, userData, hasActiveSubscription, loading } = useAuth();
  const router = useRouter();
  const [showMessage, setShowMessage] = useState('');
  const [savedIconsCount, setSavedIconsCount] = useState(0);
  const [iconStats, setIconStats] = useState({
    thisMonth: 0,
    lastMonth: 0,
    avgPerDay: 0
  });
  const [loadingIconCount, setLoadingIconCount] = useState(true);
  const [showContent, setShowContent] = useState(false);

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

  // Authentication check - redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/register?redirect=/usage');
    }
  }, [user, loading, router]);

  // Fetch saved icons count
  useEffect(() => {
    const fetchIconCount = async () => {
      if (!user) return;
      
      try {
        const response = await fetch('/api/icons/count');
        if (response.ok) {
          const data = await response.json();
          setSavedIconsCount(data.count || 0);
          setIconStats({
            thisMonth: data.thisMonth || 0,
            lastMonth: data.lastMonth || 0,
            avgPerDay: data.avgPerDay || 0
          });
        }
      } catch (error) {
        console.error('Error fetching icon count:', error);
      } finally {
        setLoadingIconCount(false);
      }
    };

    fetchIconCount();
  }, [user]);

  // Show loading while checking authentication (but only if we haven't shown content yet)
  if ((loading || !user) && !showContent) {
    return <Loading text="Loading usage data..." />;
  }

  const isPaidPlan = hasActiveSubscription;
  const creditsUsed = userData?.usage?.tokens_used_this_month || 0;
  const creditsRemaining = userData?.usage?.tokens_remaining || 0;
  const totalCredits = userData?.subscription?.monthly_token_limit || 5;
  const usagePercentage = userData?.usage?.usage_percentage || 0;

  // Calculate usage statistics
  const planType = userData?.subscription?.plan_type || 'free';
  const isUnlimited = false; // No unlimited plan in current pricing structure
  
  // Real usage statistics from icon creation dates
  const usageStats = {
    thisMonth: iconStats.thisMonth,
    lastMonth: iconStats.lastMonth,
    avgPerDay: iconStats.avgPerDay,
    peakDay: Math.max(1, Math.round(iconStats.thisMonth / 10)) // Estimated peak day
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100 flex flex-col">
      <div className="flex flex-1 lg:flex-row relative overflow-hidden">
        <Sidebar currentPage="usage" />
        
        <div className="flex-1 relative overflow-hidden lg:ml-16">
          {/* Header */}
          <div className="px-6 sm:px-8 lg:px-12 py-8 text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4 leading-tight">
              Usage &{' '}
              <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">Limits</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-neutral-700 mb-8 max-w-2xl mx-auto px-4">
              Track your logo generation usage and monitor your subscription limits
            </p>
          </div>

          <div className="px-6 sm:px-8 lg:px-12 pb-8">

            {/* Usage Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Credits Remaining */}
              <div className="bg-white border border-neutral-200 rounded-xl backdrop-blur-sm p-6 hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-300 hover:scale-105 hover:border-primary-400">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                    <Zap className="h-6 w-6 text-neutral-900" />
                  </div>
                  <span className="text-green-400 text-sm font-medium">Available</span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold text-neutral-900">
                    {isUnlimited ? '∞' : creditsRemaining}
                  </h3>
                  <p className="text-neutral-600 text-sm">Credits Remaining</p>
                </div>
              </div>

              {/* Logos in Library */}
              <div className="bg-white border border-neutral-200 rounded-xl backdrop-blur-sm p-6 hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-300 hover:scale-105 hover:border-primary-400">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary-600 to-accent-500 rounded-xl flex items-center justify-center">
                    <svg className="h-6 w-6 text-neutral-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </div>
                  <span className="text-primary-600 text-sm font-medium">Library</span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold text-neutral-900">
                    {loadingIconCount ? (
                      <div className="w-8 h-8 border-2 border-sunset-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : savedIconsCount}
                  </h3>
                  <p className="text-neutral-600 text-sm">Logos Saved</p>
                </div>
              </div>

              {/* This Month */}
              <div className="bg-white border border-neutral-200 rounded-xl backdrop-blur-sm p-6 hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-300 hover:scale-105 hover:border-primary-400">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-neutral-900" />
                  </div>
                  <span className="text-purple-400 text-sm font-medium">Monthly</span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold text-neutral-900">
                    {loadingIconCount ? (
                      <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : usageStats.thisMonth}
                  </h3>
                  <p className="text-neutral-600 text-sm">This Month</p>
                </div>
              </div>

              {/* Average Daily */}
              <div className="bg-white border border-neutral-200 rounded-xl backdrop-blur-sm p-6 hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-300 hover:scale-105 hover:border-primary-400">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-neutral-900" />
                  </div>
                  <span className="text-blue-400 text-sm font-medium">Daily Avg</span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold text-neutral-900">
                    {loadingIconCount ? (
                      <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : usageStats.avgPerDay}
                  </h3>
                  <p className="text-neutral-600 text-sm">Per Day</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Usage Progress */}
              <div className="bg-white border border-neutral-200 rounded-xl backdrop-blur-sm p-8 hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-300 hover:border-primary-400">
                <h2 className="text-xl font-semibold text-neutral-900 mb-6 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-primary-600" />
                  Usage Progress
                </h2>
              
              {isPaidPlan ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-neutral-600">Credits Used</span>
                    <span className="text-neutral-900 font-semibold">
                      {creditsUsed} / {isUnlimited ? '∞' : totalCredits}
                    </span>
                  </div>
                  
                  {!isUnlimited && (
                    <div className="w-full bg-neutral-100 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-primary-600 to-accent-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                      ></div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-neutral-900">{creditsUsed}</div>
                      <div className="text-neutral-600 text-sm">Used</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-neutral-900">
                        {isUnlimited ? '∞' : creditsRemaining}
                      </div>
                      <div className="text-neutral-600 text-sm">Remaining</div>
                    </div>
                  </div>

                  {!isUnlimited && usagePercentage > 80 && (
                    <div className="bg-primary-100 border border-primary-200 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <Crown className="h-4 w-4 text-primary-600 mr-2" />
                        <span className="text-primary-600 font-semibold">Usage Alert</span>
                      </div>
                      <p className="text-neutral-600 text-sm">
                        You've used {Math.round(usagePercentage)}% of your credits. Consider upgrading your plan for more logos.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-primary-100 border border-primary-200 rounded-lg p-6 text-center">
                  <Crown className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-primary-600 mb-2">No Active Subscription</h3>
                  <p className="text-neutral-600 text-sm mb-4">
                    Subscribe to start tracking your logo generation usage and unlock unlimited creativity.
                  </p>
                  <Link 
                    href="/account" 
                    className="inline-block bg-gradient-to-r from-primary-600 to-accent-500 text-neutral-900 px-6 py-2 rounded-lg font-semibold hover:from-primary-700 hover:to-accent-600 transition-all duration-300"
                  >
                    View Plans
                  </Link>
                </div>
              )}
              </div>

              {/* Plan Details */}
              <div className="bg-white border border-neutral-200 rounded-xl backdrop-blur-sm p-8 hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-300 hover:border-primary-400">
                <h2 className="text-xl font-semibold text-neutral-900 mb-6 flex items-center">
                  <Crown className="h-5 w-5 mr-2 text-primary-600" />
                  Plan Details
                </h2>
              
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">Current Plan:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      isPaidPlan 
                        ? 'bg-gradient-to-r from-primary-600 to-accent-500 text-neutral-900' 
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {(() => {
                        if (!isPaidPlan) return 'No Subscription';
                        if (planType === 'base') return 'Base';
                        if (planType === 'pro') return 'Pro';
                        if (planType === 'proPlus') return 'Pro+';
                        if (planType === 'starter') return 'Starter Pack';
                        if (planType === 'proMonthly') return 'Pro Monthly';
                        if (planType === 'proYearly') return 'Pro Yearly';
                        // Fallback: capitalize first letter and add space before capital letters
                        return planType.replace(/([A-Z])/g, ' $1').trim().replace(/^./, str => str.toUpperCase());
                      })()}
                    </span>
                  </div>

                  {isPaidPlan && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-600">Plan Features:</span>
                        <span className="text-neutral-900">
                          {isUnlimited ? 'Unlimited Logos' : `${totalCredits} Credits/Month`}
                        </span>
                      </div>

                      {userData?.subscription?.current_period_end && (
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-600">
                            {userData?.subscription?.cancel_at_period_end ? 'Expires:' : 'Renews:'}
                          </span>
                          <span className="text-neutral-900">
                            {new Date(userData.subscription.current_period_end).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                          <span className="text-green-400 font-semibold">Active Subscription</span>
                        </div>
                        <p className="text-neutral-600 text-sm">
                          Your subscription is active and you can generate {isUnlimited ? 'unlimited' : creditsRemaining} more logos.
                        </p>
                      </div>
                    </>
                  )}

                  {!isPaidPlan && (
                    <div className="space-y-3">
                      <div className="text-neutral-600 text-sm">Available Plans:</div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-600">Base</span>
                          <span className="text-neutral-900">25 credits/month</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-600">Pro</span>
                          <span className="text-neutral-900">100 credits/month</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-600">Pro+</span>
                          <span className="text-neutral-900">200 credits/month</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="text-center mb-8">
              <div className="flex flex-wrap justify-center gap-4">
                <Link 
                  href="/generate" 
                  className="bg-gradient-to-r from-primary-600 to-accent-500 text-neutral-900 px-8 py-3 rounded-xl font-semibold hover:from-primary-700 hover:to-accent-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  Generate More Logos
                </Link>
                <Link 
                  href="/account" 
                  className="bg-white hover:bg-primary-50 text-neutral-900 px-8 py-3 rounded-xl font-semibold transition-all duration-300 border-2 border-primary-300 hover:border-primary-500 shadow-md hover:shadow-lg hover:scale-105"
                >
                  Manage Subscription
                </Link>
                <Link 
                  href="/library" 
                  className="bg-white hover:bg-primary-50 text-neutral-900 px-8 py-3 rounded-xl font-semibold transition-all duration-300 border-2 border-primary-300 hover:border-primary-500 shadow-md hover:shadow-lg hover:scale-105"
                >
                  View Library
                </Link>
              </div>
            </div>

            {/* Usage Tips */}
            <div className="bg-white border border-neutral-200 rounded-xl backdrop-blur-sm p-8 hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-300 hover:border-primary-400">
              <h2 className="text-xl font-semibold text-neutral-900 mb-6 flex items-center">
                <span className="text-2xl mr-2">💡</span>
                Usage Tips & Guidelines
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-neutral-900">Maximize Your Credits</h3>
                  <ul className="space-y-3 text-neutral-600 text-sm">
                    <li className="flex items-start">
                      <span className="text-primary-600 mr-2">•</span>
                      Be specific in your logo descriptions for better results
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary-600 mr-2">•</span>
                      Use the "Improve Logo" feature to refine existing logos
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary-600 mr-2">•</span>
                      Save your favorite logos to the library for later use
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary-600 mr-2">•</span>
                      Try different styles to get varied results
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-neutral-900">Need More Credits?</h3>
                  <ul className="space-y-3 text-neutral-600 text-sm">
                    <li className="flex items-start">
                      <span className="text-primary-600 mr-2">•</span>
                      Starter Pack: 25 credits (one-time) for $5
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary-600 mr-2">•</span>
                      Pro Monthly: 50 credits/month for $10
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary-600 mr-2">•</span>
                      Pro Yearly: 700 credits/year for $96 (save 20%)
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary-600 mr-2">•</span>
                      Monthly subscriptions reset on your renewal date
                    </li>
                  </ul>
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

export default function UsagePage() {
  return (
    <Suspense fallback={<Loading text="Loading usage & limits..." />}>
      <UsagePageContent />
    </Suspense>
  );
}