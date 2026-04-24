"use client";

import { clsx, type ClassValue } from "clsx";
import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  History,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  SquareStack,
  Truck,
  Users
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import { handleLogout } from "@/lib/user-actions";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MenuItem {
  name: string;
  icon: any;
  href: string;
  badge?: string;
  roles?: string[];
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    title: "Main",
    items: [
      { name: "Home", icon: LayoutDashboard, href: "/" },
      { name: "Inventory", icon: Package, href: "/inventory" },
      { name: "Rack List", icon: SquareStack, href: "/racks" },
    ]
  },
  {
    title: "Orders",
    items: [
      { name: "Purchase Bills", icon: ShoppingCart, href: "/orders/purchase" },
      { name: "Supply Inwards", icon: Truck, href: "/orders/supply-inwards" },
      { name: "Sell Bills", icon: Truck, href: "/orders/dispatch" },
    ]
  },
  {
    title: "People",
    items: [
      { name: "Customers", icon: Users, href: "/customers" },
      { name: "Vendors", icon: BarChart3, href: "/vendors" },
    ]
  },
  {
    title: "More",
    items: [
      { name: "Activity Log", icon: History, href: "/transactions", roles: ["OWNER", "MANAGER"] },
      { name: "Settings", icon: Settings, href: "/settings", roles: ["OWNER", "MANAGER"] },
    ]
  }
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [userData, setUserData] = useState<{ name: string; role: string; companyName: string } | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUserData(data);
        }
      } catch (err) {
        console.error("Failed to fetch user data", err);
      }
    }
    fetchUser();
  }, []);

  return (
    <aside className={cn(
      "h-screen bg-white flex flex-col border-r border-border-ghost transition-all duration-300 relative z-50",
      collapsed ? "w-20" : "w-72"
    )}>
      {/* Brand Logo */}
      <div className="p-6 flex items-center gap-3 overflow-hidden whitespace-nowrap">
        <div className="min-w-[40px] h-10 rounded-xl primary-gradient flex items-center justify-center shadow-glow">
          <Package className="text-white w-5 h-5" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-black text-lg tracking-tighter text-foreground leading-none">
              {userData?.companyName || "SS Cutting Tools"}
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mt-1">Enterprise</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-8 overflow-y-auto no-scrollbar scroll-smooth">
        {menuSections.map((section, idx) => {
          const visibleItems = section.items.filter(item => 
            !item.roles || (userData?.role && item.roles.includes(userData.role.toUpperCase()))
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} className="space-y-1">
              {!collapsed && (
                <h3 className="px-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] mb-3">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 relative",
                        isActive
                          ? "bg-primary/5 text-primary shadow-sm"
                          : "text-muted-foreground hover:bg-surface-low hover:text-foreground"
                      )}
                    >
                      <item.icon className={cn(
                        "w-5 h-5 transition-colors shrink-0",
                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                      )} />

                      {!collapsed && (
                        <>
                          <span className={cn("font-bold text-sm flex-1", isActive ? "text-foreground" : "")}>
                            {item.name}
                          </span>
                          {item.badge && (
                            <span className="px-1.5 py-0.5 rounded-md bg-success/10 text-success text-[8px] font-black uppercase tracking-wider border border-success/20">
                              {item.badge}
                            </span>
                          )}
                          {isActive && <ChevronRight className="w-4 h-4 text-primary" />}
                        </>
                      )}

                      {/* Tooltip for collapsed mode */}
                      {collapsed && (
                        <div className="absolute left-full ml-4 px-3 py-1.5 bg-foreground text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-[60]">
                          {item.name}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer / Toggle */}
      <div className="p-4 border-t border-border-ghost bg-surface-low/30 space-y-2">
        {!collapsed && (
          <div className="px-4 py-3 bg-white rounded-2xl border border-border-ghost shadow-sm flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-surface-low border border-border-ghost flex items-center justify-center text-xs font-bold text-foreground uppercase">
              {userData?.name?.charAt(0) || "U"}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold truncate">{userData?.name || "User"}</span>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{userData?.role || "Admin"}</span>
            </div>
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full h-10 flex items-center justify-center gap-2 rounded-xl text-muted-foreground hover:bg-white hover:text-foreground transition-all hover:shadow-sm"
          suppressHydrationWarning
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4 rotate-90" />}
          {!collapsed && <span className="text-xs font-bold">Collapse Sidebar</span>}
        </button>

        <button
          onClick={async () => { await handleLogout(); }}
          suppressHydrationWarning
          className={cn(
            "w-full h-10 flex items-center justify-center gap-2 rounded-xl text-muted-foreground hover:bg-error/10 hover:text-error transition-all",
            collapsed ? "" : "px-4"
          )}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span className="text-xs font-bold flex-1 text-left">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
