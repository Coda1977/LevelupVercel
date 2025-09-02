# CLAUDE.md - LevelUp Management Platform (Vercel + Supabase)

## Project Overview

**LevelUp** is a comprehensive management development platform migrated from Replit to Vercel + Supabase infrastructure. It provides bite-sized leadership insights, AI-powered coaching, and progress tracking for managers at all levels.

### Key Features
- **Curated Content Library**: Leadership lessons and book summaries
- **AI Mentor**: Personalized coaching with GPT-4 integration
- **Progress Tracking**: User analytics and completion tracking
- **Audio Narration**: AI-generated audio for all content
- **Admin Dashboard**: Content management for administrators
- **Authentication**: Email and Google OAuth via Supabase Auth
- **Real-time Sync**: Automatic user profile synchronization

### Tech Stack
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js + TypeScript + Drizzle ORM
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Email + Google OAuth)
- **Deployment**: Vercel
- **AI Integration**: OpenAI GPT-4 + TTS
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter

## Project URLs

- **Production**: https://levelup-vercel.vercel.app
- **Supabase Dashboard**: https://supabase.com/dashboard/project/tybmpcvwjugzoyworgfx
- **GitHub**: https://github.com/Coda1977/LevelUp2.git

## Build, Dev, and Test Commands

### Development
```bash
# Start development server (full stack)
npm run dev

# Frontend only (Vite dev server)
cd client && npm run dev

# Backend only (Express server)
cd server && npm run dev

# Install dependencies
npm install
```

### Build & Deploy
```bash
# Build for production
npm run build

# Deploy to Vercel
vercel

# Push database migrations
SUPABASE_ACCESS_TOKEN="sbp_7383804180ccf0ef0260970058ea68a2ac364299" \
npx supabase db push --password "LevelUp2024Secure!"
```

### Database Management
```bash
# Link to Supabase project
npx supabase link --project-ref tybmpcvwjugzoyworgfx

# Create new migration
npx supabase migration new <migration_name>

# Push migrations
npx supabase db push

# Pull remote schema
npx supabase db pull
```

### Testing & Linting
```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Format code
npm run format
```

## Environment Variables

### Required for Production
```env
# Supabase
VITE_SUPABASE_URL=https://tybmpcvwjugzoyworgfx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
DATABASE_URL=postgresql://...

# OpenAI
OPENAI_API_KEY=sk-...

# Vercel
VERCEL_URL=https://levelup-vercel.vercel.app
```

### Admin Access
- **Admin Email**: tinymanagerai@gmail.com
- Admin status is automatically granted to this email on sign-up/sign-in

## Safe and Unsafe File Boundaries

### ✅ SAFE TO MODIFY

#### Frontend (`/client/src/`)
- `pages/*.tsx` - Page components
- `components/*.tsx` - React components  
- `hooks/*.ts` - Custom React hooks
- `lib/*.ts` - Utilities and configurations
- `styles/*.css` - Styling files

#### Backend (`/server/`)
- `routes.ts` - API endpoints
- `storage.ts` - Database queries
- `openai.ts` - AI integration
- `audio.ts` - Audio generation

#### Database (`/supabase/`)
- `migrations/*.sql` - Database migrations
- New migration files

#### Configuration
- `package.json` - Dependencies
- `tsconfig.json` - TypeScript config
- `vite.config.ts` - Build configuration
- `tailwind.config.js` - Tailwind settings

### ⚠️ MODIFY WITH CAUTION

#### Database Schema
- `/db/schema.ts` - Check migration impact
- Existing migrations - May break database

#### Authentication
- `/client/src/lib/supabase.ts` - Supabase client config
- `/client/src/hooks/useAuth.ts` - Auth logic

### 🚫 DO NOT MODIFY

#### Security & Credentials
- `.env` - Environment variables
- `.env.local` - Local secrets
- Any file containing API keys or tokens

#### Supabase Configuration
- Project ID: `tybmpcvwjugzoyworgfx`
- Access tokens in environment variables

