# SS Cuttings: Production Deployment Guide

This guide details the deployment flow for the SS Cuttings multi-tenant architecture.

## Architecture Overview
- **Hosting**: Vercel (Next.js 16).
- **Database**: PostgreSQL (Supabase, Neon, or RDS).
- **Interception**: `proxy.ts` handles tenant routing based on subdomains.

## Deployment Workflow

### 1. Database Configuration
Ensure your PostgreSQL instance is ready and accessible.
- **SSL**: Most providers require `?sslmode=require` in the connection string.

### 2. Vercel Setup
1. **Environment Variables**:
   Add the following in Vercel Settings:
   - `DATABASE_URL`: Production connection string.
   - `JWT_SECRET`: Random 32+ character string.
2. **Wildcard Domains**:
   To support subdomains (e.g., `client1.yourdomain.com`), configure a **Wildcard Domain** in Vercel.

### 3. Automated Deployment
This project uses a custom build command in `package.json`:
`prisma generate && prisma migrate deploy && next build`

**What happens during deployment:**
- **Code Build**: Next.js compiles the app using Turbopack.
- **Database Migration**: `prisma migrate deploy` automatically applies any new tables or schema changes to your production database without data loss.
- **Prisma Client**: The client is generated specifically for the environment.

## Scaling
The multi-tenant architecture is designed to scale horizontally. As you add more tenants, you only need to ensure your PostgreSQL pool size is scaled accordingly.

---
*Generated for SS Cuttings Deployment - 2026*
