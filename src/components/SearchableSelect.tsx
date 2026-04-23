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
}

export function SearchableSelect({
  items,
  value,
  onChange,
  placeholder = "Select from List",
  renderItem,
  className
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
    if (selectedItem.sku && selectedItem.name) return `${selectedItem.sku} - ${selectedItem.name}`;
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
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-surface-lowest border border-border-ghost rounded-2xl px-5 py-4 font-black text-[15px] focus:ring-2 focus:ring-primary outline-none cursor-pointer flex items-center justify-between transition-all hover:bg-surface-lowest hover:border-primary/20 shadow-sm"
      >
        <span className={cn("truncate mr-2", !selectedItem && "text-muted-foreground")}>
          {getDisplayValue()}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-300", isOpen && "rotate-180")} />
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
                className="w-full bg-surface-lowest border border-border-ghost rounded-xl pl-10 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary outline-none"
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
                      "flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer transition-all mb-1 last:mb-0",
                      isSelected ? "bg-primary text-white shadow-lg shadow-primary/20" : "hover:bg-surface-low text-foreground"
                    )}
                  >
                    <div className="flex flex-col min-w-0">
                      {renderItem ? renderItem(item) : (
                        <>
                          {typeof item === 'string' ? (
                            <span className="text-sm font-bold truncate">{item}</span>
                          ) : (
                            <>
                              {item.sku && <span className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-0.5 truncate">{item.sku}</span>}
                              <span className="text-sm font-bold truncate">{item.name || item.label}</span>
                            </>
                          )}
                        </>
                      )}
                    </div>
                    {isSelected && <Check className="w-4 h-4 shrink-0 ml-2" />}
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-surface-low rounded-2xl flex items-center justify-center text-muted-foreground mx-auto mb-3 opacity-30">
                  <Search className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-muted-foreground">No matches found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
