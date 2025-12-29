'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { authService } from '../lib/auth'
import { apiCache } from '../lib/api-cache'

interface UserData {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  display_name?: string
  bio?: string
  created_at: string
  updated_at: string
  
  // Subscription info
  subscription: {
    id?: string
    plan_type: string
    status: string
    monthly_token_limit: number
    current_period_start?: string
    current_period_end?: string
    cancel_at_period_end?: boolean
  }
  
  // Usage info
  usage: {
    tokens_used_this_month: number
    tokens_remaining: number
    total_generations: number
    successful_generations: number
    usage_percentage: number
  }
}

interface AuthContextType {
  user: User | null
  session: Session | null
  userData: UserData | null
  hasActiveSubscription: boolean
  loading: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string) => Promise<any>
  signInWithGoogle: () => Promise<any>
  signOut: () => Promise<any>
  resetPassword: (email: string) => Promise<any>
  refreshUserData: (forceRefresh?: boolean) => Promise<void>
  invalidateCache: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
  const [loading, setLoading] = useState(true)

  // Function to fetch user data from our users table using global cache
  const fetchUserData = useCallback(async (userId: string, forceRefresh: boolean = false) => {
    const cacheKey = `user_profile_${userId}`
    
    try {
      const data = await apiCache.get(
        cacheKey,
        async () => {
          const response = await fetch('/api/user/profile')
          if (!response.ok) {
            throw new Error('Failed to fetch user data')
          }
          return response.json()
        },
        forceRefresh
      )
      
      setUserData(data.user)
      setHasActiveSubscription(data.hasActiveSubscription)
    } catch (error) {
      console.error('Error fetching user data:', error)
      setUserData(null)
      setHasActiveSubscription(false)
    }
  }, [])

  const refreshUserData = useCallback(async (forceRefresh: boolean = false) => {
    if (user) {
      await fetchUserData(user.id, forceRefresh)
    }
  }, [user, fetchUserData])

  // The global cache and request deduplication will handle rapid calls

  useEffect(() => {
    // Get initial session and verify user
    const initAuth = async () => {
      try {
        const { session } = await authService.getCurrentSession()
        setSession(session)
        
        if (session) {
          // Use getUser() to get authenticated user instead of session.user
          const { user: authenticatedUser } = await authService.getCurrentUser()
          setUser(authenticatedUser)
          
          // Stop loading immediately after we have the user
          // Fetch user data in the background without blocking
          setLoading(false)
          
          if (authenticatedUser) {
            // Fetch in background, don't await
            fetchUserData(authenticatedUser.id, true).catch(err => 
              console.error('Background user data fetch failed:', err)
            )
          }
        } else {
          setUser(null)
          setLoading(false)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        setUser(null)
        setSession(null)
        setLoading(false)
      }
    }
    
    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event)
        setSession(session)
        
        if (session) {
          // For SIGNED_IN and TOKEN_REFRESHED events, verify the user
          // For other events, we can trust the session from the event
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            try {
              const { user: authenticatedUser } = await authService.getCurrentUser()
              setUser(authenticatedUser)
              
              if (authenticatedUser) {
                // Fetch user data in background, don't block
                fetchUserData(authenticatedUser.id, true).catch(err => 
                  console.error('Background user data fetch failed:', err)
                )
              }
            } catch (error) {
              console.error('Error getting authenticated user:', error)
              setUser(null)
              setUserData(null)
              setHasActiveSubscription(false)
            }
          }
        } else {
          // Session is null - this happens on SIGNED_OUT
          if (event === 'SIGNED_OUT') {
            console.log('SIGNED_OUT event detected, clearing user state')
          }
          // Clear all user-related state
          setUser(null)
          setUserData(null)
          setHasActiveSubscription(false)
        }
        
        setLoading(false)
        
        // Don't auto-redirect after sign-in - let the page handle it or user navigate manually
        // This prevents unwanted redirects and gives users control
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchUserData])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    const result = await authService.signIn(email, password)
    
    if (result.user && !result.error) {
      // Set user immediately for faster UI update
      setUser(result.user)
      
      // Redirect immediately to generate page
      if (typeof window !== 'undefined') {
        window.location.href = '/generate'
      }
    }
    
    setLoading(false)
    return result
  }

  const signUp = async (email: string, password: string) => {
    setLoading(true)
    const result = await authService.signUp(email, password)
    setLoading(false)
    return result
  }

  const signInWithGoogle = async () => {
    setLoading(true)
    const result = await authService.signInWithGoogle()
    // Note: OAuth redirect happens automatically, no need to set loading to false
    return result
  }

  const signOut = async () => {
    console.log('Sign out initiated...')
    setLoading(true)
    
    // Clear cache first
    if (user) {
      apiCache.invalidate(`user_profile_${user.id}`)
    }
    
    // Clear all state immediately (optimistic update)
    setUser(null)
    setUserData(null)
    setHasActiveSubscription(false)
    setSession(null)
    
    try {
      // Call signOut - this will trigger SIGNED_OUT event
      const result = await authService.signOut()
      
      if (result.error) {
        console.error('Sign out error:', result.error)
        // Even if there's an error, we've cleared local state, so proceed with redirect
      }
      
      console.log('Sign out successful, redirecting...')
      
      // Use window.location.replace() for consistent behavior with sign in
      // Small delay to ensure state updates complete
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.replace('/')
        }
      }, 100)
      
      return result
    } catch (error) {
      console.error('Unexpected error during sign out:', error)
      // Even on error, redirect to home
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.replace('/')
        }
      }, 100)
      return { error }
    }
  }

  const resetPassword = async (email: string) => {
    return await authService.resetPassword(email)
  }

  const invalidateCache = useCallback(() => {
    if (user) {
      apiCache.invalidate(`user_profile_${user.id}`)
    }
  }, [user])

  const value = {
    user,
    session,
    userData,
    hasActiveSubscription,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    refreshUserData,
    invalidateCache,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 