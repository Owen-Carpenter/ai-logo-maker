import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Note: Client-side caching is now handled by the global ApiCache singleton

export async function GET(req: NextRequest) {
  try {
    // Create Supabase client
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get the current user (more secure than getSession)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Note: Caching is now handled client-side for better performance

    // First check if user exists in users table
    let { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('id, email, full_name, avatar_url, display_name, bio, created_at, updated_at')
      .eq('id', user.id)
      .single()

    // If user doesn't exist in users table, create them
    if (userCheckError?.code === 'PGRST116' || !existingUser) {
      console.log('User not found in users table, creating user record...')
      
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0]
        })
        .select()
        .single()

      if (createError) {
        // If duplicate key error, try to fetch again
        if (createError.code === '23505') {
          const { data: fetchedUser } = await supabase
            .from('users')
            .select('id, email, full_name, avatar_url, display_name, bio, created_at, updated_at')
            .eq('id', user.id)
            .single()
          existingUser = fetchedUser
        } else {
          console.error('Error creating user record:', createError)
          return NextResponse.json(
            { error: 'Failed to create user record', details: createError.message },
            { status: 500 }
          )
        }
      } else {
        existingUser = newUser
      }

      // Don't create a free subscription - users need to purchase a plan to get credits
      // Subscription will be created when they purchase starter/proMonthly/proYearly
    }

    // Now fetch complete user data with subscription and usage info
    let { data: userData, error } = await supabase
      .from('user_complete_profile')
      .select('*')
      .eq('id', user.id)
      .single()

    // If view query fails, build userData from existingUser and default values
    if (error || !userData) {
      console.log('View query failed or returned no data, building from user record...', error?.message)
      
      // Get subscription data directly
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      // Get subscription-bucket usage respecting billing periods
      let usageQuery = supabase
        .from('usage_tracking')
        .select('tokens_used, subscription_tokens_used, generation_successful, created_at')
        .eq('user_id', user.id)

      if (subscription) {
        if (subscription.current_period_start && subscription.current_period_end) {
          usageQuery = usageQuery
            .gte('created_at', subscription.current_period_start)
            .lt('created_at', subscription.current_period_end)
        }
      }

      const { data: usageData } = await usageQuery

      // subscription_tokens_used tracks only the credits drawn from the sub bucket
      const subTokensUsed = usageData?.reduce((sum, r) => sum + (r.subscription_tokens_used || 0), 0) || 0
      const monthlyLimit = subscription?.monthly_token_limit || 0
      const bonusBalance = subscription?.bonus_token_balance || 0
      const subRemaining = Math.max(0, monthlyLimit - subTokensUsed)
      const totalRemaining = subRemaining + bonusBalance

      // Build userData object
      userData = {
        ...existingUser,
        user_created_at: existingUser?.created_at,
        user_updated_at: existingUser?.updated_at,
        subscription_id: subscription?.id || null,
        plan_type: subscription?.plan_type || null,
        subscription_status: subscription?.status || 'inactive',
        monthly_token_limit: monthlyLimit,
        bonus_token_balance: bonusBalance,
        current_period_start: subscription?.current_period_start || null,
        current_period_end: subscription?.current_period_end || null,
        cancel_at_period_end: subscription?.cancel_at_period_end || false,
        tokens_used_this_period: subTokensUsed,
        subscription_credits_remaining: subRemaining,
        tokens_remaining: totalRemaining,
        total_generations: usageData?.length || 0,
        successful_generations: usageData?.filter(r => r.generation_successful).length || 0,
        usage_percentage: monthlyLimit > 0 ? (subTokensUsed / monthlyLimit) * 100 : 0
      }
    }

    // If we still don't have userData, return error
    if (!userData) {
      console.error('Failed to get user data after all attempts')
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      )
    }
      

    // Check if user has active subscription
    const hasActiveSubscription = userData.subscription_status === 'active' &&
      userData.plan_type &&
      (!userData.current_period_end || new Date(userData.current_period_end) > new Date())

    // Fallback: check subscriptions table directly if view didn't return subscription data
    if (!hasActiveSubscription && !userData.plan_type) {
      const { data: directSubscription } = await supabase
        .from('subscriptions')
        .select('plan_type, status, current_period_end, bonus_token_balance')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (directSubscription) {
        const directHasActive = directSubscription.status === 'active' &&
          directSubscription.plan_type &&
          (!directSubscription.current_period_end || new Date(directSubscription.current_period_end) > new Date())

        if (directHasActive) {
          userData.subscription_status = directSubscription.status
          userData.plan_type = directSubscription.plan_type
          userData.current_period_end = directSubscription.current_period_end
          userData.bonus_token_balance = directSubscription.bonus_token_balance || 0
        }
      }
    }

    const finalHasActiveSubscription = userData.subscription_status === 'active' &&
      userData.plan_type &&
      (!userData.current_period_end || new Date(userData.current_period_end) > new Date())

    // Normalize fields that may come from the view or the fallback path
    const subRemaining = userData.subscription_credits_remaining ?? userData.tokens_remaining ?? 0
    const bonusBalance = userData.bonus_token_balance ?? 0
    const totalRemaining = subRemaining + bonusBalance

    const responseData = {
      user: {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        avatar_url: userData.avatar_url,
        display_name: userData.display_name,
        bio: userData.bio,
        created_at: userData.user_created_at,
        updated_at: userData.user_updated_at,

        subscription: {
          id: userData.subscription_id,
          plan_type: userData.plan_type,
          status: userData.subscription_status,
          monthly_token_limit: userData.monthly_token_limit || 0,
          bonus_token_balance: bonusBalance,
          current_period_start: userData.current_period_start,
          current_period_end: userData.current_period_end,
          cancel_at_period_end: userData.cancel_at_period_end
        },

        usage: {
          tokens_used_this_period: userData.tokens_used_this_period || 0,
          subscription_credits_remaining: subRemaining,
          bonus_credits_remaining: bonusBalance,
          tokens_remaining: totalRemaining,
          total_generations: userData.total_generations || 0,
          successful_generations: userData.successful_generations || 0,
          usage_percentage: userData.usage_percentage || 0
        }
      },
      hasActiveSubscription: finalHasActiveSubscription
    }

    return NextResponse.json(responseData)

  } catch (error: any) {
    console.error('Profile API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 