# Google Authentication Setup for LevelUp

## 🔐 Steps to Enable Google Sign-In

### 1. Enable Google Provider in Supabase

1. Go to [Supabase Authentication Providers](https://supabase.com/dashboard/project/tybmpcvwjugzoyworgfx/auth/providers)
2. Find **Google** in the list
3. Toggle it **ON**

### 2. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Go to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Choose **Web application**
6. Add these settings:
   - **Authorized JavaScript origins**: 
     - `https://tybmpcvwjugzoyworgfx.supabase.co`
   - **Authorized redirect URIs**: 
     - `https://tybmpcvwjugzoyworgfx.supabase.co/auth/v1/callback`
7. Copy the **Client ID** and **Client Secret**

### 3. Configure in Supabase

1. Back in [Supabase Auth Providers](https://supabase.com/dashboard/project/tybmpcvwjugzoyworgfx/auth/providers)
2. Click on **Google**
3. Paste your:
   - **Client ID**
   - **Client Secret**
4. Save the configuration

### 4. Run Admin Setup SQL

Run this SQL in [Supabase SQL Editor](https://supabase.com/dashboard/project/tybmpcvwjugzoyworgfx/sql/new):

```sql
-- Copy contents of setup-admin.sql and run it
```

This will:
- Add admin column to users table
- Set tinymanagerai@gmail.com as admin automatically
- Create admin check functions
- Set up proper RLS policies

## 🎯 How It Works

### For Admin Access (tinymanagerai@gmail.com):

1. Click "Get Started" on the app
2. Click "Google" button in the sign-in modal
3. Sign in with tinymanagerai@gmail.com
4. You'll automatically have admin access
5. Navigate to `/admin` to manage content

### Admin Features:
- ✅ Full access to admin panel at `/admin`
- ✅ Create/Edit/Delete categories
- ✅ Create/Edit/Delete chapters
- ✅ Manage all content
- ✅ View analytics

### For Regular Users:
- Sign in with Google or Email
- Access learning content
- Track progress
- Use AI coach
- No admin access

## 🚀 Your Deployed App

**Live URL**: https://levelup-vercel-7v39fgp93-yonatan-primes-projects.vercel.app

## ⚠️ Important Notes

1. **First-time login**: The admin status is set automatically when tinymanagerai@gmail.com signs in
2. **Security**: Only tinymanagerai@gmail.com has admin access by default
3. **Additional admins**: Can be added by updating the `is_admin` field in the users table

## 🧪 Testing

1. Visit the app
2. Click "Get Started"
3. Sign in with Google using tinymanagerai@gmail.com
4. Go to `/admin` - you should have full access
5. Try with another Google account - should see "Access Denied"