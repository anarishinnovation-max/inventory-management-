"use client";

import { Info } from "lucide-react";
import { useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InfoTooltipProps {
  content: React.ReactNode;
  className?: string;
  iconClassName?: string;
  position?: "top" | "bottom" | "left" | "right";
}

export function InfoTooltip({ content, className, iconClassName, position = "top" }: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-3",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-3",
    left: "right-full top-1/2 -translate-y-1/2 mr-3",
    right: "left-full top-1/2 -translate-y-1/2 ml-3",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-white",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-white",
    left: "left-full top-1/2 -translate-y-1/2 border-l-white",
    right: "right-full top-1/2 -translate-y-1/2 border-r-white",
  };

  return (
    <div 
      className={cn("relative inline-flex items-center", className)}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      <Info 
        className={cn(
          "w-4 h-4 cursor-help transition-colors", 
          isVisible ? "text-primary" : "text-muted-foreground/60 hover:text-primary",
          iconClassName
        )} 
      />
      
      {isVisible && (
        <div 
          className={cn(
            "absolute z-50 w-64 p-4 rounded-2xl bg-white shadow-2xl border border-border-ghost animate-in fade-in zoom-in duration-200",
            positionClasses[position]
          )}
        >
          <div className="text-xs font-medium text-foreground leading-relaxed">
            {content}
          </div>
          
          {/* Subtle Arrow */}
          <div 
            className={cn(
              "absolute w-0 h-0 border-8 border-transparent",
              arrowClasses[position]
            )}
          />
        </div>
      )}
    </div>
  );
}
