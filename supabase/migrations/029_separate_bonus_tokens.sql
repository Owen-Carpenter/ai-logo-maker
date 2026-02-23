-- ============================================================================
-- Migration 029: Separate bonus (one-time) credits from subscription credits
-- ============================================================================
-- Before: monthly_token_limit held BOTH base subscription credits AND any
--         starter pack refills combined in one number.
-- After:  monthly_token_limit = subscription base ONLY (resets each period)
--         bonus_token_balance  = one-time starter pack credits (never reset)
--
-- Deduction order: bonus is always spent first, then subscription credits.
-- This makes accounting clean and predictable.
-- ============================================================================

-- ============================================================================
-- 1. Schema changes
-- ============================================================================

-- Add bonus_token_balance to subscriptions
ALTER TABLE subscriptions
    ADD COLUMN IF NOT EXISTS bonus_token_balance INTEGER NOT NULL DEFAULT 0;

-- Add subscription_tokens_used to usage_tracking so we can calculate
-- subscription-period usage without double-counting bonus credits.
ALTER TABLE usage_tracking
    ADD COLUMN IF NOT EXISTS subscription_tokens_used INTEGER NOT NULL DEFAULT 0;

-- ============================================================================
-- 2. Migrate existing data
-- ============================================================================
-- For each subscription, derive bonus_token_balance from any excess above the
-- plan base, and reset monthly_token_limit to the plan base.
-- The calculation is done on the CURRENT remaining balance so we don't
-- accidentally give back credits the user has already spent.

DO $$
DECLARE
    rec RECORD;
    v_base INTEGER;
    v_current_usage INTEGER;
    v_remaining INTEGER;
    v_bonus INTEGER;
BEGIN
    FOR rec IN SELECT id, plan_type, monthly_token_limit, current_period_start, current_period_end
               FROM subscriptions
    LOOP
        -- Determine base subscription credits for the plan
        v_base := CASE rec.plan_type
            WHEN 'proMonthly' THEN 50
            WHEN 'proYearly'  THEN 600
            ELSE 0  -- 'starter' has no recurring base
        END;

        -- Calculate how many subscription credits have been used in the current period
        SELECT COALESCE(SUM(tokens_used), 0)
        INTO v_current_usage
        FROM usage_tracking
        WHERE subscription_id = rec.id
        AND (
            (rec.current_period_start IS NULL AND rec.current_period_end IS NULL)
            OR (rec.current_period_start IS NOT NULL AND rec.current_period_end IS NOT NULL
                AND created_at >= rec.current_period_start
                AND created_at <  rec.current_period_end)
        );

        -- Current remaining balance under the OLD system
        v_remaining := GREATEST(0, rec.monthly_token_limit - v_current_usage);

        -- Any remaining above the base is bonus credit
        v_bonus := GREATEST(0, v_remaining - v_base);

        -- Update the subscription row
        UPDATE subscriptions
        SET
            monthly_token_limit  = v_base,
            bonus_token_balance  = v_bonus,
            updated_at           = NOW()
        WHERE id = rec.id;

        RAISE NOTICE 'Migration sub %: plan=%, old_limit=%, base=%, usage=%, remaining=%, bonus=%',
            rec.id, rec.plan_type, rec.monthly_token_limit, v_base, v_current_usage, v_remaining, v_bonus;
    END LOOP;
END;
$$;

-- Back-fill subscription_tokens_used on all existing usage_tracking rows.
-- Since we can't retroactively know how many tokens came from bonus vs sub,
-- we conservatively mark all existing usage as subscription usage.
-- This is the safest default: the new bonus_token_balance already accounts
-- for remaining bonus credits, so no double-counting occurs going forward.
UPDATE usage_tracking
SET subscription_tokens_used = tokens_used
WHERE subscription_tokens_used = 0;

-- ============================================================================
-- 3. Rewrite use_tokens() — deducts bonus first, then subscription
-- ============================================================================
-- Must drop first because the return type (new OUT columns) has changed
DROP FUNCTION IF EXISTS use_tokens(uuid, integer, text, text, text);
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
    subscription_credits_remaining integer,
    bonus_credits_remaining integer,
    usage_id uuid,
    error_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_subscription_id uuid;
    v_monthly_limit   integer;
    v_bonus_balance   integer;
    v_sub_usage       integer;
    v_sub_remaining   integer;
    v_total_available integer;
    v_from_bonus      integer;
    v_from_sub        integer;
    v_usage_id        uuid;
