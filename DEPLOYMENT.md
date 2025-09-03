# LevelUp Manager Deployment Guide

## 🚀 Production URL
**https://levelupmanager.vercel.app**

## 📋 Deployment Checklist

### 1. Vercel Configuration
✅ Domain: `levelupmanager.vercel.app`
- Set in Vercel Dashboard > Settings > Domains

### 2. Environment Variables (Vercel Dashboard)
Add these in Settings > Environment Variables:
```bash
VITE_SUPABASE_URL=https://tybmpcvwjugzoyworgfx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://...
```

### 3. Supabase Configuration

#### Authentication Providers
Go to: https://supabase.com/dashboard/project/tybmpcvwjugzoyworgfx/auth/providers

##### Email Provider
- ✅ Enable Email Provider
- Configure email templates as needed

##### Google OAuth Provider
- ✅ Enable Google OAuth
- **Client ID**: Get from Google Cloud Console
- **Client Secret**: Get from Google Cloud Console

**Setting up Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Application type: Web application
6. Authorized JavaScript origins:
   - `https://tybmpcvwjugzoyworgfx.supabase.co`
   - `https://levelupmanager.vercel.app`
   - `http://localhost:3000` (for development)
7. Authorized redirect URIs:
   - `https://tybmpcvwjugzoyworgfx.supabase.co/auth/v1/callback`
   - `https://levelupmanager.vercel.app/dashboard`
   - `http://localhost:3000/dashboard` (for development)
8. Copy Client ID and Client Secret to Supabase

#### Redirect URLs
Go to: https://supabase.com/dashboard/project/tybmpcvwjugzoyworgfx/auth/url-configuration

Add these URLs:
```
https://levelupmanager.vercel.app/**
http://localhost:3000/**
```

#### Site URL
Set to: `https://levelupmanager.vercel.app`

### 4. Database Setup
```bash
# Run migrations
npx supabase db push

# Or run the setup script
node setup.js
```

### 5. Admin Access
The user `tinymanagerai@gmail.com` is automatically granted admin access on sign-up.

#### How Admin Detection Works:
1. **Email Authentication**: When tinymanagerai@gmail.com signs up via email
2. **Google OAuth**: When a Google account with tinymanagerai@gmail.com signs in
3. **Database Trigger**: Automatically sets `is_admin = true` in the users table
4. **Runtime Check**: The `useIsAdmin` hook always returns true for this email

#### Authentication Flow:
1. User clicks "Sign in with Google" or enters email/password
2. Supabase handles OAuth flow or password verification
3. On successful auth, database trigger creates/updates user profile
4. User is redirected to `/dashboard`
5. Admin users see additional admin menu items

## 🔄 Deployment Commands

### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Push Code Updates
```bash
git add .
git commit -m "Your changes"
git push origin main
```

Vercel will automatically deploy on push to main branch.

## 🧪 Testing

### Local Development
```bash
npm install
npm run dev
```

### Build Test
```bash
npm run build
```

## 📊 Monitoring

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard/project/tybmpcvwjugzoyworgfx
- **Analytics**: Built-in analytics at `/analytics` route

## 🔧 Troubleshooting

### Auth Issues

#### Email Authentication
1. Check Supabase redirect URLs include `https://levelupmanager.vercel.app/**`
2. Verify environment variables in Vercel
3. Ensure Email provider is enabled in Supabase

#### Google OAuth Issues
1. **Error: "Redirect URI mismatch"**
   - Verify redirect URIs in Google Cloud Console match exactly
   - Include both production and localhost URLs
   - Check for trailing slashes

2. **Error: "User profile not created"**
   - Check database triggers are active
   - Verify `handle_new_user` function exists
   - Run migrations: `npx supabase db push`

3. **Admin not detected for tinymanagerai@gmail.com**
   - Ensure Google account uses exact email
   - Check `users` table has `is_admin = true`
   - Verify `useIsAdmin` hook is checking correctly

### Database Issues
1. Run migrations: `npx supabase db push`
2. Check DATABASE_URL environment variable
3. Verify Supabase project is active

### Deployment Issues
1. Check build logs in Vercel dashboard
2. Verify all environment variables are set
3. Ensure no TypeScript errors: `npm run typecheck`

## 📞 Support

- **GitHub Issues**: https://github.com/Coda1977/LevelupVercel/issues
- **Vercel Support**: https://vercel.com/support
- **Supabase Support**: https://supabase.com/support