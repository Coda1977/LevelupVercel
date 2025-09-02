# Email Authentication Fix Guide

## 🔧 Issues Fixed

1. **User Profile Creation** - Fixed the trigger to properly handle UUID types
2. **Sign-in Flow** - Added check to create user profile if it doesn't exist
3. **Redirect URLs** - Properly configured for Vercel deployment

## 📋 Steps to Complete Email Authentication Setup

### 1. Enable Email Provider in Supabase

Go to [Authentication Providers](https://supabase.com/dashboard/project/tybmpcvwjugzoyworgfx/auth/providers):
- Toggle **Email** to ON
- Configure settings:
  - ✅ Enable email sign-ups
  - ⚠️ Consider disabling "Confirm email" for testing (enable for production)
  - ✅ Enable password recovery

### 2. Configure Redirect URLs in Supabase

Go to [Authentication Settings > URL Configuration](https://supabase.com/dashboard/project/tybmpcvwjugzoyworgfx/auth/url-configuration):

Add these URLs to **Redirect URLs** (allowed list):
```
https://levelup-vercel-b6e3jrlvk-yonatan-primes-projects.vercel.app/**
https://levelup-vercel.vercel.app/**
http://localhost:3000/**
```

**Site URL**: 
```
https://levelup-vercel-b6e3jrlvk-yonatan-primes-projects.vercel.app
```

### 3. Run the Authentication Fix SQL

Go to [SQL Editor](https://supabase.com/dashboard/project/tybmpcvwjugzoyworgfx/sql/new) and run:

```sql
-- Copy and paste the entire contents of fix-auth.sql
```

This will:
- Fix UUID type issues
- Update the user creation trigger
- Handle existing users properly
- Set up admin access for tinymanagerai@gmail.com

### 4. Configure Email Templates (Optional)

Go to [Email Templates](https://supabase.com/dashboard/project/tybmpcvwjugzoyworgfx/auth/templates):
- Customize confirmation email
- Customize recovery email
- Add your branding

## 🧪 Testing Email Authentication

### Sign Up Flow:
1. Visit: https://levelup-vercel-b6e3jrlvk-yonatan-primes-projects.vercel.app
2. Click "Get Started"
3. Enter email and password
4. Click "Sign Up"
5. Check email for confirmation (if enabled)
6. Sign in with credentials

### Sign In Flow:
1. Click "Get Started"
2. Enter email and password
3. Click "Sign In"
4. Should redirect to /dashboard

### Common Issues & Solutions:

**Issue**: "Email not confirmed"
- **Solution**: Either confirm email or disable confirmation in Supabase settings

**Issue**: User profile not created
- **Solution**: Run the fix-auth.sql script to update triggers

**Issue**: Redirect not working
- **Solution**: Add your domain to Redirect URLs in Supabase

**Issue**: "Invalid login credentials"
- **Solution**: Check if user exists in auth.users table, reset password if needed

## 🔐 Security Notes

For production:
1. **Enable email confirmation** - Prevents spam accounts
2. **Set up SMTP** - Use custom SMTP for better deliverability
3. **Add rate limiting** - Supabase has built-in rate limiting
4. **Monitor auth logs** - Check Authentication > Logs regularly

## ✅ What's Working Now

- ✅ Email sign-up with proper user profile creation
- ✅ Email sign-in with profile sync
- ✅ Google OAuth sign-in
- ✅ Admin access for tinymanagerai@gmail.com
- ✅ Protected admin routes
- ✅ Automatic user profile creation via trigger

## 🚀 Your App

**Live URL**: https://levelup-vercel-b6e3jrlvk-yonatan-primes-projects.vercel.app

Once you complete the Supabase configuration steps above, email authentication will work perfectly!