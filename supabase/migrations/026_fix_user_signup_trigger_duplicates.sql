-- ============================================================================
-- Fix handle_new_user_signup trigger to handle duplicate inserts gracefully
-- ============================================================================
-- This fixes the "Database error saving new user" issue when OAuth signup
-- attempts to create a user that already exists (e.g., from a previous failed attempt)

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

-- Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();

