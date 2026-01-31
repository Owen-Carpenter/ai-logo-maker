-- ============================================================================
-- Remove "free" plan subscriptions that were created by mistake
-- ============================================================================
-- This migration removes any subscriptions with plan_type='free' that were
-- created with the default 5 credits. Users without a purchased plan should
-- have no subscription record, not a "free" plan with 5 credits.
-- ============================================================================

-- Delete all subscriptions with plan_type='free'
-- These were created by the old API code and should not exist
DELETE FROM subscriptions 
WHERE plan_type = 'free';

-- Note: The constraint in setup_database.sql already prevents creating 'free' plans:
-- CHECK (plan_type IN ('starter', 'proMonthly', 'proYearly'))
