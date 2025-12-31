'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import Loading from '../../../components/ui/Loading';
import Link from 'next/link';

export default function AuthCallback() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    let redirectTimeout: NodeJS.Timeout;
    let hasRedirected = false;
    let subscription: { unsubscribe: () => void } | null = null;
    
    const handleAuthCallback = () => {
      try {
        // Check for error parameters in URL first
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          const errorParam = urlParams.get('error');
          const errorDescription = urlParams.get('error_description');
          
          if (errorParam) {
            console.error('OAuth callback error from URL:', errorParam, errorDescription);
            setError(errorDescription || 'Authentication failed. Please try again.');
            setLoading(false);
            return;
          }
        }
        
        // Listen to auth state changes instead of polling
        const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!mounted || hasRedirected) {
              return;
            }
            
            if (event === 'SIGNED_IN' && session) {
              if (!mounted || hasRedirected) {
                return;
              }
              
              // Use session.user directly - no need to call getUser() which hangs
              if (session.user) {
                // Successfully authenticated - redirect to generate page immediately
                hasRedirected = true;
                clearTimeout(redirectTimeout);
                if (typeof window !== 'undefined') {
                  window.location.href = '/generate';
                }
              } else {
                setError('Could not verify authentication. Please try again.');
                setLoading(false);
              }
            } else if (event === 'SIGNED_OUT') {
              if (!mounted || hasRedirected) return;
              setError('Authentication was cancelled. Please try again.');
              setLoading(false);
            }
          }
        );
        
        subscription = authSubscription;
        
        // Set a timeout as fallback
        redirectTimeout = setTimeout(() => {
          if (!mounted || hasRedirected) return;
          
          // Try one more time with a timeout on getSession
          Promise.race([
            supabase.auth.getSession(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('getSession timeout')), 2000))
          ]).then((result: any) => {
            if (!mounted || hasRedirected) return;
            
            const { data: sessionData } = result;
            
            if (sessionData?.session) {
              hasRedirected = true;
              window.location.href = '/generate';
            } else {
              setError('Authentication timed out. Please try again.');
              setLoading(false);
            }
          }).catch((err) => {
            console.error('Timeout check error:', err);
            if (!mounted || hasRedirected) return;
            setError('Authentication timed out. Please try again.');
            setLoading(false);
          });
        }, 5000);
      } catch (err) {
        console.error('Unexpected error during OAuth callback:', err);
        if (!mounted) return;
        setError('An unexpected error occurred. Please try again.');
        setLoading(false);
      }
    };

    handleAuthCallback();
    
    return () => {
      mounted = false;
      if (redirectTimeout) clearTimeout(redirectTimeout);
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [router]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-dark-gradient flex items-center justify-center">
        <Loading text="Completing sign in..." size="lg" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-dark-gradient flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          {/* Error Card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 text-center">
            {/* Error Icon */}
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-4">Verification Failed</h1>
            <p className="text-white/70 mb-8 leading-relaxed">{error}</p>
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Link
                href="/login"
                className="w-full bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl text-center"
              >
                Back to Login
              </Link>
              <Link
                href="/"
                className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 border border-white/20 hover:border-white/30 text-center"
              >
                Go Home
              </Link>
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-white/60 text-sm">
              Need help? <Link href="/#contact" className="text-orange-400 hover:text-orange-300 transition-colors duration-300 font-medium">Contact support</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
} 