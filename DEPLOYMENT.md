# Deployment Guide

## Database Setup for Vercel

### Problem
SQLite doesn't work on Vercel (serverless). You need a PostgreSQL database.

### Solution: Use Vercel Postgres (Recommended)

#### Step 1: Create Database
1. Go to your Vercel project dashboard
2. Click "Storage" tab
3. Click "Create Database"
4. Select "Postgres"
5. Choose a name (e.g., `manychat-helper-db`)
6. Select region closest to your users
7. Click "Create"

#### Step 2: Connect Database
Vercel will automatically add these environment variables:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL` ← Use this one
- `POSTGRES_URL_NON_POOLING`

#### Step 3: Update Prisma Schema
Change `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // Change from "sqlite"
  url      = env("DATABASE_URL")
}
```

#### Step 4: Update Environment Variable
In Vercel:
1. Go to Settings → Environment Variables
2. Add new variable:
   - Key: `DATABASE_URL`
   - Value: Copy the `POSTGRES_PRISMA_URL` value
   - Select all environments (Production, Preview, Development)

#### Step 5: Run Migrations
```bash
# Update schema for PostgreSQL
npx prisma generate
npx prisma db push

# Seed database
npx prisma db seed
```

Or redeploy from Vercel:
- Vercel will run migrations automatically on deploy

### Alternative: Supabase (Free PostgreSQL)

1. Create account at https://supabase.com
2. Create new project
3. Copy connection string from Settings → Database
4. Format: `postgresql://postgres:[password]@[host]:5432/postgres`
5. Add to Vercel as `DATABASE_URL` environment variable
6. Redeploy

### Local Development with PostgreSQL

If you want to use PostgreSQL locally:

```bash
# Install PostgreSQL (macOS)
brew install postgresql
brew services start postgresql

# Create database
createdb manychat_helper

# Update .env
DATABASE_URL="postgresql://localhost:5432/manychat_helper"

# Run migrations
npm run prisma:push
npm run prisma:seed
```

## Current Error Fix

The 500 error on `/api/admin/stats` is because:
1. SQLite database doesn't exist on Vercel
2. Need to switch to PostgreSQL

**Quick Fix:**
1. Follow "Vercel Postgres" steps above
2. Redeploy
3. Dashboard will work

## Testing Deployment

After setup, test these URLs:
- `https://flowkick.kua.cl/admin` - Admin dashboard
- `https://flowkick.kua.cl/api/helpers/list` - Should return `{"helpers":[]}`
- `https://flowkick.kua.cl/api/admin/stats` - Should return stats (not 500)
