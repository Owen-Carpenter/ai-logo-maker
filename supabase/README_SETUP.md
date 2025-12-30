# Database Setup Instructions

This directory contains scripts to completely reset and set up the Supabase database.

## Files

- `cleanup_database.sql` - Drops all tables, views, functions, and triggers (WARNING: Deletes all data!)
- `setup_database.sql` - Creates all tables, functions, views, triggers, and RLS policies from scratch

## How to Use

### Option 1: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run `cleanup_database.sql` first (if you want to start fresh)
4. Run `setup_database.sql` to create everything

### Option 2: Using Supabase CLI

```bash
# Clean up existing database (optional - only if you want to start fresh)
psql -h <your-db-host> -U postgres -d postgres -f supabase/cleanup_database.sql

# Set up the database
psql -h <your-db-host> -U postgres -d postgres -f supabase/setup_database.sql
```

### Option 3: Using Supabase Migration System

If you're using Supabase migrations, you can copy the contents of `setup_database.sql` into a new migration file.

## What Gets Created

### Tables
- `users` - User profiles
- `subscriptions` - User subscription data
- `usage_tracking` - Token usage tracking
- `icons` - User saved icons/logos

### Functions
- `handle_new_user_signup()` - Trigger function for new user creation
- `update_users_updated_at_column()` - Auto-update timestamp
- `update_subscriptions_updated_at_column()` - Auto-update timestamp
- `update_icons_updated_at()` - Auto-update timestamp
- `get_monthly_token_limit()` - Get token limit for plan type
- `webhook_upsert_subscription()` - Handle Stripe webhooks
- `get_or_create_subscription_for_user()` - Get or create subscription
- `record_token_usage()` - Record token usage
- `use_tokens()` - Check and use tokens

### Views
- `user_complete_profile` - Complete user data with subscription and usage

### Security
- All tables have Row Level Security (RLS) enabled
- RLS policies ensure users can only access their own data
- All functions use `SET search_path = public` for security

## Important Notes

- The `icons` table uses `auth.users(id)` as foreign key (not `users(id)`) to match the API code
- The auth trigger handles duplicate user creation gracefully
- All functions are idempotent (safe to run multiple times)

