"use client";

import { Download, Calendar, Loader2 } from "lucide-react";
import { useState } from "react";

export function ReportActions() {
   const [exporting, setExporting] = useState(false);

   const handleExport = async () => {
      setExporting(true);
      try {
         window.location.href = "/api/reports/inventory";
      } finally {
         setTimeout(() => setExporting(false), 2000);
      }
   };

   return (
      <div className="flex gap-3">
         <button className="btn-secondary">
            <Calendar className="w-4 h-4 text-primary" />
            Dynamic Range
         </button>
         <button 
            onClick={handleExport}
            disabled={exporting}
            className="btn-primary shadow-glow disabled:opacity-50"
         >
            {exporting ? (
               <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
               <Download className="w-4 h-4" />
            )}
            {exporting ? "Preparing..." : "Export Dossier"}
         </button>
      </div>
   );
}