#### Generated Files
- `node_modules/`
- `dist/`
- `.vercel/`
- `package-lock.json`

## Coding Standards

### TypeScript
- Use strict mode
- Explicit type definitions for all props and returns
- No `any` types - use `unknown` or proper types
- Interfaces in PascalCase

### React
- Functional components with hooks
- Props destructuring in parameters
- Complete useEffect dependencies
- Custom hooks for reusable logic

### Database
- Use Drizzle ORM for queries
- UUID types for all IDs
- Transactions for multi-step operations
- Proper error handling

### API
- RESTful conventions
- Consistent error responses
- Input validation
- Authentication middleware for protected routes

### Styling
- Tailwind utilities first
- CSS variables for theme colors
- Mobile-first responsive design
- Component-specific classes when needed

## Critical Project Information

### Database Structure
- **Users**: Synced with Supabase Auth via triggers
- **Categories**: Leadership topics
- **Chapters**: Individual lessons
- **User Progress**: Completion tracking
- **Chat Sessions**: AI conversation history
- **Shared Chapters**: Social sharing feature

### Authentication Flow
1. User signs up/in via Supabase Auth
2. Trigger creates/updates user profile in public.users
3. Admin status checked for tinymanagerai@gmail.com
4. RLS policies enforce access control

### Known Issues & Solutions

#### UUID Type Conflicts
- **Issue**: Legacy VARCHAR columns from Replit migration
- **Solution**: Migration 20250902000003 converts to UUID

#### User Profile Sync
- **Issue**: Auth users not syncing to public.users
- **Solution**: Trigger function `handle_new_user()` handles sync

#### Email Authentication
- **Issue**: Email provider needs manual enabling
- **Solution**: Enable in Supabase dashboard > Authentication > Providers

### Deployment Checklist
1. ✅ Environment variables set in Vercel
2. ✅ Database migrations applied
3. ✅ Supabase Auth providers configured
4. ✅ Redirect URLs whitelisted
5. ✅ Admin user configured
6. ✅ RLS policies active

## Supabase CLI Commands Used

```bash
# Project creation and linking
SUPABASE_ACCESS_TOKEN="sbp_7383804180ccf0ef0260970058ea68a2ac364299" \
npx supabase projects create levelup-management \
  --org-id iaqmgtfutvayeupjjfbe \
  --region us-east-1 \
  --plan free \
  --db-password "LevelUp2024Secure!"

# Database operations
SUPABASE_ACCESS_TOKEN="sbp_7383804180ccf0ef0260970058ea68a2ac364299" \
npx supabase link --project-ref tybmpcvwjugzoyworgfx --password "LevelUp2024Secure!"

SUPABASE_ACCESS_TOKEN="sbp_7383804180ccf0ef0260970058ea68a2ac364299" \
npx supabase db push --password "LevelUp2024Secure!"
```

## Quick Reference

### Common Tasks
- **Add new page**: Create in `/client/src/pages/`, update routing
- **Add API endpoint**: Add to `/server/routes.ts`
- **Database change**: Create migration in `/supabase/migrations/`
- **Update auth**: Modify `/client/src/hooks/useAuth.ts`
- **Admin feature**: Check `useIsAdmin()` hook

### Troubleshooting
- **Build fails**: Check TypeScript errors with `npm run typecheck`
- **Auth issues**: Verify Supabase Auth configuration
- **Database errors**: Check migrations and RLS policies
- **Deployment fails**: Verify environment variables in Vercel

### Testing Accounts
- **Admin**: tinymanagerai@gmail.com (auto-admin on signup)
- **Regular User**: Any other email address

## Migration History

This project was successfully migrated from:
- **Original Platform**: Replit
- **Original Auth**: Replit Auth
- **Original Database**: PostgreSQL (Replit)

To:
- **New Platform**: Vercel
- **New Auth**: Supabase Auth
- **New Database**: Supabase (PostgreSQL)

Migration completed on: September 2, 2025

---

**Note**: This is a production application. Always test changes locally before deploying. Maintain backward compatibility and ensure data integrity when making database changes.