"use client";

import { useConfirmStore } from "@/hooks/use-confirm";
import { AlertTriangle, X } from "lucide-react";
import { useEffect, useState } from "react";

export default function ConfirmDialog() {
  const { isOpen, title, message, onConfirm, onCancel } = useConfirmStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-lowest w-full max-w-md rounded-[2.5rem] shadow-2xl border border-border-ghost overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-warning/10 rounded-2xl text-warning">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-surface-low rounded-xl text-muted-foreground hover:text-foreground transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-xl font-black text-foreground mb-2">{title}</h2>
          <p className="text-sm font-bold text-muted-foreground leading-relaxed">
            {message}
          </p>
        </div>

        <div className="p-8 pt-0 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3.5 bg-surface-low hover:bg-border-ghost text-foreground text-xs font-black rounded-2xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-3.5 bg-primary text-white text-xs font-black rounded-2xl shadow-xl shadow-primary/20   transition-all"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
