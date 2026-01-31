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

      // Get usage data
      const { data: usageData } = await supabase
        .from('usage_tracking')
        .select('tokens_used, generation_successful')
        .eq('user_id', user.id)

      const totalUsed = usageData?.reduce((sum, record) => sum + (record.tokens_used || 0), 0) || 0
      const monthlyLimit = subscription?.monthly_token_limit || 0
      const remaining = Math.max(0, monthlyLimit - totalUsed)

      // Build userData object
      userData = {
        ...existingUser,
        user_created_at: existingUser?.created_at,
        user_updated_at: existingUser?.updated_at,
        subscription_id: subscription?.id || null,
        plan_type: subscription?.plan_type || null,
        subscription_status: subscription?.status || 'inactive',
        monthly_token_limit: monthlyLimit,
        current_period_start: subscription?.current_period_start || null,
        current_period_end: subscription?.current_period_end || null,
        cancel_at_period_end: subscription?.cancel_at_period_end || false,
        tokens_used_this_month: totalUsed,
        tokens_remaining: remaining,
        total_generations: usageData?.length || 0,
        successful_generations: usageData?.filter(r => r.generation_successful).length || 0,
        usage_percentage: monthlyLimit > 0 ? (totalUsed / monthlyLimit) * 100 : 0
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
      

    // Check if user has active subscription using new structure
    const hasActiveSubscription = userData.subscription_status === 'active' && 
      userData.plan_type &&
      (!userData.current_period_end || new Date(userData.current_period_end) > new Date())

    // Fallback: If view doesn't give us subscription data, check subscriptions table directly
    if (!hasActiveSubscription && !userData.plan_type) {
      const { data: directSubscription } = await supabase
        .from('subscriptions')
        .select('plan_type, status, current_period_end')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
      
      if (directSubscription) {
        // Override the result if we find an active subscription
        const directHasActive = directSubscription.status === 'active' && 
          directSubscription.plan_type &&
          (!directSubscription.current_period_end || new Date(directSubscription.current_period_end) > new Date());
        
        if (directHasActive) {
          // Update the userData to reflect the correct subscription info
          userData.subscription_status = directSubscription.status;
          userData.plan_type = directSubscription.plan_type;
          userData.current_period_end = directSubscription.current_period_end;
        }
      }
    }
    
    // Recalculate after potential override
    const finalHasActiveSubscription = userData.subscription_status === 'active' && 
      userData.plan_type &&
      (!userData.current_period_end || new Date(userData.current_period_end) > new Date());

    const responseData = {
      user: {
        // User profile
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        avatar_url: userData.avatar_url,
        display_name: userData.display_name,
        bio: userData.bio,
        created_at: userData.user_created_at,
        updated_at: userData.user_updated_at,
        
        // Subscription info
        subscription: {
          id: userData.subscription_id,
          plan_type: userData.plan_type,
          status: userData.subscription_status,
          monthly_token_limit: userData.monthly_token_limit,
          current_period_start: userData.current_period_start,
          current_period_end: userData.current_period_end,
          cancel_at_period_end: userData.cancel_at_period_end
        },
        
        // Usage info
        usage: {
          tokens_used_this_month: userData.tokens_used_this_month || 0,
          tokens_remaining: userData.tokens_remaining || userData.monthly_token_limit || 0,
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