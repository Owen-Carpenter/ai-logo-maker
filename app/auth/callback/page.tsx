'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import Loading from '../../../components/ui/Loading';
import Link from 'next/link';

export default function AuthCallback() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let authStateSubscription: { unsubscribe: () => void } | null = null;
    let hasRedirected = false;

    const handleAuthCallback = async () => {
      try {
        // Set up a timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (!hasRedirected) {
            setError('Authentication is taking longer than expected. Please try again.');
            setLoading(false);
          }
        }, 15000); // 15 second timeout

        // Listen for auth state changes to know when session is established
        // onAuthStateChange returns { data: { subscription } }
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth state change in callback:', event, session ? 'session exists' : 'no session');
          
          if (hasRedirected) {
            console.log('Already redirected, ignoring event');
            return; // Prevent multiple redirects
          }
          
          // Handle both SIGNED_IN and INITIAL_SESSION events
          if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
            console.log(`${event} event detected, session exists, user:`, session.user?.id || 'no user in session');
            clearTimeout(timeoutId);
            hasRedirected = true;
            
            // If we have a session with a user, we can proceed immediately
            // getUser() is just for verification, but session.user should be available
            if (session.user) {
              console.log('User found in session, proceeding with redirect...');
              
              // Clean up subscription immediately
              subscription.unsubscribe();
              
              // Set loading to false
              setLoading(false);
              
              // Redirect immediately - don't wait for getUser() which might be slow
              console.log('Redirecting to /generate...');
              window.location.replace('/generate');
              return;
            }
            
            // Fallback: try to verify the user if not in session
            console.log('No user in session, attempting getUser()...');
            try {
              const { data: userData, error: userError } = await supabase.auth.getUser();
              
              if (userError || !userData.user) {
                console.error('Failed to verify user:', userError);
                hasRedirected = false; // Reset so we can try again
                setError('Could not verify authentication. Please try again.');
                setLoading(false);
                return;
              }

              console.log('User verified via getUser():', userData.user.id);
            } catch (err) {
              console.error('Error during getUser():', err);
              // Even if getUser() fails, if we have a session, proceed
              if (session) {
                console.log('getUser() failed but session exists, proceeding anyway...');
              } else {
                hasRedirected = false;
                setError('Could not verify authentication. Please try again.');
                setLoading(false);
                return;
              }
            }
            
            // Clean up subscription
            subscription.unsubscribe();
            
            // Set loading to false
            setLoading(false);
            
            // Redirect
            console.log('Redirecting to /generate (after verification)...');
            window.location.replace('/generate');
          } else if (event === 'SIGNED_OUT') {
            if (!hasRedirected) {
              console.log('SIGNED_OUT event, authentication failed');
              clearTimeout(timeoutId);
              setError('Authentication failed. Please try again.');
              setLoading(false);
              subscription.unsubscribe();
            }
          }
        });
        
        // Store subscription for cleanup
        authStateSubscription = subscription;

        // Wait a bit for Supabase to process the OAuth callback code
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Try to get session immediately (this will exchange the code if present in URL)
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('OAuth callback error:', sessionError);
          // Don't set error yet, wait for auth state change listener
          // The listener will handle the SIGNED_IN event
          return;
        }

        if (sessionData.session && !hasRedirected) {
          // Session exists, verify user
          const { data: userData, error: userError } = await supabase.auth.getUser();
          
          if (!userError && userData.user) {
            console.log('Session found immediately, redirecting...');
            clearTimeout(timeoutId);
            hasRedirected = true;
            
            // Clean up subscription
            if (authStateSubscription) {
              authStateSubscription.unsubscribe();
            }
            
            // Set loading to false
            setLoading(false);
            
            // Redirect immediately
            setTimeout(() => {
              console.log('Redirecting to /generate (immediate)...');
              window.location.replace('/generate');
            }, 100);
            return;
          }
        }
        
        // If no session yet, the auth state change listener will handle it when SIGNED_IN fires
      } catch (err) {
        console.error('Unexpected error during OAuth callback:', err);
        if (!hasRedirected) {
          clearTimeout(timeoutId);
          setError('An unexpected error occurred. Please try again.');
          setLoading(false);
          if (authStateSubscription) {
            authStateSubscription.unsubscribe();
          }
        }
      }
    };

    handleAuthCallback();

    // Cleanup
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (authStateSubscription) authStateSubscription.unsubscribe();
    };
  }, []);

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