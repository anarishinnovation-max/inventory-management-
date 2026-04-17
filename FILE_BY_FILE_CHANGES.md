# File-by-File Change Map
## Where to Find Each Change

---

## 1. SIDEBAR NAVIGATION
**File:** `src/components/Sidebar.tsx`

### Changes Needed:

```javascript
const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/" },                      // ✓ OK
  { name: "Inventory", icon: Package, href: "/inventory" },                     // ✓ OK
  { name: "Stock Locations", icon: SquareStack, href: "/racks" },              // WAS: "Rack Management"
  { name: "Orders from Vendors", icon: ShoppingCart, href: "/orders/purchase" },// WAS: "Purchase Orders"
  { name: "Orders to Customers", icon: Truck, href: "/orders/dispatch" },      // WAS: "Customer Dispatch"
  { name: "Customers", icon: Users, href: "/customers" },                      // ✓ OK
  { name: "Vendors & Prices", icon: BarChart3, href: "/vendors" },             // WAS: "Vendors & Pricing"
  { name: "History", icon: History, href: "/transactions" },                   // WAS: "Transactions"
  { name: "Settings", icon: Settings, href: "/settings" },                     // ✓ OK
];
```

---

## 2. INVENTORY PAGE - LIST
**File:** `src/app/(dashboard)/inventory/page.tsx`

### Changes Needed:

| Line | Current | New |
|------|---------|-----|
| Filter section | "Stock Status" | "Filter by Status" |
| Filter button | "All Stock" | "All Items" |
| Filter button | "Ordered" | "On Order" |
| No data state | Add simple message | "No items found" |

---

## 3. INVENTORY PAGE - FILTERS
**File:** `src/app/(dashboard)/inventory/InventoryFilters.tsx`

### Changes Needed:

```javascript
// Line ~33
<label>Stock Status</label>
// CHANGE TO:
<label>Filter by Status</label>

// Line ~39
"All Stock"
// CHANGE TO:
"All Items"

// Line ~48
"Ordered"
// CHANGE TO:
"On Order"

// Line ~56
<label>Categories</label>
// CHANGE TO:
<label>Category</label>
```

---

## 4. INVENTORY PAGE - TABLE ACTIONS
**File:** `src/app/(dashboard)/inventory/InventoryTableActions.tsx`

### Changes Needed:

```javascript
// Line ~21 - Confirmation dialog
confirm("Are you sure you want to delete this item?...")
// KEEP AS IS but simplify message to:
"Delete this item? This cannot be undone."

// Line ~34 - Error message
alert(error.error || "Failed to delete item");
// CHANGE TO:
alert(error.error || "Could not delete item");
```

---

## 5. INVENTORY PAGE - ITEM BREAKDOWN MODAL
**File:** `src/app/(dashboard)/inventory/ItemBreakdownModal.tsx`

### Changes Needed:

```javascript
// Line ~76 - Loading message
<p className="text-lg font-bold text-muted-foreground animate-pulse">
  Reconstructing procurement ledger...
</p>
// CHANGE TO:
"Loading stock details..."

// Line ~90 - Breadcrumb
<span className="text-primary/60">Stock Audit</span>
// CHANGE TO:
<span className="text-primary/60">Stock Details</span>

// Line ~94 - Title
<h2>... Origin Trail</h2>
// CHANGE TO:
<h2>... Stock Details</h2>

// Line ~118 - Section title
<h3>... Current Stock Breakdown</h3>
// CHANGE TO:
<h3>... Current Stock</h3>

// Line ~121 - Helper text
Contribution trail filtered for existing inventory
// CHANGE TO:
Where this stock came from

// Line ~152 - Loading message
"Reconstructing procurement ledger..."
// CHANGE TO:
"Loading..."
```

---

## 6. ADD NEW ITEM PAGE
**File:** `src/app/(dashboard)/inventory/new/page.tsx`

### Changes Needed:

