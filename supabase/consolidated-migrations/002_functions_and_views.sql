-- ============================================================================
-- CONSOLIDATED MIGRATION: Functions and Views
-- This migration creates all database functions and views for the AI Logo Generator
-- All terminology uses "logo" instead of "icon"
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get monthly token limit based on plan
CREATE OR REPLACE FUNCTION get_monthly_token_limit(plan_type TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    CASE plan_type
        WHEN 'free' THEN RETURN 0;       -- Free tier has no credits
        WHEN 'base' THEN RETURN 25;      -- Base tier
        WHEN 'pro' THEN RETURN 100;      -- Pro tier
        WHEN 'proPlus' THEN RETURN 200;  -- Pro+ tier
        WHEN 'enterprise' THEN RETURN 200; -- Legacy enterprise maps to pro+
        ELSE RETURN 0;
    END CASE;
END;
$$;

-- ============================================================================
-- SUBSCRIPTION FUNCTIONS
-- ============================================================================

-- Function to create or update subscription (for webhooks)
CREATE OR REPLACE FUNCTION webhook_upsert_subscription(
    p_user_id uuid,
    p_stripe_customer_id text,
    p_stripe_subscription_id text,
    p_plan_type text,
    p_status text,
    p_current_period_start timestamptz,
    p_current_period_end timestamptz,
    p_cancel_at_period_end boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_monthly_limit integer;
BEGIN
    -- Determine monthly token limit based on plan
    v_monthly_limit := CASE p_plan_type
        WHEN 'base' THEN 25
        WHEN 'pro' THEN 100
        WHEN 'proPlus' THEN 200
        WHEN 'enterprise' THEN 200
        ELSE 5
    END;

    -- First, try to update any existing subscription that already has this Stripe customer ID
    UPDATE subscriptions
    SET
        user_id = p_user_id,
        stripe_subscription_id = p_stripe_subscription_id,
        plan_type = p_plan_type,
        status = p_status,
        monthly_token_limit = v_monthly_limit,
        current_period_start = p_current_period_start,
        current_period_end = p_current_period_end,
        cancel_at_period_end = p_cancel_at_period_end,
        updated_at = NOW()
    WHERE stripe_customer_id = p_stripe_customer_id;

    IF NOT FOUND THEN
        -- If no row was updated, insert a new subscription (or update the existing row for this user)
        INSERT INTO subscriptions (
            user_id,
            stripe_customer_id,
            stripe_subscription_id,
            plan_type,
            status,
            monthly_token_limit,
            current_period_start,
            current_period_end,
            cancel_at_period_end
        ) VALUES (
            p_user_id,
            p_stripe_customer_id,
            p_stripe_subscription_id,
            p_plan_type,
            p_status,
            v_monthly_limit,
            p_current_period_start,
            p_current_period_end,
            p_cancel_at_period_end
        )
        ON CONFLICT (user_id)
        DO UPDATE SET
            stripe_customer_id = EXCLUDED.stripe_customer_id,
            stripe_subscription_id = EXCLUDED.stripe_subscription_id,
            plan_type = EXCLUDED.plan_type,
            status = EXCLUDED.status,
            monthly_token_limit = EXCLUDED.monthly_token_limit,
            current_period_start = EXCLUDED.current_period_start,
            current_period_end = EXCLUDED.current_period_end,
            cancel_at_period_end = EXCLUDED.cancel_at_period_end,
            updated_at = NOW();
    END IF;
END;
$$;

-- Function to get or create a subscription for user (for checkout)
CREATE OR REPLACE FUNCTION get_or_create_subscription_for_user(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_subscription_id uuid;
BEGIN
    -- Try to get existing subscription
    SELECT id INTO v_subscription_id
    FROM subscriptions
    WHERE user_id = p_user_id
    LIMIT 1;

    -- If no subscription exists, create a free one
    IF v_subscription_id IS NULL THEN
        INSERT INTO subscriptions (
            user_id,
            plan_type,
            status,
            monthly_token_limit
        ) VALUES (
            p_user_id,
            'free',
            'active',
            5
        )
        RETURNING id INTO v_subscription_id;
    END IF;

    RETURN v_subscription_id;
END;
$$;

-- ============================================================================
-- USAGE TRACKING FUNCTIONS
-- ============================================================================

-- Function to record token usage
CREATE OR REPLACE FUNCTION record_token_usage(
    p_user_id uuid,
    p_tokens_used integer,
    p_usage_type text,
    p_prompt_text text DEFAULT NULL,
    p_style_selected text DEFAULT NULL,
    p_generation_successful boolean DEFAULT true,
    p_error_message text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_subscription_id uuid;
    v_usage_id uuid;
BEGIN
    -- Get active subscription
    SELECT id INTO v_subscription_id
    FROM subscriptions
    WHERE user_id = p_user_id 
    AND status = 'active'
    LIMIT 1;

    -- Record usage
    INSERT INTO usage_tracking (
        user_id,
        subscription_id,
        tokens_used,
        usage_type,
        prompt_text,
        style_selected,
        generation_successful,
        error_message
    ) VALUES (
        p_user_id,
        v_subscription_id,
        p_tokens_used,
        p_usage_type,
        p_prompt_text,
        p_style_selected,
        p_generation_successful,
        p_error_message
    )
    RETURNING id INTO v_usage_id;

    RETURN v_usage_id;
END;
$$;

-- Function to use tokens (combines check and record)
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

    -- If no subscription found, use free tier defaults
    IF v_subscription_id IS NULL THEN
        v_monthly_limit := 5;
    END IF;

    -- Calculate current usage
    SELECT COALESCE(SUM(tokens_used), 0)
    INTO v_current_usage
    FROM usage_tracking
    WHERE user_id = p_user_id
    AND subscription_id = v_subscription_id;

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

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Secure view combining user profile with current subscription and usage data
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
    COALESCE(s.plan_type, 'free') as plan_type,
    COALESCE(s.status, 'active') as subscription_status,
    COALESCE(s.monthly_token_limit, 5)::INTEGER as monthly_token_limit,
    s.current_period_start,
    s.current_period_end,
    COALESCE(s.cancel_at_period_end, FALSE) as cancel_at_period_end,
    
    -- Usage summary calculated directly from usage_tracking
    COALESCE(usage_summary.tokens_used_this_month, 0)::INTEGER as tokens_used_this_month,
    COALESCE(usage_summary.tokens_remaining, COALESCE(s.monthly_token_limit, 5))::INTEGER as tokens_remaining,
    COALESCE(usage_summary.total_generations, 0)::INTEGER as total_generations,
    COALESCE(usage_summary.successful_generations, 0)::INTEGER as successful_generations,
    COALESCE(usage_summary.usage_percentage, 0)::NUMERIC as usage_percentage
    
FROM users u
LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status = 'active'
LEFT JOIN LATERAL (
    -- Calculate usage directly from usage_tracking table
    SELECT 
        COALESCE(SUM(ut.tokens_used), 0) as tokens_used_this_month,
        GREATEST(0, COALESCE(s.monthly_token_limit, 5) - COALESCE(SUM(ut.tokens_used), 0)) as tokens_remaining,
        COUNT(*) as total_generations,
        SUM(CASE WHEN ut.generation_successful THEN 1 ELSE 0 END) as successful_generations,
        ROUND((COALESCE(SUM(ut.tokens_used), 0)::NUMERIC / COALESCE(s.monthly_token_limit, 5)) * 100, 2) as usage_percentage
    FROM usage_tracking ut
    WHERE ut.user_id = u.id
    AND (
        -- For paid users: match subscription_id (ignore billing periods if NULL)
        (s.id IS NOT NULL AND ut.subscription_id = s.id)
        OR
        -- For free users: match NULL subscription_id and current month
        (s.id IS NULL AND ut.subscription_id IS NULL 
         AND ut.created_at >= date_trunc('month', NOW())
         AND ut.created_at < date_trunc('month', NOW()) + INTERVAL '1 month')
    )
) usage_summary ON true;

-- Grant appropriate access
GRANT SELECT ON user_complete_profile TO authenticated;
REVOKE SELECT ON user_complete_profile FROM anon;

-- Add comment
COMMENT ON VIEW user_complete_profile IS 'Secure user profile view - uses security_invoker and RLS to protect user data. Shows logo generation usage.';

-- ============================================================================
-- SUMMARY
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '=== FUNCTIONS AND VIEWS CREATED ===';
    RAISE NOTICE 'Created functions:';
    RAISE NOTICE '  - get_monthly_token_limit';
    RAISE NOTICE '  - webhook_upsert_subscription';
    RAISE NOTICE '  - get_or_create_subscription_for_user';
    RAISE NOTICE '  - record_token_usage';
    RAISE NOTICE '  - use_tokens';
    RAISE NOTICE 'Created views:';
    RAISE NOTICE '  - user_complete_profile';
    RAISE NOTICE 'All functions use SET search_path = public for security';
    RAISE NOTICE 'All terminology uses "logo" instead of "icon"';
END $$;