BEGIN
    SELECT id, monthly_token_limit, bonus_token_balance
    INTO v_subscription_id, v_monthly_limit, v_bonus_balance
    FROM subscriptions
    WHERE user_id = p_user_id
      AND status = 'active'
    LIMIT 1;

    IF v_subscription_id IS NULL THEN
        RETURN QUERY SELECT false, 0, 0, 0, NULL::uuid,
            'No active subscription. Please purchase a plan.'::text;
        RETURN;
    END IF;

    -- Subscription credits used this billing period (subscription bucket only)
    SELECT COALESCE(SUM(ut.subscription_tokens_used), 0)
    INTO v_sub_usage
    FROM usage_tracking ut
    INNER JOIN subscriptions s ON s.id = ut.subscription_id
    WHERE ut.user_id         = p_user_id
      AND ut.subscription_id = v_subscription_id
      AND (
            (s.current_period_start IS NULL AND s.current_period_end IS NULL)
            OR
            (s.current_period_start IS NOT NULL AND s.current_period_end IS NOT NULL
             AND ut.created_at >= s.current_period_start
             AND ut.created_at <  s.current_period_end)
          );

    v_sub_remaining   := GREATEST(0, v_monthly_limit - v_sub_usage);
    v_total_available := v_bonus_balance + v_sub_remaining;

    IF v_total_available < p_tokens_needed THEN
        RETURN QUERY SELECT false, v_total_available, v_sub_remaining, v_bonus_balance,
            NULL::uuid, 'Insufficient credits'::text;
        RETURN;
    END IF;

    -- Deduct bonus first, then subscription
    v_from_bonus := LEAST(p_tokens_needed, v_bonus_balance);
    v_from_sub   := p_tokens_needed - v_from_bonus;

    IF v_from_bonus > 0 THEN
        UPDATE subscriptions
        SET bonus_token_balance = bonus_token_balance - v_from_bonus,
            updated_at = NOW()
        WHERE id = v_subscription_id;
    END IF;

    INSERT INTO usage_tracking (
        user_id,
        subscription_id,
        tokens_used,
        subscription_tokens_used,
        usage_type,
        prompt_text,
        style_selected,
        generation_successful
    ) VALUES (
        p_user_id,
        v_subscription_id,
        p_tokens_needed,
        v_from_sub,
        p_usage_type,
        p_prompt_text,
        p_style_selected,
        true
    )
    RETURNING id INTO v_usage_id;

    v_bonus_balance := v_bonus_balance - v_from_bonus;
    v_sub_remaining := v_sub_remaining - v_from_sub;

    RETURN QUERY SELECT
        true,
        v_bonus_balance + v_sub_remaining,
        v_sub_remaining,
        v_bonus_balance,
        v_usage_id,
        NULL::text;
END;
$$;

-- ============================================================================
-- 4. Rebuild user_complete_profile view
-- ============================================================================
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
    u.created_at  AS user_created_at,
    u.updated_at  AS user_updated_at,

    -- Subscription info
    s.id          AS subscription_id,
    s.plan_type,
    s.status      AS subscription_status,
    COALESCE(s.monthly_token_limit, 0)::INTEGER   AS monthly_token_limit,
    COALESCE(s.bonus_token_balance,  0)::INTEGER  AS bonus_token_balance,
    s.current_period_start,
    s.current_period_end,
    COALESCE(s.cancel_at_period_end, FALSE) AS cancel_at_period_end,

    -- Subscription credits used this billing period
    COALESCE(usage_summary.sub_tokens_used, 0)::INTEGER AS tokens_used_this_period,
    -- Subscription credits remaining (resets each period)
    GREATEST(0,
        COALESCE(s.monthly_token_limit, 0) - COALESCE(usage_summary.sub_tokens_used, 0)
    )::INTEGER AS subscription_credits_remaining,
    -- Total available = subscription remaining + bonus
    (
        GREATEST(0, COALESCE(s.monthly_token_limit, 0) - COALESCE(usage_summary.sub_tokens_used, 0))
        + COALESCE(s.bonus_token_balance, 0)
    )::INTEGER AS tokens_remaining,

    -- All-time totals
    COALESCE(usage_summary.total_generations,       0)::INTEGER AS total_generations,
    COALESCE(usage_summary.successful_generations,  0)::INTEGER AS successful_generations,
    CASE
        WHEN COALESCE(s.monthly_token_limit, 0) > 0
        THEN ROUND(
            (COALESCE(usage_summary.sub_tokens_used, 0)::NUMERIC / s.monthly_token_limit) * 100,
            2)
        ELSE 0
    END::NUMERIC AS usage_percentage

FROM users u
LEFT JOIN subscriptions s ON s.user_id = u.id AND s.status = 'active'
LEFT JOIN LATERAL (
    SELECT
        COALESCE(SUM(ut.subscription_tokens_used), 0) AS sub_tokens_used,
        COUNT(*)                                       AS total_generations,
        SUM(CASE WHEN ut.generation_successful THEN 1 ELSE 0 END) AS successful_generations
    FROM usage_tracking ut
    WHERE ut.user_id = u.id
      AND (
            (s.id IS NOT NULL AND ut.subscription_id = s.id
             AND (
                   (s.current_period_start IS NULL AND s.current_period_end IS NULL)
                   OR
                   (s.current_period_start IS NOT NULL AND s.current_period_end IS NOT NULL
                    AND ut.created_at >= s.current_period_start
                    AND ut.created_at <  s.current_period_end)
                 ))
            OR
            (s.id IS NULL AND ut.subscription_id IS NULL
             AND ut.created_at >= date_trunc('month', NOW())
             AND ut.created_at <  date_trunc('month', NOW()) + INTERVAL '1 month')
          )
) usage_summary ON true;

GRANT SELECT ON user_complete_profile TO authenticated;
REVOKE SELECT ON user_complete_profile FROM anon;

COMMENT ON VIEW user_complete_profile IS
    'User profile with dual-bucket credit tracking. '
    'subscription_credits_remaining resets each billing period. '
    'bonus_token_balance (starter pack purchases) never resets and is spent first.';
