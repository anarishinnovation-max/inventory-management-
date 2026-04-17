#!/bin/bash

# Seed Data Setup Guide for IMS

echo "🔄 Starting database seed with inventory transaction data..."

# Step 1: Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Step 2: Run migrations (if any are pending)
echo "🔧 Running database migrations..."
npx prisma migrate dev --skip-generate

# Step 3: Seed the database
echo "🌱 Seeding database with inventory data..."
npx prisma db seed

echo ""
echo "✅ Database seed completed successfully!"
echo ""
echo "📊 Seed Data Summary:"
echo "  • Vendors: 6 (SOHAM ENTERPRISES, K K TOOLS, V V TOOLS, CNC TOOLS, A K MAHCINE, YASH ENTERPRISES)"
echo "  • Items: 17 (Various clamps, boring bars, tool holders, and spares)"
echo "  • Customers: 3 (CNC TOOLS, A K MAHCINE, YASH ENTERPRISES)"
echo "  • Purchase Orders: 3 (1,300 qty, ₹645,000 value)"
echo "  • Dispatch Orders: 3 (1,000 qty, ₹285,000 value)"
echo ""
echo "📝 Transaction Summary:"
echo "  • Purchase Bills: 24 records (3,050 qty, ₹756,000)"
echo "  • Sale Bills: 17 records (1,339 qty, ₹453,700)"
echo "  • Purchase Orders: 9 records (1,300 qty, ₹645,000)"
echo "  • Sale Orders: 8 records (1,000 qty, ₹285,000)"
echo ""
echo "🔑 Login Credentials:"
echo "  • Username: admin"
echo "  • Password: admin123"
