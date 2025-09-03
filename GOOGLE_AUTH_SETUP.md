# Google OAuth Setup Guide for LevelUp Manager

## Overview
This guide provides step-by-step instructions for setting up Google OAuth authentication for the LevelUp Manager application.

## Prerequisites
- Access to Google Cloud Console
- Access to Supabase Dashboard (Project: tybmpcvwjugzoyworgfx)
- Admin access to configure OAuth settings

## Step 1: Google Cloud Console Setup

### 1.1 Create or Select Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Name it something recognizable (e.g., "LevelUp Manager")

### 1.2 Enable Required APIs
1. Navigate to "APIs & Services" → "Library"
2. Search for and enable:
   - Google+ API (for user profile information)
   - People API (optional, for additional profile data)

### 1.3 Configure OAuth Consent Screen
1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" user type
3. Fill in the application information:
   - **App name**: LevelUp Manager
   - **User support email**: tinymanagerai@gmail.com
   - **App domain**: https://levelupmanager.vercel.app
   - **Authorized domains**: levelupmanager.vercel.app
   - **Developer contact**: tinymanagerai@gmail.com
4. Add scopes:
   - `email`
   - `profile`
   - `openid`
5. Save and continue

### 1.4 Create OAuth 2.0 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. Application type: **Web application**
4. Name: "LevelUp Manager Web Client"
5. **Authorized JavaScript origins**:
   ```
   https://tybmpcvwjugzoyworgfx.supabase.co
   https://levelupmanager.vercel.app
   http://localhost:3000
   ```
6. **Authorized redirect URIs**:
   ```
   https://tybmpcvwjugzoyworgfx.supabase.co/auth/v1/callback
   https://levelupmanager.vercel.app/dashboard
   http://localhost:3000/dashboard
   ```
7. Click "Create"
8. **Save the Client ID and Client Secret** - you'll need these for Supabase

## Step 2: Supabase Configuration

### 2.1 Enable Google Provider
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/tybmpcvwjugzoyworgfx/auth/providers)
2. Find "Google" in the list of providers
3. Toggle it to "Enabled"
4. Enter the credentials from Google Cloud Console:
   - **Client ID**: (paste from Google Cloud Console)
   - **Client Secret**: (paste from Google Cloud Console)
5. **Authorized Client IDs** (optional): Leave empty unless using specific client apps
6. Click "Save"

### 2.2 Configure Redirect URLs
1. Go to [URL Configuration](https://supabase.com/dashboard/project/tybmpcvwjugzoyworgfx/auth/url-configuration)
2. **Site URL**: `https://levelupmanager.vercel.app`
3. **Redirect URLs** (add all):
   ```
   https://levelupmanager.vercel.app/**
   http://localhost:3000/**
   ```
4. Save changes

### 2.3 Verify Email Settings
1. Go to [Auth Settings](https://supabase.com/dashboard/project/tybmpcvwjugzoyworgfx/auth/policies)
2. Ensure "Enable Email Confirmations" is configured as needed
3. Check email templates if customization is required

## Step 3: Application Configuration

### 3.1 Environment Variables
No additional environment variables needed for Google OAuth. The Supabase client uses the existing:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 3.2 Code Implementation
The application already includes Google OAuth support:

#### AuthModal Component (`/client/src/components/AuthModal.tsx`)
- Handles Google sign-in button click
- Redirects to appropriate URL based on environment
- Shows Google logo and branding

#### Database Trigger (`handle_new_user` function)
- Automatically creates user profile on first sign-in
- Extracts name from Google profile metadata
- Sets admin status for tinymanagerai@gmail.com

#### Admin Detection (`/client/src/hooks/useIsAdmin.ts`)
- Checks if user email is tinymanagerai@gmail.com
- Returns admin status regardless of auth method

## Step 4: Testing

### 4.1 Local Development Testing
1. Start the development server:
   ```bash
   npm run dev
   ```
2. Navigate to http://localhost:3000
3. Click "Sign in with Google"
4. Verify redirect to Google OAuth consent
5. After authorization, verify redirect to dashboard

### 4.2 Production Testing
1. Navigate to https://levelupmanager.vercel.app
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Verify user profile creation in Supabase dashboard
5. For admin (tinymanagerai@gmail.com):
   - Verify admin menu items appear
   - Check `users` table shows `is_admin = true`

## Step 5: Troubleshooting

### Common Issues and Solutions

#### 1. "Redirect URI mismatch" Error
**Problem**: Google OAuth shows redirect URI error
**Solution**:
- Verify exact URIs in Google Cloud Console
- Check for trailing slashes
- Ensure both http://localhost and https://levelupmanager.vercel.app are included
- Wait 5-10 minutes for Google to propagate changes

#### 2. User Profile Not Created
**Problem**: User can sign in but profile isn't created in `users` table
**Solution**:
- Check database triggers are active:
  ```sql
  SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
  ```
- Verify `handle_new_user` function exists
- Run migrations: `npx supabase db push`

#### 3. Admin Not Detected
**Problem**: tinymanagerai@gmail.com doesn't get admin access
**Solution**:
- Ensure Google account uses exact email address
- Check database directly:
  ```sql
  SELECT * FROM users WHERE email = 'tinymanagerai@gmail.com';
  ```
- Verify trigger includes admin check
- Clear browser cache and re-authenticate

#### 4. Names Not Populated
**Problem**: User's first/last name not showing after Google sign-in
**Solution**:
- Check Google account has name information
- Verify consent screen requests profile scope
- Check `raw_user_meta_data` in auth.users table
- Update trigger to handle Google's field names (given_name, family_name)

## Step 6: Security Considerations

### Best Practices
1. **Never commit secrets**: Keep Client Secret secure
2. **Use environment variables**: Store sensitive data in Vercel/Supabase
3. **Restrict domains**: Only add necessary domains to authorized lists
4. **Regular audits**: Review OAuth app permissions periodically
5. **Token rotation**: Rotate Client Secret if compromised

### Row Level Security (RLS)
The application uses RLS policies to ensure:
- Users can only view/edit their own profiles
- Admin status is protected from user modification
- Authentication is required for protected routes

## Step 7: Maintenance

### Regular Tasks
1. **Monitor sign-ins**: Check Supabase Auth logs
2. **Review users**: Verify profiles are created correctly
3. **Update redirect URLs**: When domain changes
4. **Check Google quotas**: Monitor API usage in Google Cloud Console

### Updating Configuration
When changing domains or URLs:
1. Update Google Cloud Console redirect URIs
2. Update Supabase redirect URLs
3. Update application code if hardcoded
4. Test both local and production environments

## Support Resources

- **Supabase Auth Docs**: https://supabase.com/docs/guides/auth
- **Google OAuth 2.0**: https://developers.google.com/identity/protocols/oauth2
- **Project Dashboard**: https://supabase.com/dashboard/project/tybmpcvwjugzoyworgfx
- **Admin Email**: tinymanagerai@gmail.com

## Quick Checklist

Before going live, ensure:
- [ ] Google OAuth credentials created
- [ ] Supabase provider configured with credentials
- [ ] Redirect URLs include production domain
- [ ] Database triggers are active
- [ ] Admin email (tinymanagerai@gmail.com) tested
- [ ] Both email and Google auth work
- [ ] User profiles created correctly
- [ ] Admin detection functioning