"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SearchableSelectProps {
  items: any[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  renderItem?: (item: any) => React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  label?: string;
}

export function SearchableSelect({
  items,
  value,
  onChange,
  placeholder = "Select from List",
  renderItem,
  className,
  icon,
  label
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedItem = items.find(i => {
    const itemId = typeof i === 'string' ? i : i.id;
    return itemId === value;
  });

  const filteredItems = items.filter(i => {
    const searchStr = search.toLowerCase();
    if (typeof i === 'string') return i.toLowerCase().includes(searchStr);
    return (
      (i.name?.toLowerCase().includes(searchStr)) ||
      (i.sku?.toLowerCase().includes(searchStr)) ||
      (i.label?.toLowerCase().includes(searchStr))
    );
  });

  const getDisplayValue = () => {
    if (!selectedItem) return placeholder;
    if (typeof selectedItem === 'string') return selectedItem;
    // Show quantity in the button if available, replacing the SKU format
    if (selectedItem.quantity !== undefined && selectedItem.name) {
      return `${selectedItem.name} (${selectedItem.quantity} ${selectedItem.unit || ''})`;
    }
    return selectedItem.name || selectedItem.label || selectedItem.id;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("relative w-full", className, isOpen && "z-50")} ref={containerRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "input-field flex items-center justify-between gap-3 text-sm transition-all duration-300 cursor-pointer",
          isOpen && "border-primary/60 ring-4 ring-primary/10 shadow-glow bg-surface-lowest",
        )}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {icon && <div className="shrink-0">{icon}</div>}
          <div className="flex items-center gap-1.5 min-w-0">
            {label && (
              <span className="text-xs font-black text-muted-foreground uppercase tracking-widest shrink-0 opacity-60">
                {label}
              </span>
            )}
            <span className={cn("truncate font-black text-xs uppercase tracking-widest text-foreground")}>
              {getDisplayValue()}
            </span>
          </div>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground shrink-0 transition-colors duration-300", isOpen && "text-primary")} />
      </div>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-2 bg-surface-lowest border border-border-ghost rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-4 border-b border-border-ghost bg-surface-low/30">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                autoFocus
                placeholder="Type to search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field h-12 pl-11 pr-4 text-sm"
              />
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto p-2 no-scrollbar">
            {filteredItems.length > 0 ? (
              filteredItems.map((item, idx) => {
                const itemId = typeof item === 'string' ? item : item.id;
                const isSelected = itemId === value;

                return (
                  <div
                    key={itemId || idx}
                    onClick={() => {
                      onChange(itemId);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={cn(
                      "flex items-center justify-between px-4 py-3.5 rounded-xl cursor-pointer transition-all",
                      isSelected 
                        ? "bg-primary/10 text-primary" 
                        : "text-foreground hover:bg-surface-low"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      {renderItem ? renderItem(item) : (
                        typeof item === 'string' ? (
                          <p className="text-xs font-black uppercase tracking-widest truncate">{item}</p>
                        ) : (
                          <div className="flex flex-col">
                            <p className="text-xs font-black uppercase tracking-widest truncate">{item.name || item.label}</p>
                            {item.quantity !== undefined && (
                              <p className="text-xs font-bold text-muted-foreground uppercase mt-0.5">
                                Stock: {item.quantity} {item.unit || ''}
                              </p>
                            )}
                          </div>
                        )
                      )}
                    </div>
                    {isSelected && <Check className="w-4 h-4 shrink-0" />}
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No items found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

