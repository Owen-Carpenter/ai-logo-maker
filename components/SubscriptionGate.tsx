'use client';

import React from 'react';
import Link from 'next/link';
import { Crown, Lock, Zap } from 'lucide-react';

interface SubscriptionGateProps {
  title?: string;
  description?: string;
}

export default function SubscriptionGate({ 
  title = "Premium Feature Required",
  description = "You need an active subscription to access this feature."
}: SubscriptionGateProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-200 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 p-8 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500/10 rounded-full mb-4">
              <Lock className="h-8 w-8 text-orange-600" />
            </div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-3">{title}</h1>
            <p className="text-neutral-600 text-base leading-relaxed">{description}</p>
          </div>

          <div className="space-y-3 mb-8">
            <div className="flex items-start text-left p-4 bg-neutral-50 rounded-lg border border-neutral-100">
              <Crown className="h-5 w-5 text-orange-600 mr-3 flex-shrink-0 mt-0.5" />
              <span className="text-neutral-700 text-sm leading-relaxed">
                Generate unlimited AI logos with premium plans
              </span>
            </div>
            
            <div className="flex items-start text-left p-4 bg-neutral-50 rounded-lg border border-neutral-100">
              <Zap className="h-5 w-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
              <span className="text-neutral-700 text-sm leading-relaxed">
                High-resolution downloads without watermarks
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              href="/account"
              className="block w-full bg-gradient-to-r from-primary-600 to-accent-500 hover:from-primary-700 hover:to-accent-600 text-neutral-900 px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02]"
            >
              View Subscription Plans
            </Link>
            
            <Link
              href="/"
              className="block w-full text-neutral-600 hover:text-neutral-900 px-6 py-2 text-sm font-medium transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 