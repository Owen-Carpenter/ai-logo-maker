-- ============================================================================
-- COMPLETE DATABASE SETUP SCRIPT
-- ============================================================================
-- This script creates all tables, functions, views, triggers, and RLS policies
-- needed for the AI Logo Generator application
-- Run cleanup_database.sql first if you want to start fresh

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    display_name TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK ((select auth.uid()) = id);

-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Stripe integration
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    
    -- Subscription details
    plan_type TEXT NOT NULL CHECK (plan_type IN ('starter', 'proMonthly', 'proYearly')),
    status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'canceled', 'past_due', 'trialing', 'unpaid')),
    
    -- Billing periods
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    
    -- Cancellation tracking
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMPTZ,
    
    -- Credit limits based on plan
    monthly_token_limit INTEGER NOT NULL DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one subscription per user
    CONSTRAINT subscriptions_user_id_key UNIQUE (user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_customer_id_idx ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_subscription_id_idx ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON subscriptions(status);
CREATE INDEX IF NOT EXISTS subscriptions_plan_type_idx ON subscriptions(plan_type);

-- Enable Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
CREATE POLICY "Users can view own subscription" ON subscriptions
    FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own subscription" ON subscriptions;
CREATE POLICY "Users can update own subscription" ON subscriptions
    FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own subscription" ON subscriptions;
CREATE POLICY "Users can insert own subscription" ON subscriptions
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- ============================================================================
-- USAGE_TRACKING TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    
    -- Usage details
    tokens_used INTEGER NOT NULL DEFAULT 1,
    usage_type TEXT NOT NULL CHECK (usage_type IN ('logo_generation', 'logo_improvement', 'api_call')),
    
    -- Context information
    prompt_text TEXT,
    style_selected TEXT,
    generation_successful BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    
    -- Billing period tracking
    billing_period_start TIMESTAMPTZ,
    billing_period_end TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS usage_tracking_user_id_idx ON usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS usage_tracking_subscription_id_idx ON usage_tracking(subscription_id);
CREATE INDEX IF NOT EXISTS usage_tracking_created_at_idx ON usage_tracking(created_at);
CREATE INDEX IF NOT EXISTS usage_tracking_billing_period_idx ON usage_tracking(user_id, billing_period_start, billing_period_end);
CREATE INDEX IF NOT EXISTS usage_tracking_usage_type_idx ON usage_tracking(usage_type);
CREATE INDEX IF NOT EXISTS usage_tracking_monthly_summary_idx ON usage_tracking(user_id, billing_period_start, billing_period_end, tokens_used);

-- Enable Row Level Security
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view own usage" ON usage_tracking;
CREATE POLICY "Users can view own usage" ON usage_tracking
    FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own usage" ON usage_tracking;
CREATE POLICY "Users can insert own usage" ON usage_tracking
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- ============================================================================
-- LOGOS TABLE (used by the API code)
-- ============================================================================
CREATE TABLE IF NOT EXISTS logos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    prompt TEXT,
    style VARCHAR(100),
    color VARCHAR(50),
    tags TEXT[] DEFAULT '{}',
    format VARCHAR(10) DEFAULT 'PNG',
    file_size INTEGER,
    image_url TEXT,
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes
CREATE INDEX IF NOT EXISTS logos_user_id_idx ON logos(user_id);
CREATE INDEX IF NOT EXISTS logos_created_at_idx ON logos(created_at DESC);
CREATE INDEX IF NOT EXISTS logos_name_idx ON logos(name);
CREATE INDEX IF NOT EXISTS logos_tags_idx ON logos USING GIN(tags);
CREATE INDEX IF NOT EXISTS logos_is_favorite_idx ON logos(is_favorite);

-- Enable Row Level Security
ALTER TABLE logos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own logos" ON logos;
CREATE POLICY "Users can view their own logos" ON logos
    FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own logos" ON logos;
CREATE POLICY "Users can insert their own logos" ON logos
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own logos" ON logos;
CREATE POLICY "Users can update their own logos" ON logos
    FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own logos" ON logos;
CREATE POLICY "Users can delete their own logos" ON logos
    FOR DELETE USING ((select auth.uid()) = user_id);

-- ============================================================================
-- TRIGGER FUNCTIONS
-- ============================================================================

-- Function to update users.updated_at
CREATE OR REPLACE FUNCTION update_users_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Create trigger for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at_column();

-- Function to update subscriptions.updated_at
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Create trigger for subscriptions table
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_subscriptions_updated_at_column();

-- Function to update logos.updated_at
CREATE OR REPLACE FUNCTION update_logos_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$;

-- Create trigger for logos table
DROP TRIGGER IF EXISTS update_logos_updated_at_trigger ON logos;
CREATE TRIGGER update_logos_updated_at_trigger
    BEFORE UPDATE ON logos
    FOR EACH ROW
    EXECUTE FUNCTION update_logos_updated_at();

-- ============================================================================
-- AUTH TRIGGER: Handle new user signup
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Create user profile (handle duplicate gracefully)
    INSERT INTO public.users (id, email, full_name)
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Don't create a subscription for new users - they need to purchase a plan
    -- Subscription will be created when they purchase starter/proMonthly/proYearly
    
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        -- Log the error but don't fail the auth signup
        RAISE WARNING 'Error in handle_new_user_signup for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();

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
        WHEN 'starter' THEN RETURN 25;
        WHEN 'proMonthly' THEN RETURN 50;
        WHEN 'proYearly' THEN RETURN 700;
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
    v_existing_limit integer;
    v_existing_plan_type text;
    v_old_plan_base integer;
BEGIN
    -- Determine base monthly token limit for the new plan
    v_monthly_limit := CASE p_plan_type
        WHEN 'starter' THEN 25
        WHEN 'proMonthly' THEN 50
        WHEN 'proYearly' THEN 700
        ELSE 0
    END;

    -- Get existing subscription to preserve credits when upgrading/switching
    SELECT monthly_token_limit, plan_type
    INTO v_existing_limit, v_existing_plan_type
    FROM subscriptions
    WHERE user_id = p_user_id
    LIMIT 1;

    -- Preserve existing credits in all cases:
    -- 1. If upgrading from starter to subscription plan → preserve starter credits and add new plan credits
    -- 2. If user already has a subscription plan → preserve ALL existing credits (may include starter pack refills)
    IF v_existing_limit IS NOT NULL THEN
        IF v_existing_plan_type = 'starter' AND p_plan_type IN ('proMonthly', 'proYearly') THEN
            -- Upgrading from starter: preserve starter credits and add new plan credits
            v_monthly_limit := v_existing_limit + v_monthly_limit;
        ELSIF v_existing_plan_type IN ('proMonthly', 'proYearly') AND p_plan_type IN ('proMonthly', 'proYearly') THEN
            -- User already has a subscription plan and is switching/updating
            -- ALWAYS preserve existing credits if they're higher than new plan base
            -- This ensures starter pack refills are never lost when subscription updates occur
            IF v_existing_limit >= v_monthly_limit THEN
                -- User has same or more credits (may include refills) - preserve them
                v_monthly_limit := v_existing_limit;
            ELSE
                -- New plan has higher base - check if user has refills to preserve
                v_old_plan_base := CASE v_existing_plan_type
                    WHEN 'proMonthly' THEN 50
                    WHEN 'proYearly' THEN 700
                    ELSE 0
                END;
                IF v_existing_limit > v_old_plan_base THEN
                    -- User has refills - preserve them and add difference in base plans
                    v_monthly_limit := v_existing_limit + (v_monthly_limit - v_old_plan_base);
                ELSE
                    -- Just base credits - use new plan's base
                    v_monthly_limit := v_monthly_limit;
                END IF;
            END IF;
        END IF;
    END IF;

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
            monthly_token_limit = CASE
                -- If upgrading from starter, preserve existing credits and add new plan credits
                WHEN subscriptions.plan_type = 'starter' AND EXCLUDED.plan_type IN ('proMonthly', 'proYearly') 
                THEN subscriptions.monthly_token_limit + EXCLUDED.monthly_token_limit
                -- If user already has a subscription plan, preserve existing credits if they're higher
                -- (they may have bought starter pack refills)
                WHEN subscriptions.plan_type IN ('proMonthly', 'proYearly') AND EXCLUDED.plan_type IN ('proMonthly', 'proYearly')
                THEN GREATEST(subscriptions.monthly_token_limit, EXCLUDED.monthly_token_limit)
                -- If existing credits are higher than new plan base, preserve them (user has refills)
                WHEN subscriptions.monthly_token_limit > EXCLUDED.monthly_token_limit
                THEN subscriptions.monthly_token_limit
                -- Otherwise use the new plan's limit
                ELSE EXCLUDED.monthly_token_limit
            END,
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

    -- If no subscription exists, return NULL (user needs to purchase a plan)
    IF v_subscription_id IS NULL THEN
        RETURN NULL;
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

    -- If no subscription found, user has no credits
    IF v_subscription_id IS NULL THEN
        RETURN QUERY SELECT 
            false,
            0,
            NULL::uuid,
            'No active subscription. Please purchase a plan.'::text;
        RETURN;
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
        -- For paid users: match subscription_id (ignore billing periods if NULL)
        (s.id IS NOT NULL AND ut.subscription_id = s.id)
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

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE users IS 'Central user profiles table - all other user data references this table';
COMMENT ON TABLE subscriptions IS 'User subscriptions - references users.id for cleaner architecture';
COMMENT ON TABLE usage_tracking IS 'Usage tracking for logo generation - references users.id through users table';
COMMENT ON TABLE logos IS 'User saved logos - references auth.users.id for ownership';
COMMENT ON VIEW user_complete_profile IS 'Secure user profile view - uses security_invoker and RLS to protect user data. Shows logo generation usage.';

-- ============================================================================
-- SUMMARY
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '=== DATABASE SETUP COMPLETE ===';
    RAISE NOTICE 'Created tables:';
    RAISE NOTICE '  - users';
    RAISE NOTICE '  - subscriptions';
    RAISE NOTICE '  - usage_tracking';
    RAISE NOTICE '  - logos';
    RAISE NOTICE 'Created functions:';
    RAISE NOTICE '  - handle_new_user_signup (trigger)';
    RAISE NOTICE '  - update_users_updated_at_column';
    RAISE NOTICE '  - update_subscriptions_updated_at_column';
    RAISE NOTICE '  - update_logos_updated_at';
    RAISE NOTICE '  - get_monthly_token_limit';
    RAISE NOTICE '  - webhook_upsert_subscription';
    RAISE NOTICE '  - get_or_create_subscription_for_user';
    RAISE NOTICE '  - record_token_usage';
    RAISE NOTICE '  - use_tokens';
    RAISE NOTICE 'Created views:';
    RAISE NOTICE '  - user_complete_profile';
    RAISE NOTICE 'All RLS policies enabled and configured';
    RAISE NOTICE 'All functions use SET search_path = public for security';
END $$;

