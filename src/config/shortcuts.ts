import { 
  LayoutGrid, 
  Box, 
  Database, 
  ReceiptIndianRupee, 
  Inbox, 
  IndianRupee, 
  Truck, 
  Users, 
  Store, 
  History, 
  ShieldCheck, 
  Settings,
  Plus,
  FileText,
  Search,
  HelpCircle,
  Tags
} from "lucide-react";

export interface ShortcutItem {
  id: string;
  name: string;
  keys: string[]; // e.g. ["alt", "d"] or ["ctrl", "k"]
  action?: () => void;
  href?: string;
  icon: any;
  category: "Navigation" | "Actions" | "System";
  description: string;
}

export const SHORTCUT_CONFIG: ShortcutItem[] = [
  // Navigation
  {
    id: "nav-home",
    name: "Go to Home",
    keys: ["alt", "h"],
    href: "/",
    icon: LayoutGrid,
    category: "Navigation",
    description: "Navigate to Dashboard"
  },
  {
    id: "nav-inventory",
    name: "Go to Inventory",
    keys: ["alt", "i"],
    href: "/inventory",
    icon: Box,
    category: "Navigation",
    description: "View Stock & Items"
  },
  {
    id: "nav-racks",
    name: "Go to Rack List",
    keys: ["alt", "r"],
    href: "/racks",
    icon: Database,
    category: "Navigation",
    description: "Manage Storage Locations"
  },
  {
    id: "nav-categories",
    name: "Go to Categories",
    keys: ["alt", "t"],
    href: "/categories",
    icon: Tags,
    category: "Navigation",
    description: "Manage Product Categories"
  },
  {
    id: "nav-purchase",
    name: "Go to Purchase Bills",
    keys: ["alt", "p"],
    href: "/orders/purchase",
    icon: ReceiptIndianRupee,
    category: "Navigation",
    description: "Manage Inward Billing"
  },
  {
    id: "nav-inwards",
    name: "Go to Supply Inwards",
    keys: ["alt", "j"],
    href: "/orders/supply-inwards",
    icon: Inbox,
    category: "Navigation",
    description: "Track Incoming Items"
  },
  {
    id: "nav-dispatch",
    name: "Go to Sell Bills",
    keys: ["alt", "s"],
    href: "/orders/dispatch",
    icon: IndianRupee,
    category: "Navigation",
    description: "Manage Outward Billing"
  },
  {
    id: "nav-outwards",
    name: "Go to Supply Outwards",
    keys: ["alt", "o"],
    href: "/orders/supply-outwards",
    icon: Truck,
    category: "Navigation",
    description: "Track Outgoing Items"
  },
  {
    id: "nav-customers",
    name: "Go to Customers",
    keys: ["alt", "c"],
    href: "/customers",
    icon: Users,
    category: "Navigation",
    description: "Manage Client List"
  },
  {
    id: "nav-vendors",
    name: "Go to Vendors",
    keys: ["alt", "v"],
    href: "/vendors",
    icon: Store,
    category: "Navigation",
    description: "Manage Supplier List"
  },
  {
    id: "nav-activity",
    name: "Go to Activity Log",
    keys: ["alt", "l"],
    href: "/transactions",
    icon: History,
    category: "Navigation",
    description: "View Audit History"
  },
  {
    id: "nav-admin",
    name: "Go to Admin Control",
    keys: ["alt", "a"],
    href: "/admin",
    icon: ShieldCheck,
    category: "Navigation",
    description: "System Administration"
  },
  {
    id: "nav-settings",
    name: "Go to Settings",
    keys: ["alt", ","],
    href: "/settings",
    icon: Settings,
    category: "Navigation",
    description: "Application Settings"
  },

  // Actions
  {
    id: "action-new-item",
    name: "Register New Item",
    keys: ["alt", "n"],
    href: "/inventory?action=new",
    icon: Plus,
    category: "Actions",
    description: "Add a new product to inventory"
  },
  {
    id: "action-create-bill",
    name: "Create Purchase Bill",
    keys: ["alt", "b"],
    href: "/orders/purchase?action=new",
    icon: FileText,
    category: "Actions",
    description: "Create a new inward purchase bill"
  },

  // System
  {
    id: "sys-command-palette",
    name: "Command Palette",
    keys: ["meta", "k"], // meta is Cmd on Mac, Ctrl on Win in many libs, but we'll handle manually
    icon: Search,
    category: "System",
    description: "Search anything across the system"
  },
  {
    id: "sys-help",
    name: "Keyboard Shortcuts Help",
    keys: ["?"],
    icon: HelpCircle,
    category: "System",
    description: "Display all available shortcuts"
  }
];
