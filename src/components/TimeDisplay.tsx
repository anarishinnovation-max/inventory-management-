"use client";

import { useState, useEffect } from "react";

export function TimeDisplay({ date, format = "time" }: { date: string | Date, format?: "time" | "full" | "distance" }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span className="opacity-0">...</span>;
  }

  const d = new Date(date);
  
  if (format === "full") {
    return <>{d.toLocaleString()}</>;
  }
  
  return <>{d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>;
}
