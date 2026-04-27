"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DateTimePickerProps {
  value: string; 
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  minDate?: Date;
}

export function PremiumDateTimePicker({
  value,
  onChange,
  placeholder = "Select Date & Time",
  className,
  minDate
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const dateValue = value ? new Date(value) : null;
  const [viewDate, setViewDate] = useState(dateValue || new Date());
  
  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handleDateSelect = (day: number) => {
    const newDate = new Date(viewDate);
    newDate.setDate(day);
    if (dateValue) {
      newDate.setHours(dateValue.getHours());
      newDate.setMinutes(dateValue.getMinutes());
    }
    onChange(newDate.toISOString());
  };

  const handleTimeChange = (type: 'hours' | 'minutes', val: number) => {
    const newDate = dateValue ? new Date(dateValue) : new Date();
    if (type === 'hours') newDate.setHours(val);
    else newDate.setMinutes(val);
    onChange(newDate.toISOString());
  };

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const days = daysInMonth(year, month);
    const firstDay = firstDayOfMonth(year, month);
    const monthName = viewDate.toLocaleString('default', { month: 'long' });

    const calendarDays = [];
    for (let i = 0; i < firstDay; i++) calendarDays.push(<div key={`empty-${i}`} />);
    for (let d = 1; d <= days; d++) {
      const isSelected = dateValue?.getDate() === d && dateValue?.getMonth() === month && dateValue?.getFullYear() === year;
      const isToday = new Date().getDate() === d && new Date().getMonth() === month && new Date().getFullYear() === year;
      
      const currentDayDate = new Date(year, month, d);
      const isDisabled = minDate ? currentDayDate < new Date(minDate.setHours(0,0,0,0)) : false;

      calendarDays.push(
        <button
          key={d}
          type="button"
          disabled={isDisabled}
          onClick={() => handleDateSelect(d)}
          className={cn(
            "w-9 h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center relative",
            isSelected ? "bg-primary text-white shadow-lg shadow-primary/30" : "hover:bg-surface-low text-foreground",
            isToday && !isSelected && "text-primary border border-primary/20",
            isDisabled && "opacity-20 cursor-not-allowed grayscale"
          )}
        >
          {d}
          {isToday && <div className="absolute bottom-1.5 w-1 h-1 bg-primary rounded-full" />}
        </button>
      );
    }

    return (
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-black text-sm uppercase tracking-widest text-foreground">{monthName} {year}</h4>
          <div className="flex gap-1">
            <button 
              type="button"
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="p-2 rounded-lg hover:bg-surface-low text-muted-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              type="button"
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="p-2 rounded-lg hover:bg-surface-low text-muted-foreground transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="text-[10px] font-black text-muted-foreground uppercase py-2">{day}</div>
          ))}
          {calendarDays}
        </div>
      </div>
    );
  };

  const renderTimePicker = () => {
    const hours = dateValue ? dateValue.getHours() : 12;
    const minutes = dateValue ? dateValue.getMinutes() : 0;

    return (
      <div className="p-5 bg-surface-low/30 border-t border-border-ghost flex items-center justify-center gap-6">
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 text-primary" />
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              min="0" max="23" 
              value={hours.toString().padStart(2, '0')}
              onChange={(e) => handleTimeChange('hours', parseInt(e.target.value))}
              className="w-12 py-2 bg-surface-lowest border border-border-ghost rounded-xl text-center font-mono font-black text-sm focus:ring-2 focus:ring-primary outline-none"
            />
            <span className="font-black text-muted-foreground">:</span>
            <input 
              type="number" 
              min="0" max="59" 
              value={minutes.toString().padStart(2, '0')}
              onChange={(e) => handleTimeChange('minutes', parseInt(e.target.value))}
              className="w-12 py-2 bg-surface-lowest border border-border-ghost rounded-xl text-center font-mono font-black text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
        </div>
        <button 
          type="button"
          onClick={() => setIsOpen(false)}
          className="px-4 py-2 bg-foreground text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all"
        >
          Set
        </button>
      </div>
    );
  };

  return (
    <div className={cn("relative w-full", className, isOpen && "z-50")} ref={containerRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-surface-lowest border border-border-ghost rounded-2xl px-5 py-4 font-black text-[15px] focus:ring-2 focus:ring-primary outline-none cursor-pointer flex items-center justify-between transition-all hover:bg-surface-lowest hover:border-primary/20 shadow-sm group"
      >
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className={cn("truncate", !dateValue && "text-muted-foreground")}>
            {dateValue ? dateValue.toLocaleString('en-IN', { 
              day: '2-digit', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit', hour12: true 
            }) : placeholder}
          </span>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-[100] w-[320px] mt-2 bg-surface-lowest border border-border-ghost rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {renderCalendar()}
          {renderTimePicker()}
        </div>
      )}
    </div>
  );
}
