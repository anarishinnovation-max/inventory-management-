"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { SHORTCUT_CONFIG, ShortcutItem } from "@/config/shortcuts";
import CommandPalette from "./CommandPalette";
import ShortcutsHelpModal from "./ShortcutsHelpModal";

interface ShortcutsContextType {
  isPaletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
  isHelpOpen: boolean;
  setHelpOpen: (open: boolean) => void;
}

const ShortcutsContext = createContext<ShortcutsContextType | undefined>(undefined);

export function useShortcuts() {
  const context = useContext(ShortcutsContext);
  if (!context) {
    throw new Error("useShortcuts must be used within a ShortcutsProvider");
  }
  return context;
}

export default function ShortcutsProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isPaletteOpen, setPaletteOpen] = useState(false);
  const [isHelpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        // Only allow Escape to blur or close palettes
        if (e.key === "Escape") {
          setPaletteOpen(false);
          setHelpOpen(false);
        }
        return;
      }

      const isAlt = e.altKey;
      const isCtrl = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // Help Modal (?)
      if (e.key === "?" && !isAlt && !isCtrl) {
        setHelpOpen(true);
        return;
      }

      // Command Palette (Ctrl+K)
      if (isCtrl && key === "k") {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
        return;
      }

      // Configured Shortcuts
      SHORTCUT_CONFIG.forEach((item) => {
        const keys = item.keys;
        const needsAlt = keys.includes("alt");
        const needsCtrl = keys.includes("ctrl") || keys.includes("meta");
        const targetKey = keys.find(k => k !== "alt" && k !== "ctrl" && k !== "meta");

        if (
          (needsAlt === isAlt) &&
          (needsCtrl === isCtrl) &&
          key === targetKey
        ) {
          e.preventDefault();
          if (item.href) {
            router.push(item.href);
          } else if (item.action) {
            item.action();
          }
          
          // Close modals if navigation happens
          setPaletteOpen(false);
          setHelpOpen(false);
        }
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return (
    <ShortcutsContext.Provider value={{ isPaletteOpen, setPaletteOpen, isHelpOpen, setHelpOpen }}>
      {children}
      <CommandPalette />
      <ShortcutsHelpModal />
    </ShortcutsContext.Provider>
  );
}
