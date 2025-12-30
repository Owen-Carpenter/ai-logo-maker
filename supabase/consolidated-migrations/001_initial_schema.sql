-- ============================================================================
-- CONSOLIDATED MIGRATION: Initial Schema
-- This migration creates all core tables for the AI Logo Generator application
-- All terminology uses "logo" instead of "icon"
-- ============================================================================

-- ============================================================================
-- USERS TABLE
-- ============================================================================
-- Clean users table with minimal fields (subscription data in separate table)
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (optimized with SELECT wrapper for performance)
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
-- Separate subscription data from users table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Stripe integration
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    
    -- Subscription details
    plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'base', 'pro', 'proPlus', 'enterprise')),
    status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'canceled', 'past_due', 'trialing', 'unpaid')),
    
    -- Billing periods
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    
    -- Cancellation tracking
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMPTZ,
    
    -- Credit limits based on plan
    monthly_token_limit INTEGER NOT NULL DEFAULT 5,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one subscription per user
    CONSTRAINT subscriptions_user_id_key UNIQUE (user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_customer_id_idx ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_subscription_id_idx ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON subscriptions(status);
CREATE INDEX IF NOT EXISTS subscriptions_plan_type_idx ON subscriptions(plan_type);

-- Enable Row Level Security (RLS)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (optimized with SELECT wrapper for performance)
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
-- Track credit consumption for logo generation
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS usage_tracking_user_id_idx ON usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS usage_tracking_subscription_id_idx ON usage_tracking(subscription_id);
CREATE INDEX IF NOT EXISTS usage_tracking_created_at_idx ON usage_tracking(created_at);
CREATE INDEX IF NOT EXISTS usage_tracking_billing_period_idx ON usage_tracking(user_id, billing_period_start, billing_period_end);
CREATE INDEX IF NOT EXISTS usage_tracking_usage_type_idx ON usage_tracking(usage_type);
CREATE INDEX IF NOT EXISTS usage_tracking_monthly_summary_idx ON usage_tracking(user_id, billing_period_start, billing_period_end, tokens_used);

-- Enable Row Level Security (RLS)
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (optimized with SELECT wrapper for performance)
DROP POLICY IF EXISTS "Users can view own usage" ON usage_tracking;
CREATE POLICY "Users can view own usage" ON usage_tracking
    FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own usage" ON usage_tracking;
CREATE POLICY "Users can insert own usage" ON usage_tracking
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- ============================================================================
-- LOGOS TABLE
-- ============================================================================
-- Store user's saved logos (renamed from icons)
CREATE TABLE IF NOT EXISTS logos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS logos_user_id_idx ON logos(user_id);
CREATE INDEX IF NOT EXISTS logos_created_at_idx ON logos(created_at DESC);
CREATE INDEX IF NOT EXISTS logos_name_idx ON logos(name);
CREATE INDEX IF NOT EXISTS logos_tags_idx ON logos USING GIN(tags);
CREATE INDEX IF NOT EXISTS logos_is_favorite_idx ON logos(is_favorite);

-- Enable Row Level Security
ALTER TABLE logos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (optimized with SELECT wrapper for performance)
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
-- Function to automatically update the updated_at timestamp
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

-- Function for subscriptions updated_at
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

-- Function for logos updated_at
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
-- AUTH TRIGGER
-- ============================================================================
-- Function to handle new user signup and create user record + free subscription
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
    
    -- Create a free subscription for new users (handle duplicate gracefully)
    -- Only create if user doesn't already have a subscription
    INSERT INTO public.subscriptions (user_id, plan_type, status, monthly_token_limit)
    SELECT NEW.id, 'free', 'active', 5
    WHERE NOT EXISTS (
        SELECT 1 FROM public.subscriptions WHERE user_id = NEW.id
    );
    
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
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE users IS 'Central user profiles table - all other user data references this table';
COMMENT ON TABLE subscriptions IS 'User subscriptions - references users.id for cleaner architecture';
COMMENT ON TABLE usage_tracking IS 'Usage tracking for logo generation - references users.id through users table';
COMMENT ON TABLE logos IS 'User saved logos - references users.id for ownership';

-- ============================================================================
-- SUMMARY
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '=== INITIAL SCHEMA CREATED ===';
    RAISE NOTICE 'Created tables: users, subscriptions, usage_tracking, logos';
    RAISE NOTICE 'All tables use "logo" terminology instead of "icon"';
    RAISE NOTICE 'RLS policies optimized with SELECT wrapper for performance';
    RAISE NOTICE 'All functions use SET search_path = public for security';
END $$;


