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
- ✅ Enable Email Provider
- ✅ Enable Google OAuth (optional)

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
1. Check Supabase redirect URLs include `https://levelupmanager.vercel.app/**`
2. Verify environment variables in Vercel
3. Ensure Email provider is enabled in Supabase

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