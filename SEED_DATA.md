# Seed Data Documentation

## Overview
This project includes comprehensive seed data that populates your IMS database with real inventory transactions based on the provided data tables.

## Data Included

### 🏢 Vendors (6 total)
- **SOHAM ENTERPRISES** - Dabua Pali Road
- **K K TOOLS** - NIT Faridabad
- **V V TOOLS** - IMT Faridabad
- **CNC TOOLS** - Coimbatore
- **A K MAHCINE** - Pune
- **YASH ENTERPRISES** - New Delhi

### 👥 Customers (3 total)
- CNC TOOLS
- A K MAHCINE
- YASH ENTERPRISES

### 📦 Items (17 total)
All bearing and tool items organized into categories:
- **B CLAMP TOOL HOLDER** - BTJNL 2525 M16, BTJNR 2525 M16, BVQNL 2525 M16, etc.
- **E CLAMP TOOL HOLDER** - ETJNL 2525 M16, ECLNL 2525 M12, etc.
- **CNC BORING BAR** - S08H SCLCL 06, S16Q SCLCL 09
- **TOOL SPARES** - TNMG B TOP CLAMF
- **OD GROOVING TOOLS** - TTEL 2525 2T15, MGEHL 2525 2T15, etc.

### 📊 Transaction Summary

#### Purchase Orders
- **3 Purchase Orders** created from major vendors
- **1,300 total units** purchased
- **₹645,000 total value**
- Items automatically added to inventory with batch tracking

#### Dispatch Orders
- **3 Dispatch Orders** created for customers
- **1,000 total units** dispatched
- **₹285,000 total value**
- Inventory automatically decremented upon dispatch

#### Reference Data (from source tables)
- Purchase Bills: 24 records (₹756,000)
- Sale Bills: 17 records (₹453,700)
- Purchase Orders: 9 records (₹645,000)
- Sale Orders: 8 records (₹285,000)

### 🔐 Default User
- **Username:** `admin`
- **Password:** `admin123`
- **Role:** Owner

## How to Run

### Option 1: Using npm (Recommended)
```bash
npm run seed
```

### Option 2: Using Prisma directly
```bash
npx prisma db seed
```

### Option 3: Using the shell script (Unix/Linux/Mac)
```bash
chmod +x scripts/seed-inventory-data.sh
./scripts/seed-inventory-data.sh
```

### Full Database Setup
If you need to reset the database and run migrations first:
```bash
# Reset database and run all migrations
npx prisma migrate reset --force

# Or just seed without reset
npx prisma db seed
```

## What Gets Created

### Database Schema Populated
1. **Categories** - 5 product categories
2. **Vendors** - 6 vendor records with contact information
3. **Customers** - 3 customer records
4. **Items** - 17 inventory items with SKUs
5. **Racks** - 18 storage rack locations
6. **Purchase Orders** - 3 POs with line items
7. **Dispatch Orders** - 3 dispatch orders with line items
8. **Inventory** - Real-time stock levels based on POs and dispatches
9. **Inventory Batches** - Batch tracking with cost and vendor information

## Inventory Status After Seeding

### Stock Levels (Examples)
- **BTJNL 2525 M16**: 500 PCS (from purchases - 149 dispatched)
- **ETJNL 2525 M16**: 450 PCS (from purchases - 149 dispatched)
- **S08H SCLCL 06**: 600 PCS (from purchases - 300 dispatched)

All items track:
- ✅ Total quantity purchased
- ✅ Quantity dispatched (reserved)
- ✅ Available quantity for sale
- ✅ Batch information with cost tracking
- ✅ Vendor information for reordering

## Inventory Master Data

The seed includes racks as defined in your inventory master:
```
Zone A: A1, A5
Zone B: B5, B8
Zone C: C1, C8, C9
Zone D: D2, D6
Zone I: I5
Zone AC: AC1, AC8
Zone AG: AG2
Zone AN: AN1, AN5
Zone V: V5
Zone W: W1
```

## Resetting Seed Data

### To clear and reseed:
```bash
npx prisma migrate reset --force
```

This will:
1. Drop the database
2. Run all migrations
3. Automatically run the seed script
4. Create fresh data

### To just clear data manually:
```bash
npx prisma studio
# Then manually delete records from UI, or use:
npx prisma db execute --stdin < clear-db.sql
```

## Notes

- ✅ All inventory calculations are automatic
- ✅ Batch tracking includes cost per unit for accurate inventory valuation
- ✅ Transactions are created but not explicitly logged in the separate transaction table (can be added via API calls)
- ✅ All timestamps default to creation date
- ✅ SKUs are unique and follow the naming convention
- ✅ Stock levels reflect actual purchases minus dispatches

## Troubleshooting

### If seed fails with connection error
```bash
# Check your DATABASE_URL in .env
echo $DATABASE_URL

# Make sure PostgreSQL is running
# Linux/Mac:
sudo service postgresql start

# Windows:
pg_ctl -D "C:\Program Files\PostgreSQL\data" start
```

### If seed fails with Prisma Client error
```bash
# Regenerate Prisma Client
npx prisma generate

# Then try seeding again
npm run seed
```

### If you want to use old seed.js
```bash
npm run seed:old
```

## Next Steps After Seeding

1. ✅ Login with admin/admin123
2. ✅ View inventory dashboard
3. ✅ Check dispatch orders page (populated with test data)
4. ✅ Review transactions and stock levels
5. ✅ Start managing inventory with real data

---

**Last Updated:** 2026-04-16
**Database:** PostgreSQL
**ORM:** Prisma 7.7.0