```javascript
// Line ~63 - Page header
<h2>Add New Inventory Item</h2>
// CHANGE TO:
<h2>Add New Item</h2>

// Line ~64 - Description
Define SKU details and storage parameters for your warehouse.
// CHANGE TO:
Enter item details and stock settings

// Line ~69 - Button
Back to Inventory
// CHANGE TO:
Back

// Line ~139 - Form label
<label>Item Name</label>
// ✓ OK

// Line ~140 - Placeholder
placeholder="e.g. Industrial Servo Motor XL-500"
// CHANGE TO:
placeholder="e.g. Motor, Bolt, Wire"

// Line ~146 - Label
<label>SKU / Part Number</label>
// CHANGE TO:
<label>SKU</label>

// Line ~148 - Placeholder
placeholder="LXT-9982-A"
// ✓ OK (keep as example)

// Line ~155 - Label
<label>Unit of Measure</label>
// CHANGE TO:
<label>Unit</label>

// Line ~171 - Label
<label>Category</label>
// ✓ OK

// Line ~197 - Label
<label>Low Stock Level</label>
// ✓ OK

// Line ~211 - Checkbox label
Mark as Critical
// ✓ OK

// Line ~224 - Button
Back to Inventory
// CHANGE TO:
Back

// Line ~232 - Submit button
{loading ? "Creating Item..." : "Add Item"}
// CHANGE TO:
{loading ? "Saving..." : "Add Item"}
```

---

## 7. EDIT ITEM PAGE
**File:** `src/app/(dashboard)/inventory/[id]/edit/page.tsx`

### Changes Needed:

```javascript
// Line ~111 - Error loading state
Record Not Found
// ✓ OK

// Line ~128 - Page header
<h2>Edit Item: {itemData?.sku}</h2>
// CHANGE TO:
<h2>Edit Item</h2>

// Line ~129 - Description
Update SKU specifications and operational parameters.
// CHANGE TO:
Update item details

// Line ~134 - Button
Discard Changes
// CHANGE TO:
Back

// Line ~139 - Submit button
{loading ? "Optimizing..." : "Update Specifications"}
// CHANGE TO:
{loading ? "Saving..." : "Save Changes"}

// Line ~155 - Section header
<h3>... Core Details</h3>
// CHANGE TO:
<h3>... Item Details</h3>

// Line ~161 - Label
<label>Item Name</label>
// ✓ OK

// Line ~162 - Placeholder
placeholder="e.g. Industrial Servo Motor XL-500"
// CHANGE TO:
placeholder="e.g. Motor, Bolt, Wire"

// Line ~172 - Label
<label>SKU / Part Number</label>
// CHANGE TO:
<label>SKU</label>

// Line ~180 - Label
<label>Unit of Measure</label>
// CHANGE TO:
<label>Unit</label>

// Line ~197 - Label
<label>Category</label>
// ✓ OK

// Line ~239 - Label for critical items
<span className="text-error...">Alert Threshold</span>
// CHANGE TO:
<span className="text-error...">Low Stock Level</span>

// Line ~270 - Cancel button
Discard Changes
// CHANGE TO:
Cancel

// Line ~280 - Submit button
{loading ? "Optimizing..." : "Update Specifications"}
// CHANGE TO:
{loading ? "Saving..." : "Save Changes"}
```

---

## 8. PURCHASE ORDERS PAGE
**File:** `src/app/(dashboard)/orders/purchase/page.tsx`

### Changes Needed:

```javascript
// Line ~67
<h1>Inbound Procurement</h1>
// CHANGE TO:
<h1>Purchase Orders</h1>

// Line ~68
<p>Manage supply pipeline and verify inbound logistics.</p>
// CHANGE TO:
<p>Manage orders from vendors</p>

// Line ~70
<span>Create Purchase Order</span>
// CHANGE TO:
<span>New Order</span>

// Line ~85
<p>Draft/Pending</p>
// CHANGE TO:
<p>Pending</p>

// Line ~97
<p>Expected Goods</p>
// CHANGE TO:
<p>On Order</p>

// Line ~130 - Table header (if exists)
"Order Identity" → "Order #"
"Line Items" → "Items"
"Payment Mode" → "Payment"
"Fulfillment Status" → "Status"
"Timestamp" → "Date"
```

---

## 9. DISPATCH ORDERS PAGE
**File:** `src/app/(dashboard)/orders/dispatch/page.tsx`

### Changes Needed:

