# SS Cuttings: Production Deployment Guide

This guide provides step-by-step instructions to host the **SS Cuttings** system on a professional cloud stack (Vercel + Managed PostgreSQL).

## Phase 1: Database Setup (Supabase or Neon)
We recommend a managed database to ensure **24/7 availability** and **automatic backups**.

1.  **Create a Database**: Sign up for [Supabase](https://supabase.com) or [Neon](https://neon.tech).
2.  **Get Connection String**: Copy your URI (e.g., `postgresql://user:pass@endpoint:5432/db`).
3.  **Prepare for SSL**: Ensure your connection string includes `?sslmode=require` if required by the provider.

## Phase 2: Application Hosting (Vercel)
Vercel is the recommended host for Next.js applications.

1.  **Connect Repository**: Push your code to GitHub/GitLab and connect it to Vercel.
2.  **Configure Environment Variables**:
    In the Vercel Dashboard, go to **Settings > Environment Variables** and add:
    - `DATABASE_URL`: Your production connection string.
    - `JWT_SECRET`: A long, random string (e.g., `openssl rand -base64 32`).
3.  **Deploy**: Vercel will automatically build and deploy your app.

## Phase 3: Database Migration
Once the environment variables are set, you need to apply the schema to your production database.

1.  **Run Migration**: Locally, run the following command pointing to your production DB:
    ```bash
    npm run db:migrate:prod
    ```
    *This command uses `prisma migrate deploy`, which is safe for production.*

## Operations & Reliability
- **Backups**: If using Supabase/Neon, daily backups are automatic. You can find them in the "Backups" tab of their dashboards.
- **Monitoring**: Use the **Vercel Analytics** tab to monitor performance as your item count grows into the thousands.
- **Uptime**: Vercel provides a 99.9% uptime guarantee for Pro accounts.

***

### Preparation Checklist (Already Completed)
- [x] **Performance**: Added `@index` to high-traffic database columns.
- [x] **Security**: Configured `X-Frame-Options` and `X-Content-Type` headers in `next.config.ts`.
- [x] **Automation**: Added `postinstall` scripts to `package.json` for automatic Prisma generation.
