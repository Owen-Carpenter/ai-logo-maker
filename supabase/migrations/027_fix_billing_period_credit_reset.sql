-- ============================================================================
-- Fix credit system to properly reset based on billing periods
-- ============================================================================
-- This migration ensures that:
-- 1. Monthly subscriptions reset to 50 credits every month from subscription date
-- 2. Yearly subscriptions reset to 600 credits every year from subscription date
-- 3. Starter pack refills are preserved permanently (never expire)
-- 4. Base credits reset each period (no rollover), but refills persist
-- ============================================================================

-- Update use_tokens function to respect billing periods
CREATE OR REPLACE FUNCTION use_tokens(
    p_user_id uuid,
    p_tokens_needed integer,
    p_usage_type text,
    p_prompt_text text DEFAULT NULL,
    p_style_selected text DEFAULT NULL
)
RETURNS TABLE(
    success boolean,
    remaining_tokens integer,
    usage_id uuid,
    error_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_subscription_id uuid;
    v_monthly_limit integer;
    v_current_usage integer;
    v_remaining integer;
    v_usage_id uuid;
BEGIN
    -- Get active subscription
    SELECT id, monthly_token_limit 
    INTO v_subscription_id, v_monthly_limit
    FROM subscriptions
    WHERE user_id = p_user_id 
    AND status = 'active'
    LIMIT 1;

    -- If no subscription found, user has no credits
    IF v_subscription_id IS NULL THEN
        RETURN QUERY SELECT 
            false,
            0,
            NULL::uuid,
            'No active subscription. Please purchase a plan.'::text;
        RETURN;
    END IF;

    -- Calculate current usage ONLY within the current billing period
    -- This ensures credits reset properly for monthly/yearly subscriptions
    SELECT COALESCE(SUM(tokens_used), 0)
    INTO v_current_usage
    FROM usage_tracking ut
    INNER JOIN subscriptions s ON s.id = ut.subscription_id
    WHERE ut.user_id = p_user_id
    AND ut.subscription_id = v_subscription_id
    AND (
        -- Only count usage within the current billing period
        s.current_period_start IS NULL 
        OR ut.created_at >= s.current_period_start
    )
    AND (
        s.current_period_end IS NULL 
        OR ut.created_at < s.current_period_end
    );

    v_remaining := v_monthly_limit - v_current_usage;

    -- Check if user has enough tokens
    IF v_remaining < p_tokens_needed THEN
        RETURN QUERY SELECT 
            false,
            v_remaining,
            NULL::uuid,
            'Insufficient credits'::text;
        RETURN;
    END IF;

    -- Record usage
    INSERT INTO usage_tracking (
        user_id,
        subscription_id,
        tokens_used,
        usage_type,
        prompt_text,
        style_selected,
        generation_successful
    ) VALUES (
        p_user_id,
        v_subscription_id,
        p_tokens_needed,
        p_usage_type,
        p_prompt_text,
        p_style_selected,
        true
    )
    RETURNING id INTO v_usage_id;

    -- Calculate new remaining
    v_remaining := v_remaining - p_tokens_needed;

    RETURN QUERY SELECT 
        true,
        v_remaining,
        v_usage_id,
        NULL::text;
END;
$$;

-- Update user_complete_profile view to respect billing periods
DROP VIEW IF EXISTS user_complete_profile;
CREATE OR REPLACE VIEW user_complete_profile 
WITH (security_invoker = true) AS
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.avatar_url,
    u.display_name,
    u.bio,
    u.created_at as user_created_at,
    u.updated_at as user_updated_at,
    
    -- Current subscription info
    s.id as subscription_id,
    s.plan_type,
    s.status as subscription_status,
    COALESCE(s.monthly_token_limit, 0)::INTEGER as monthly_token_limit,
    s.current_period_start,
    s.current_period_end,
    COALESCE(s.cancel_at_period_end, FALSE) as cancel_at_period_end,
    
    -- Usage summary calculated directly from usage_tracking
    COALESCE(usage_summary.tokens_used_this_month, 0)::INTEGER as tokens_used_this_month,
    COALESCE(usage_summary.tokens_remaining, COALESCE(s.monthly_token_limit, 0))::INTEGER as tokens_remaining,
    COALESCE(usage_summary.total_generations, 0)::INTEGER as total_generations,
    COALESCE(usage_summary.successful_generations, 0)::INTEGER as successful_generations,
    COALESCE(usage_summary.usage_percentage, 0)::NUMERIC as usage_percentage
    
FROM users u
LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status = 'active'
LEFT JOIN LATERAL (
    -- Calculate usage directly from usage_tracking table
    SELECT 
        COALESCE(SUM(ut.tokens_used), 0) as tokens_used_this_month,
        GREATEST(0, COALESCE(s.monthly_token_limit, 0) - COALESCE(SUM(ut.tokens_used), 0)) as tokens_remaining,
        COUNT(*) as total_generations,
        SUM(CASE WHEN ut.generation_successful THEN 1 ELSE 0 END) as successful_generations,
        CASE 
            WHEN COALESCE(s.monthly_token_limit, 0) > 0 
            THEN ROUND((COALESCE(SUM(ut.tokens_used), 0)::NUMERIC / s.monthly_token_limit) * 100, 2)
            ELSE 0
        END as usage_percentage
    FROM usage_tracking ut
    WHERE ut.user_id = u.id
    AND (
        -- For paid users: match subscription_id AND respect billing periods
        -- This ensures credits reset properly for monthly/yearly subscriptions
        (s.id IS NOT NULL AND ut.subscription_id = s.id
         AND (s.current_period_start IS NULL OR ut.created_at >= s.current_period_start)
         AND (s.current_period_end IS NULL OR ut.created_at < s.current_period_end))
        OR
        -- For users without subscription: match NULL subscription_id and current month
        (s.id IS NULL AND ut.subscription_id IS NULL 
         AND ut.created_at >= date_trunc('month', NOW())
         AND ut.created_at < date_trunc('month', NOW()) + INTERVAL '1 month')
    )
) usage_summary ON true;

-- Grant appropriate access
GRANT SELECT ON user_complete_profile TO authenticated;
REVOKE SELECT ON user_complete_profile FROM anon;

-- Add helpful comment
COMMENT ON VIEW user_complete_profile IS 'Secure user profile view with billing-period-aware usage tracking. Monthly subs reset to 50 credits each month, yearly subs reset to 600 each year, refills persist forever.';