```javascript
// Line ~43
<h1>Customer Fulfillment</h1>
// CHANGE TO:
<h1>Customer Orders</h1>

// Line ~44
<p>Manage outbound dispatches and verify customer shipments.</p>
// CHANGE TO:
<p>Manage orders to customers</p>

// Line ~49
<span>Create New Dispatch</span>
// CHANGE TO:
<span>New Order</span>

// Line ~60
<span>PENDING PICKING</span>
// CHANGE TO:
<span>READY TO SHIP</span>

// Line ~64
<p>Orders awaiting fulfillment</p>
// CHANGE TO:
<p>Ready to ship</p>

// Line ~77
<span>COMPLETED</span>
// CHANGE TO:
<span>SHIPPED</span>

// Line ~81
<p>Successfully shipped items</p>
// CHANGE TO:
<p>Already shipped</p>

// Line ~100 - Table headers (if exists)
"Order Identity" → "Order #"
"Recipient" → "Customer"
"Line Items" → "Items"
"Payment Mode" → "Payment"
"Fulfillment Status" → "Status"
"Timestamp" → "Date"
```

---

## 10. CUSTOMERS PAGE
**File:** `src/app/(dashboard)/customers/page.tsx`

### Changes Needed:

```javascript
// Line ~54
<h1>Customers</h1>
// ✓ OK

// Line ~55
<p>Strategic account management and interaction tracking.</p>
// CHANGE TO:
<p>View and manage customers</p>

// Line ~96
<h2>Customers Directory</h2>
// CHANGE TO:
<h2>Customers</h2>

// Line ~110
<p className="text-[10px]...">No Contact</p>
// CHANGE TO:
<p className="text-[10px]...">No Phone</p>

// Line ~115
{customer.totalTransactions} Orders
// ✓ OK
```

---

## 11. CUSTOMER MODAL
**File:** `src/app/(dashboard)/customers/CustomerModal.tsx`

### Changes Needed:

```javascript
// Line ~49 - Button
<span>Add Account</span>
// CHANGE TO:
<span>Add Customer</span>

// Line ~67 - Modal title
<h2>Onboard Entity</h2>
// CHANGE TO:
<h2>Add New Customer</h2>

// Line ~68 - Modal description
<p>Register a new client or corporate account.</p>
// CHANGE TO:
<p>Add a new customer</p>

// Line ~92 - Form label
<label>Account Name</label>
// CHANGE TO:
<label>Customer Name</label>

// Line ~95 - Placeholder
placeholder="e.g. Acme Corp Industries"
// CHANGE TO:
placeholder="e.g. John Smith or ABC Company"

// Line ~107 - Form label
<label>Email Address</label>
// CHANGE TO:
<label>Email</label>

// Line ~119 - Form label
<label>Direct Contact</label>
// CHANGE TO:
<label>Phone Number</label>

// Line ~131 - Form label
<label>Physical Address</label>
// CHANGE TO:
<label>Address</label>

// Line ~137 - Placeholder
placeholder="HQ address or primary warehouse location..."
// CHANGE TO:
placeholder="Street address or location"

// Line ~154 - Cancel button
<span>Discard</span>
// CHANGE TO:
<span>Cancel</span>

// Line ~162 - Submit button text
Validating & Saving... / Authorize Account Creation
// CHANGE TO:
Saving... / Save Customer

// Line ~166 - Error message (if any)
"Failed to create customer."
// CHANGE TO:
"Could not add customer"
```

---

## 12. VENDORS PAGE
**File:** `src/app/(dashboard)/vendors/page.tsx`

### Changes Needed:

```javascript
// Line ~50
<h1>Strategic Sourcing</h1>
// CHANGE TO:
<h1>Vendors & Prices</h1>

// Line ~51
<p>Manage vendor relationships and analyze procurement pricing.</p>
// CHANGE TO:
<p>Manage vendors and their prices</p>

// Line ~60
<h2>Vendor Directory</h2>
// CHANGE TO:
<h2>Vendors</h2>

// Line ~90
<span>{vendor.items.length} Contracts</span>
// CHANGE TO:
<span>{vendor.items.length} Orders</span>
```

---

## 13. TRANSACTIONS PAGE
**File:** `src/app/(dashboard)/transactions/page.tsx`

### Changes Needed:

