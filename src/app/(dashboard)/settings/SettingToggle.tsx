"use client";

import { useTransition } from "react";
import { updateUserSettings } from "@/lib/user-actions";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SettingToggleProps {
  label: string;
  initialValue: boolean;
  type: "emailAlerts" | "twoFactorEnabled";
}

export function SettingToggle({ initialValue, type }: SettingToggleProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      await updateUserSettings({ [type]: !initialValue });
    });
  };

  return (
    <div 
      onClick={handleToggle}
      className={cn(
        "w-12 h-6 rounded-full p-1 transition-all relative cursor-pointer",
        initialValue ? "bg-primary" : "bg-surface-low",
        isPending && "opacity-50 cursor-wait"
      )}
    >
      <div className={cn(
        "w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200",
        initialValue ? "translate-x-6" : "translate-x-0"
      )} />
    </div>
  );
}
