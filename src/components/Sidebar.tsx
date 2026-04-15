"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  SquareStack, 
  ShoppingCart, 
  Users, 
  Truck, 
  History, 
  BarChart3, 
  Settings,
  LogOut,
  ChevronRight
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/" },
  { name: "Inventory", icon: Package, href: "/inventory" },
  { name: "Rack Management", icon: SquareStack, href: "/racks" },
  { name: "Purchase Orders", icon: ShoppingCart, href: "/orders/purchase" },
  { name: "Customer Dispatch", icon: Truck, href: "/orders/dispatch" },
  { name: "Customers", icon: Users, href: "/customers" },
  { name: "Vendors & Pricing", icon: BarChart3, href: "/vendors" },
  { name: "Transactions", icon: History, href: "/transactions" },
  { name: "Settings", icon: Settings, href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 h-screen bg-surface-low flex flex-col border-r border-border-ghost">
      <div className="p-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl primary-gradient flex items-center justify-center shadow-ambient">
          <Package className="text-white w-6 h-6" />
        </div>
        <span className="font-bold text-xl tracking-tight text-foreground">Logistix</span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto no-scrollbar">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200",
                isActive 
                  ? "bg-surface-lowest shadow-ambient text-primary" 
                  : "text-muted-foreground hover:bg-surface-lowest/50 hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              <span className="font-medium flex-1">{item.name}</span>
              {isActive && <ChevronRight className="w-4 h-4" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <button
          onClick={() => {
             // Handle logout
             window.location.href = "/login";
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-muted-foreground hover:bg-error/10 hover:text-error transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