```javascript
// Line ~71
<h1>Unified Audit Registry</h1>
// CHANGE TO:
<h1>Transaction History</h1>

// Line ~72
<p>Immutable real-time ledger of all warehouse operations and stock movements.</p>
// CHANGE TO:
<p>View all stock movements and updates</p>

// Line ~94
<h3>Global Operations Log</h3>
// CHANGE TO:
<h3>All Transactions</h3>

// Line ~96
{transactions.length} Records Verified
// CHANGE TO:
{transactions.length} Transactions

// Line ~103 - Table header
"Operation Type" → "Type"
"Asset Details" → "Item"
"Volume" → "Quantity"
"Location" → "Location" ✓
"Entity / Authority" → "From/To"
"Timestamp" → "Date"

// Line ~137
<p>IN / PURCHASE related...</p>
// Transaction types should be:
// "Received from Vendor" instead of "PURCHASE"
// "Sold to Customer" instead of "SALE"
// "Added" instead of "ADJUSTMENT_IN"
// "Removed" instead of "ADJUSTMENT_OUT"

// Line ~163
"In-Transit"
// CHANGE TO:
"In Transit"

// Line ~174
"Internal Ledger Update"
// CHANGE TO:
"System Update"
```

---

## 14. DASHBOARD PAGE
**File:** `src/app/(dashboard)/page.tsx`

### Changes Needed (if any descriptions show to users):

Look for any user-visible descriptions and apply these principles:
- "Priority Replenish" → "Items to Reorder"
- "Velocity Analysis" → "Best Sellers"
- "Stock Flow Dynamics" → "Stock Movement"

---

## 15. LOGIN PAGE
**File:** `src/app/login/page.tsx`

### Changes Needed (Optional):

```javascript
// Line ~46 - App name
<h1>Logistix Core</h1>
// Consider simplifying to your actual app name

// Line ~47 - Subtitle
<p>Warehouse Management System</p>
// CHANGE TO:
<p>Inventory System</p>

// Labels
"Username" → "Username" ✓ OK
"Password" → "Password" ✓ OK
```

---

## 16. USER ACTIONS FILE
**File:** `src/lib/user-actions.ts`

### Changes Needed (if error messages show):

```typescript
// Line ~20 - Error in createCustomer function
throw new Error("Unauthorized");
// Keep or use: "Could not add customer"

// Add better error handling for API calls:
// "Could not save" instead of generic errors
// "Please try again" for network errors
// "Could not add customer" for specific failures
```

---

## SUMMARY BY PRIORITY

### 🔴 CRITICAL (Do First)
1. **src/components/Sidebar.tsx** - Navigation labels
2. **src/app/(dashboard)/inventory/InventoryFilters.tsx** - Filter buttons
3. **src/app/(dashboard)/inventory/page.tsx** - Main page
4. **src/app/(dashboard)/orders/purchase/page.tsx** - Purchase page
5. **src/app/(dashboard)/orders/dispatch/page.tsx** - Dispatch page
6. **src/app/(dashboard)/customers/CustomerModal.tsx** - Customer form

### 🟠 HIGH (Do Next)
7. **src/app/(dashboard)/customers/page.tsx** - Customer list
8. **src/app/(dashboard)/vendors/page.tsx** - Vendor page
9. **src/app/(dashboard)/transactions/page.tsx** - Transaction page
10. **src/app/(dashboard)/inventory/new/page.tsx** - Add item form
11. **src/app/(dashboard)/inventory/[id]/edit/page.tsx** - Edit item form
12. **src/app/(dashboard)/inventory/ItemBreakdownModal.tsx** - Modal text
13. **src/app/(dashboard)/inventory/InventoryTableActions.tsx** - Table actions

### 🟡 MEDIUM (After Core)
14. **src/app/(dashboard)/page.tsx** - Dashboard (if needed)
15. **src/lib/user-actions.ts** - Error messages (if shown to users)
16. **src/app/login/page.tsx** - Login page (optional)

---

## TESTING CHECKLIST

After making changes:

- [ ] Can a non-technical person understand all button labels?
- [ ] Are error messages clear about what went wrong?
- [ ] Can users find navigation items without confusion?
- [ ] Do form labels clearly describe what to enter?
- [ ] Are status labels consistent throughout the app?
- [ ] Do table headers clearly describe the data?
- [ ] Are loading messages clear?
- [ ] Can users complete common tasks without confusion?

