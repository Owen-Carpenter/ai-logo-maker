-- ============================================================================
-- CLEANUP SCRIPT: Drop all tables, views, functions, and triggers
-- ============================================================================
-- WARNING: This will delete ALL data in the database!
-- Run this before running the setup script to start fresh

-- Drop all views first (they depend on tables)
DROP VIEW IF EXISTS user_complete_profile CASCADE;

-- Drop all tables (CASCADE will automatically drop triggers, indexes, and constraints)
-- Order doesn't matter when using CASCADE
DROP TABLE IF EXISTS usage_tracking CASCADE;
DROP TABLE IF EXISTS logos CASCADE;
DROP TABLE IF EXISTS icons CASCADE; -- Remove old icons table if it exists
DROP TABLE IF EXISTS credit_purchases CASCADE;
DROP TABLE IF EXISTS icon_generations CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop auth trigger separately (it's on auth.users, not our tables)
DO $$
BEGIN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
EXCEPTION
    WHEN undefined_table THEN
        -- Table doesn't exist, ignore
        NULL;
END $$;

-- Drop all functions (after tables are dropped, in case they reference tables)
DROP FUNCTION IF EXISTS public.handle_new_user_signup() CASCADE;
DROP FUNCTION IF EXISTS public.update_users_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.update_subscriptions_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.update_logos_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.get_monthly_token_limit(text) CASCADE;
DROP FUNCTION IF EXISTS public.webhook_upsert_subscription(uuid, text, text, text, text, timestamptz, timestamptz, boolean) CASCADE;
DROP FUNCTION IF EXISTS public.get_or_create_subscription_for_user(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.record_token_usage(uuid, integer, text, text, text, boolean, text) CASCADE;
DROP FUNCTION IF EXISTS public.use_tokens(uuid, integer, text, text, text) CASCADE;

-- Drop any remaining policies (they should be dropped with tables, but just in case)
-- Note: Policies are automatically dropped when tables are dropped

-- Summary
DO $$
BEGIN
    RAISE NOTICE '=== DATABASE CLEANUP COMPLETE ===';
    RAISE NOTICE 'All tables, views, functions, and triggers have been dropped';
    RAISE NOTICE 'You can now run the setup script to create a fresh database';
END $$;

