# Supabase Setup Instructions

## Required Configuration

### 1. Authentication Callback URLs

In your Supabase Dashboard, go to:
**Authentication → URL Configuration → Redirect URLs**

Add the following redirect URLs:

#### For Development:
```
http://localhost:3000/auth/callback
```

#### For Production:
```
https://your-domain.com/auth/callback
```

**Important:** The Supabase auth callback URL (`https://ssdsienkdwtctzvknsli.supabase.co/auth/v1/callback`) is automatically handled by Supabase. You don't need to configure this directly - it's the endpoint Supabase uses internally.

What you need to configure is where Supabase redirects users **after** authentication, which is your app's callback route: `/auth/callback`

### 2. Site URL

In **Authentication → URL Configuration → Site URL**, set:

#### For Development:
```
http://localhost:3000
```

#### For Production:
```
https://your-domain.com
```

### 3. Environment Variables

Make sure you have these environment variables set:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ssdsienkdwtctzvknsli.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key-here

# Optional: For server-side operations
SUPABASE_SERVICE_ROLE_KEY=your-secret-key-here
```

**Note:** Supabase now uses:
- **Publishable Key** (formerly "anon key") - Safe to expose in client-side code
- **Secret Key** (formerly "service role key") - Keep secret, server-side only

### 4. OAuth Providers (Google, etc.)

If using OAuth providers like Google:

1. Go to **Authentication → Providers**
2. Enable your provider (e.g., Google)
3. Add your OAuth credentials
4. The redirect URL will automatically use the callback URLs you configured above

### 5. Email Templates

Update email templates in **Authentication → Email Templates** with the files from:
- `supabase/consolidated-migrations/email-templates/confirm-signup.html`
- `supabase/consolidated-migrations/email-templates/magic-link.html`
- `supabase/consolidated-migrations/email-templates/reset-password.html`

## How the Callback Flow Works

1. User clicks "Sign in with Google" (or other OAuth provider)
2. User is redirected to Google for authentication
3. Google redirects to: `https://ssdsienkdwtctzvknsli.supabase.co/auth/v1/callback` (Supabase's internal endpoint)
4. Supabase processes the OAuth response
5. Supabase redirects to: `https://your-domain.com/auth/callback` (your app's callback route)
6. Your app's `/auth/callback` page handles the session and redirects user to appropriate page

## Troubleshooting

### "Invalid redirect URL" error
- Make sure your redirect URL is exactly added in Supabase dashboard
- Check for trailing slashes (should match exactly)
- Ensure protocol (http/https) matches

### OAuth not working
- Verify OAuth provider credentials are correct
- Check that redirect URLs are configured
- Ensure Site URL is set correctly

### Session not persisting
- Check that cookies are being set properly
- Verify middleware is handling auth correctly
- Check browser console for cookie-related errors

