# SS Cuttings Inventory Management System (IMS)

A high-performance, multi-tenant inventory management system designed for scale.

## 🚀 Key Capabilities

- **Intelligent Analytics**: Real-time tracking of stock velocity, movement trends, and warehouse utilization.
- **Multi-Tenant Foundation**: Built-in support for tenant isolation via subdomains and automated filtering.
- **Operational Efficiency**: Streamlined purchase order workflows and critical stock replenishment alerts.
- **Robust Tech Stack**: Built with Next.js 16 (Turbopack), Prisma 7, and PostgreSQL.

## 🛠️ Development

### Setup
1. Clone the repository.
2. Install dependencies: `npm install`.
3. Set up your `.env` (refer to `.env.example`).
4. Generate Prisma Client: `npm run postinstall`.

### Running Locally
```bash
npm run dev
```

## 🌐 Deployment

This project is optimized for **Vercel**. Pushing to the `main` branch triggers an automated build and deployment process, including:
- Prisma client generation.
- Automated database migrations via `prisma migrate deploy`.
- Production-grade optimization via Turbopack.

## 📄 License
Internal use only for SS Cuttings.
