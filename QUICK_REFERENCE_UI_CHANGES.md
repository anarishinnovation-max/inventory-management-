# Quick Reference: UI Text Changes
## Simple, Clear, and Consistent Language

---

## PAGE TITLES & DESCRIPTIONS

### Inventory
- ❌ "Add New Inventory Item" → ✅ "Add New Item"
- ❌ "Edit Item: {sku}" → ✅ "Edit Item"
- ❌ "Define SKU details and storage parameters for your warehouse" → ✅ "Enter item details and stock settings"

### Purchase Orders
- ❌ "Inbound Procurement" → ✅ "Purchase Orders"
- ❌ "Manage supply pipeline and verify inbound logistics" → ✅ "Manage orders from vendors"
- ❌ "Create Purchase Order" → ✅ "New Order"

### Dispatch Orders
- ❌ "Customer Fulfillment" → ✅ "Customer Orders"
- ❌ "Manage outbound dispatches and verify customer shipments" → ✅ "Manage orders to customers"
- ❌ "Create New Dispatch" → ✅ "New Order"

### Customers
- ❌ "Strategic account management and interaction tracking" → ✅ "View and manage customers"
- ❌ "Add Account" → ✅ "Add Customer"
- ❌ "Onboard Entity" → ✅ "Add New Customer"
- ❌ "Authorize Account Creation" → ✅ "Save Customer"

### Vendors
- ❌ "Strategic Sourcing" → ✅ "Vendors & Prices"
- ❌ "Manage vendor relationships and analyze procurement pricing" → ✅ "Manage vendors and their prices"

### Transactions
- ❌ "Unified Audit Registry" → ✅ "Transaction History"
- ❌ "Immutable real-time ledger of all warehouse operations and stock movements" → ✅ "View all stock movements and updates"

---

## FORM LABELS

### Item Form
| Old | New |
|-----|-----|
| Item Name | Item Name ✓ |
| "e.g. Industrial Servo Motor XL-500" | "e.g. Motor, Bolt, Wire" |
| SKU / Part Number | SKU |
| Unit of Measure | Unit |
| Alert Threshold | Low Stock Level |
| minStockLevel | Low Stock Level |
| isCritical | Mark as Critical |

### Customer Form
| Old | New |
|-----|-----|
| Account Name | Customer Name |
| "e.g. Acme Corp Industries" | "e.g. John Smith" |
| Email Address | Email |
| Direct Contact | Phone Number |
| Physical Address | Address |
| "HQ address or primary..." | "Street address" |

### Vendor Form
| Old | New |
|-----|-----|
| Preferred Payment Mode | Payment Method |

---

## STATUS LABELS

### Purchase Orders
| Old | New | Meaning |
|-----|-----|---------|
| Draft/Pending | Pending | Not sent yet |
| Expected Goods | On Order | Coming soon |
| RECEIVED/DELIVERED | Received | Arrived |
| PURCHASED | Ordered | Was ordered |

### Dispatch Orders
| Old | New | Meaning |
|-----|-----|---------|
| PENDING PICKING | Ready to Ship | Waiting to pack |
| COMPLETED | Shipped | Already sent |
| pending | Ready to Ship | Waiting |
| dispatched | Shipped | Sent |

### Inventory
| Old | New |
|-----|-----|
| All Stock | All Items |
| In Stock | In Stock ✓ |
| Low Stock | Low Stock ✓ |
| Out of Stock | Out of Stock ✓ |
| Ordered | On Order |

### Transactions
| Old | New |
|-----|-----|
| PURCHASE | Received from Vendor |
| SALE | Sold to Customer |
| ADJUSTMENT_IN | Added |
| ADJUSTMENT_OUT | Removed |

---

## ERROR MESSAGES

| Old | New |
|-----|-----|
| "Failed to fetch necessary data." | "Could not load. Please try again." |
| "An unexpected error occurred." | "Something went wrong. Please try again." |
| "Failed to update item" | "Could not save changes" |
| "Failed to create item" | "Could not add item" |
| "Failed to delete item" | "Could not delete item" |
| "Failed to create customer." | "Could not add customer" |
| "Customer name is required." | "Please enter customer name" |

---

## TABLE HEADERS

### Inventory
| Old | New |
|-----|-----|
| Order Identity | Order # |
| Recipient | Customer |
| Line Items | Items |
| Payment Mode | Payment |
| Fulfillment Status | Status |
| Timestamp | Date |

### Transactions
| Old | New |
|-----|-----|
| Operation Type | Type |
| Asset Details | Item |
| Volume | Quantity |
| Location | Location ✓ |
| Entity / Authority | From/To |
| Timestamp | Date |

---

## BUTTONS & ACTIONS

| Old | New | Use Case |
|-----|-----|----------|
| Create Purchase Order | New Order | Purchase Orders page |
| Create New Dispatch | New Order | Dispatch Orders page |
| Add Account | Add Customer | Customers |
| Authorize Account Creation | Save Customer | Customers modal |
| Update Specifications | Save Changes | Edit item page |
| Discard Changes | Cancel | Forms |
| Optimizing... | Saving... | Loading |
| Validating & Saving... | Saving... | Loading |

---

## LOADING MESSAGES

| Old | New |
|-----|-----|
| "Retrieving Item Specification..." | "Loading..." |
| "Reconstructing procurement ledger..." | "Loading stock details..." |
| "Optimizing..." | "Saving..." |
| "Validating & Saving..." | "Saving..." |

---

## SECTION TITLES & HEADERS

| Old | New |
|-----|-----|
| Customers Directory | Customers |
| Vendor Directory | Vendors |
| Core Details | Item Details |
| Stock Audit / Origin Trail | Stock Details |
| Global Operations Log | All Transactions |
| Contribution trail filtered for existing inventory | Where this stock came from |

