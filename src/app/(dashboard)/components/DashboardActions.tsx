"use client";

import { FileDown, PlusSquare, Settings2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function DashboardActions() {
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUserRole(data.role);
        }
      } catch (err) {
        console.error("Failed to fetch user data", err);
      }
    }
    fetchUser();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const isEmployee = userRole === "EMPLOYEE";

  return (
    <div className="flex items-center gap-3">
      <Link href="/reports">
        <button 
          className="btn-secondary" 
          suppressHydrationWarning
        >
          <FileDown className="w-4 h-4 text-primary" />
          <span>Get Report</span>
        </button>
      </Link>
      <Link href={isEmployee ? "/inventory" : "/inventory/new"}>
        <button className="btn-primary shadow-glow" suppressHydrationWarning>
          {isEmployee ? <Settings2 className="w-4 h-4" /> : <PlusSquare className="w-4 h-4" />}
          <span>{isEmployee ? "Manage Inventory" : "Add Inventory"}</span>
        </button>
      </Link>
    </div>
  );
}
