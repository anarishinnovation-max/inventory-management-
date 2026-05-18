"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  MoreVertical, 
  Eye, 
  Edit3, 
  Trash2, 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Loader2 
} from "lucide-react";
import { showToast } from "@/lib/toast";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CustomerActionsProps {
  customer: {
    id: string;
    name: string;
    email: string | null;
    contact: string | null;
    address: string | null;
  };
  sessionRole: string;
}

export default function CustomerActions({ customer, sessionRole }: CustomerActionsProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      contact: formData.get("contact") as string,
      address: formData.get("address") as string,
    };

    if (!data.name) {
      setError("Customer name is required.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/customers/${customer.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (res.ok) {
          showToast(`Customer "${data.name}" updated successfully`, "success");
          setIsEditOpen(false);
          router.refresh();
        } else {
          const resData = await res.json();
          setError(resData.error || "Failed to update customer.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to save updates.");
      }
    });
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(`Are you sure you want to delete customer "${customer.name}"?`);
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showToast(`Customer "${customer.name}" deleted successfully`, "success");
        setIsOpen(false);
        router.refresh();
      } else {
        const resData = await res.json();
        showToast(resData.error || "Failed to delete customer", "error");
      }
    } catch (err: any) {
      showToast("Network error. Please try again.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef} id={`menu-${customer.id}`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="w-9 h-9 inline-flex items-center justify-center rounded-xl text-muted-foreground hover:bg-primary/5 hover:text-primary transition-all border border-border-ghost"
        title="Actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 z-40 w-48 bg-white border border-border-ghost shadow-ambient rounded-2xl py-2 overflow-hidden text-left animate-in fade-in slide-in-from-top-2 duration-200">
          <Link
            href={`/customers/${customer.id}`}
            onClick={() => setIsOpen(false)}
            className="w-full px-5 py-3 text-left text-sm font-bold text-foreground hover:bg-surface-low flex items-center gap-3 transition-colors"
          >
            <Eye className="w-4 h-4 text-muted-foreground" />
            View Ledger
          </Link>

          {(sessionRole === "OWNER" || sessionRole === "MANAGER") && (
            <>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsEditOpen(true);
                }}
                className="w-full px-5 py-3 text-left text-sm font-bold text-foreground hover:bg-surface-low flex items-center gap-3 transition-colors"
              >
                <Edit3 className="w-4 h-4 text-muted-foreground" />
                Edit Details
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full px-5 py-3 text-left text-sm font-black text-error hover:bg-error/5 flex items-center gap-3 transition-colors disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-error" />
                ) : (
                  <Trash2 className="w-4 h-4 text-error" />
                )}
                Delete Customer
              </button>
            </>
          )}
        </div>
      )}

      {/* Edit Customer Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-lowest w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-border-ghost overflow-hidden animate-in zoom-in-95 duration-200">
            <header className="px-10 pt-10 pb-6 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-foreground tracking-tight">Edit Customer</h2>
                <p className="text-muted-foreground font-medium mt-1">Modify relationship records.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="p-3 rounded-2xl hover:bg-surface-low text-muted-foreground transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </header>

            <form onSubmit={handleEditSubmit} className="px-10 pb-10 space-y-6">
              {error && (
                <div className="p-4 rounded-xl bg-error/10 text-error text-sm font-bold border border-error/20">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="group">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1 mb-2 block">Customer Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      name="name"
                      required
                      defaultValue={customer.name}
                      placeholder="e.g. John Smith or ABC Company"
                      className="w-full pl-12 pr-6 py-4 rounded-2xl bg-surface-low border border-transparent focus:border-primary/50 focus:bg-white transition-all outline-none font-bold text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="group">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1 mb-2 block">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input
                        name="email"
                        type="email"
                        defaultValue={customer.email || ""}
                        placeholder="john@company.com"
                        className="w-full pl-12 pr-6 py-4 rounded-2xl bg-surface-low border border-transparent focus:border-primary/50 focus:bg-white transition-all outline-none font-bold text-foreground text-sm"
                      />
                    </div>
                  </div>
                  <div className="group">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1 mb-2 block">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input
                        name="contact"
                        defaultValue={customer.contact || ""}
                        placeholder="+1-123-456-7890"
                        className="w-full pl-12 pr-6 py-4 rounded-2xl bg-surface-low border border-transparent focus:border-primary/50 focus:bg-white transition-all outline-none font-bold text-foreground text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="group">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1 mb-2 block">Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-5 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <textarea
                      name="address"
                      rows={3}
                      defaultValue={customer.address || ""}
                      placeholder="Street address or location"
                      className="w-full pl-12 pr-6 py-4 rounded-2xl bg-surface-low border border-transparent focus:border-primary/50 focus:bg-white transition-all outline-none font-bold text-foreground text-sm resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="flex-1 py-4 rounded-2xl bg-surface-low text-foreground font-black text-sm hover:bg-surface-ghost transition-all"
                >
                  Cancel
                </button>
                <button
                  disabled={isPending}
                  type="submit"
                  className="flex-[2] py-4 rounded-2xl bg-primary text-white font-black text-sm shadow-xl shadow-primary/30 hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
