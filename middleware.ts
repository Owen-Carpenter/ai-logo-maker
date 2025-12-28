import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple in-memory cache for subscription checks
const subscriptionCache = new Map<string, { data: any, timestamp: number }>()
const CACHE_DURATION = 30000 // 30 seconds cache for middleware

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  // Check if environment variables are set
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Supabase environment variables are not set')
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Define route types
  const appRoutes = ['/library'] // Routes that require both auth AND subscription
  const accountRoutes = ['/account'] // Routes that require auth but not necessarily subscription
  const authRoutes = ['/login', '/register', '/forgot-password']
  const publicRoutes = ['/', '/generate'] // Routes that don't require auth (generate checks auth when user tries to create)
  const callbackRoutes = ['/auth/callback', '/verify'] // Auth callback routes that should not redirect

  // Check route types first
  const isAppRoute = appRoutes.some(route => req.nextUrl.pathname.startsWith(route))
  const isAccountRoute = accountRoutes.some(route => req.nextUrl.pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => req.nextUrl.pathname.startsWith(route))
  const isPublicRoute = publicRoutes.some(route => req.nextUrl.pathname === route)
  const isCallbackRoute = callbackRoutes.some(route => req.nextUrl.pathname.startsWith(route))

  // Allow callback routes to pass through without any redirects
  if (isCallbackRoute) {
    return response
  }

  // Only verify user for protected routes to avoid unnecessary network calls
  let user = null
  if (isAppRoute || isAccountRoute) {
    try {
      // Use getUser() to properly verify the JWT with Supabase Auth
      // This is the recommended secure approach per Supabase documentation
      const { data: { user: verifiedUser }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        // User not authenticated or token invalid - redirect to login
        return NextResponse.redirect(new URL('/login', req.url))
      }
      
      user = verifiedUser
    } catch (error) {
      // Log the error and redirect to login for protected routes
      console.error('Supabase auth error in middleware:', error)
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // If not authenticated and trying to access protected routes
    if (!user) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  // Allow authenticated users to access auth pages (login/register)
  // They might want to create another account or just browse
  // No need to redirect them away

  // Check subscription for app routes
  if (isAppRoute && user) {
    try {
      // Check cache first
      const cacheKey = `${user.id}_app`
      const cached = subscriptionCache.get(cacheKey)
      let subscriptionData

      if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
        subscriptionData = cached.data
      } else {
        // Check if user has active subscription using new subscriptions table
        const { data, error } = await supabase
          .from('subscriptions')
          .select('plan_type, status, current_period_end')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single()
        
        // If there's a fetch error, allow the request through
        // The subscription check will happen on the page level
        if (error && error.message && error.message.includes('fetch')) {
          console.error('Fetch error in subscription check, allowing request through')
          return response
        }
        
        subscriptionData = data
        subscriptionCache.set(cacheKey, { data: subscriptionData, timestamp: Date.now() })
      }

      const hasActiveSubscription = subscriptionData?.status === 'active' && 
        subscriptionData?.plan_type !== 'free' &&
        (!subscriptionData?.current_period_end || 
         new Date(subscriptionData.current_period_end) > new Date())

      if (!hasActiveSubscription) {
        // Redirect to home page pricing section where they can subscribe
        return NextResponse.redirect(new URL('/#pricing', req.url))
      }
    } catch (error) {
      console.error('Error checking subscription status:', error)
      // If there's a network error, allow the request through
      // The check will happen on the page level instead
      if (error instanceof Error && (error.message.includes('fetch') || error.message.includes('network'))) {
        console.error('Network error in subscription check, allowing request through')
        return response
      }
      // For other errors, redirect to account for safety
      return NextResponse.redirect(new URL('/account?error=subscription_check_failed', req.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 