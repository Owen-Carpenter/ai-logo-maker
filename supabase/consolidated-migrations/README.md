# Consolidated Migrations

This folder contains consolidated database migrations for the AI Logo Generator application. These migrations replace the previous incremental migrations and use "logo" terminology throughout instead of "icon".

## Migration Files

### 001_initial_schema.sql
Creates all core database tables:
- `users` - User profiles
- `subscriptions` - User subscription data
- `usage_tracking` - Credit usage tracking for logo generation
- `logos` - User saved logos (renamed from icons)

**Key Features:**
- All tables use "logo" terminology
- Optimized RLS policies with SELECT wrapper for performance
- All functions use `SET search_path = public` for security
- Proper foreign key relationships
- Automatic triggers for `updated_at` timestamps

### 002_functions_and_views.sql
Creates all database functions and views:
- `get_monthly_token_limit()` - Get credit limits by plan type
- `webhook_upsert_subscription()` - Handle Stripe webhook subscription updates
- `get_or_create_subscription_for_user()` - Get or create subscription for checkout
- `record_token_usage()` - Record credit usage
- `use_tokens()` - Check and record token usage
- `user_complete_profile` - Secure view combining user, subscription, and usage data

**Key Features:**
- All functions use `SET search_path = public` for security
- Optimized for performance
- Proper error handling
- Secure view with `security_invoker = true`

## Email Templates

Updated email templates in `email-templates/` folder:
- `confirm-signup.html` - Email confirmation template
- `magic-link.html` - Magic link login template
- `reset-password.html` - Password reset template

All templates use "AI Logo Generator" and "logo" terminology instead of "icon".

## Usage

To apply these migrations to a fresh database:

1. Run `001_initial_schema.sql` first to create all tables
2. Run `002_functions_and_views.sql` to create functions and views
3. Update email templates in Supabase dashboard with files from `email-templates/`

## Key Changes from Previous Migrations

1. **Terminology**: All "icon" references changed to "logo"
   - `icons` table → `logos` table
   - `icon_generation` → `logo_generation`
   - All comments and documentation updated

2. **Consolidation**: Combined 25 incremental migrations into 2 clean migrations

3. **Security**: All functions use `SET search_path = public` to prevent SQL injection

4. **Performance**: RLS policies optimized with `(select auth.uid())` wrapper

5. **Structure**: Clean separation of concerns:
   - Users table for profiles only
   - Subscriptions table for subscription data
   - Usage tracking for credit consumption
   - Logos table for saved logos

## Plan Types

The application supports the following subscription plans:
- `free` - 0 credits (explore only)
- `base` - 25 credits/month
- `pro` - 100 credits/month
- `proPlus` - 200 credits/month
- `enterprise` - 200 credits/month (legacy, maps to proPlus)

## Usage Types

The `usage_tracking` table tracks:
- `logo_generation` - New logo generation
- `logo_improvement` - Logo refinement/improvement
- `api_call` - Other API usage

## Notes

- These migrations are designed for a fresh database installation
- If migrating from existing database, you may need to adjust foreign key references
- All migrations are idempotent (can be run multiple times safely)
- RLS policies ensure users can only access their own data


