'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface SubscriptionButtonProps {
  priceId: string;
  planType: string;
  className?: string;
  loadingClassName?: string;
  disabled?: boolean;
  disabledClassName?: string;
  children: React.ReactNode;
}

export default function SubscriptionButton({ 
  priceId, 
  planType, 
  className = '', 
  loadingClassName = '',
  disabled = false,
  disabledClassName = 'opacity-50 cursor-not-allowed',
  children 
}: SubscriptionButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const handleCheckout = async () => {
    if (disabled) {
      return;
    }

    // Check if user is authenticated
    if (authLoading) {
      setError('Checking authentication...');
      return;
    }

    if (!user) {
      // Redirect to register page if not logged in
      router.push('/register?redirect=checkout');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Ensure cookies are sent
        body: JSON.stringify({ planType }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Log detailed error info for debugging
        console.error('Checkout API error:', {
          status: response.status,
          error: data.error,
          details: data.details
        });
        
        if (response.status === 401) {
          throw new Error('Authentication required. Please refresh the page and try again.');
        }
        
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      setError(error.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        onClick={handleCheckout}
        disabled={loading || disabled}
        className={`${className} ${loading ? loadingClassName : ''} ${(loading || disabled) ? disabledClassName : ''}`}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing...
          </div>
        ) : (
          children
        )}
      </button>
      
      {error && (
        <div className="mt-2 text-red-400 text-sm text-center">
          {error}
        </div>
      )}
    </div>
  );
} 