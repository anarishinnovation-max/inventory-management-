"use client";

import { History } from "lucide-react";

interface ExportButtonProps {
  data: any[];
}

export function ExportButton({ data }: ExportButtonProps) {
  const handleExport = () => {
    if (!data || data.length === 0) return;

    // CSV Header
    const headers = ["Type", "Item", "SKU", "Quantity", "Rack", "Entity", "Date", "Time"];
    
    // CSV Rows
    const rows = data.map(tx => [
      tx.type,
      tx.item.name,
      tx.item.sku,
      tx.quantity,
      tx.rack?.rackName || "In-Transit",
      tx.customer?.name || tx.vendor?.name || "Internal",
      new Date(tx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      new Date(tx.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `inventory_audit_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button 
      onClick={handleExport}
      className="flex items-center gap-2 px-6 py-3 bg-surface-lowest text-foreground text-sm font-bold rounded-2xl shadow-ambient border border-border-ghost hover:bg-surface-low transition-all "
    >
      <History className="w-5 h-5 text-primary" />
      Export Audit Trail
    </button>
  );
}