---

## HELPER TEXT & DESCRIPTIONS

| Old | New |
|-----|-----|
| "Register a new client or corporate account." | "Add a new customer" |
| "Units on Hand (+{count} incoming)" | "Available (+{count} coming)" |
| "In-Transit" | "In Transit" |
| "Internal Ledger Update" | "System Update" |
| "No Contact" | "No Phone" |

---

## SIDEBAR MENU (Navigation)

| Old | New | Reason |
|-----|-----|--------|
| Rack Management | Stock Locations | More understandable |
| Purchase Orders | Orders from Vendors | Clearer |
| Customer Dispatch | Orders to Customers | Clearer |
| Vendors & Pricing | Vendors & Prices | Simpler |
| Transactions | History | More direct |

---

## IMPORTANT: CONSISTENCY RULES

### Always Use These Words

**For Items:**
- Use: Item, Items
- Don't use: Inventory Entity, SKU, Product, Specification

**For Customers:**
- Use: Customer
- Don't use: Account, Entity, Client

**For Vendors:**
- Use: Vendor
- Don't use: Supplier, Partner

**For Stock Level:**
- Use: Low Stock Level, Minimum Stock
- Don't use: Alert Threshold, minStockLevel, Parameters

**For Status:**
- Use: Status
- Don't use: Fulfillment Status, Operation Type

**For Actions:**
- Use: Add, Edit, Delete, View, Save, Cancel
- Don't use: Create, Onboard, Authorize, Discard, Persist, Commit

**For Location:**
- Use: Location, Zone
- Don't use: Rack, Storage Area, Warehouse Area

**For Incoming Items:**
- Use: On Order, Coming, Expected
- Don't use: Inbound, Expected Goods, In-Transit Supply

**For Sent Items:**
- Use: Shipped, Sent
- Don't use: Dispatched, Outbound, Customer Fulfillment

---

## CAPITALIZATION RULES

```
FORM LABELS:        Title Case
                    "Item Name", "Customer Name", "Stock Level"

BUTTONS:            Title Case
                    "Add Item", "Save Changes", "Delete"

PAGE TITLES:        Title Case
                    "Inventory", "Purchase Orders", "Customers"

SECTION TITLES:     Title Case
                    "Item Details", "Customer Information"

TABLE HEADERS:      Title Case
                    "Order #", "Customer", "Date"

STATUS BADGES:      Title Case
                    "In Stock", "Low Stock", "Out of Stock"

DESCRIPTIONS:       Sentence case (first letter capital)
                    "View and manage all inventory items."

ERROR MESSAGES:     Sentence case (first letter capital)
                    "Please enter a valid item name."

FILTER OPTIONS:     Title Case
                    "All Items", "In Stock", "Low Stock"
```

---

## FILES NEEDING UPDATES

### High Priority (Users see this most)
- [ ] src/app/(dashboard)/inventory/page.tsx - Page title, filters, table headers
- [ ] src/app/(dashboard)/inventory/new/page.tsx - Form labels, button text
- [ ] src/app/(dashboard)/inventory/[id]/edit/page.tsx - Form labels, button text
- [ ] src/app/(dashboard)/orders/purchase/page.tsx - Page title, button, statuses
- [ ] src/app/(dashboard)/orders/dispatch/page.tsx - Page title, button, statuses
- [ ] src/app/(dashboard)/customers/page.tsx - Page title, button text
- [ ] src/app/(dashboard)/customers/CustomerModal.tsx - All text in modal
- [ ] src/app/(dashboard)/vendors/page.tsx - Page title, descriptions
- [ ] src/app/(dashboard)/transactions/page.tsx - Page title, table headers

### Medium Priority
- [ ] src/components/Sidebar.tsx - Navigation labels
- [ ] src/app/(dashboard)/inventory/InventoryFilters.tsx - Filter labels
- [ ] src/app/(dashboard)/inventory/InventoryTableActions.tsx - Action buttons
- [ ] src/app/(dashboard)/inventory/ItemBreakdownModal.tsx - Modal text

### Low Priority
- [ ] Dashboard page - Stats descriptions
- [ ] Login page - System name/subtitle

---

## IMPLEMENTATION CHECKLIST

- [ ] **Phase 1: Button Text** - Standardize all buttons
- [ ] **Phase 2: Error Messages** - Make all errors clear
- [ ] **Phase 3: Status Labels** - Use consistent status names
- [ ] **Phase 4: Form Labels** - Simplify all form fields
- [ ] **Phase 5: Page Titles** - Simplify page headings
- [ ] **Phase 6: Table Headers** - Shorten and clarify headers
- [ ] **Phase 7: Navigation** - Update sidebar menu items
- [ ] **Phase 8: Descriptions** - Simplify all helper text
- [ ] **Phase 9: Testing** - Test with non-technical users
- [ ] **Phase 10: Documentation** - Update any user guides

---

## NEED HELP?

**Question: When should I use what word?**
See the "CONSISTENCY RULES" section above.

**Question: How should text be formatted?**
See "CAPITALIZATION RULES" above.

**Question: What if I'm unsure about a label?**
Think: "Would my grandmother understand this word?"
If no, make it simpler.

**Question: Am I using technical jargon?**
Look for these words and avoid them:
- Procurement, Logistics, Pipeline
- Inbound, Outbound, Fulfillment
- Entity, Ledger, Registry, Audit
- Parameters, Specifications
- Authorize, Persist, Commit, Discard

Replace with simple action words:
- Add, Delete, Edit, View, Save, Cancel

