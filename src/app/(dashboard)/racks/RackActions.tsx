"use client";

import { Edit, MoreVertical, Trash2, X, MapPin, Loader2, Save } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/toast";

interface RackActionsProps {
  rackId: string;
  rackNumber: string;
  zone: string;
}

export default function RackActions({ rackId, rackNumber, zone }: RackActionsProps) {
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    rackNumber: rackNumber,
    zone: zone,
  });

  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/racks/${rackId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update rack");
      }

      showToast("Rack details updated successfully.", "success");
      setIsEditOpen(false);
      router.refresh();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/racks/${rackId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete rack");
      }

      showToast("Rack storage removed successfully.", "success");
      setIsDeleteOpen(false);
      setIsMenuOpen(false);
      router.refresh();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative flex justify-end gap-2" ref={menuRef}>
      {/* Edit Trigger */}
      <button 
        onClick={() => setIsEditOpen(true)}
        className="text-muted-foreground hover:bg-surface-low hover:text-primary rounded-xl transition-colors p-2"
        title="Edit Rack"
      >
        <Edit className="w-4 h-4" />
      </button>

      {/* Menu / More Trigger */}
      <button 
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="text-muted-foreground hover:bg-surface-low hover:text-primary rounded-xl transition-colors p-2"
        title="More Actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <div className="absolute right-0 top-12 z-40 w-48 bg-white border border-border-ghost shadow-ambient rounded-2xl py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <button
            onClick={() => {
              setIsEditOpen(true);
              setIsMenuOpen(false);
            }}
            className="w-full px-5 py-3 text-left text-sm font-black text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
          >
            <Edit className="w-4 h-4 text-slate-400" />
            Edit Rack
          </button>
          <div className="h-px bg-slate-100 my-1" />
          <button
            onClick={() => {
              setIsDeleteOpen(true);
              setIsMenuOpen(false);
            }}
            className="w-full px-5 py-3 text-left text-sm font-black text-error hover:bg-error/5 flex items-center gap-3 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-error" />
            Delete Rack
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 text-left">
          <div
            className="absolute inset-0 bg-foreground/30 backdrop-blur-md"
            onClick={() => setIsEditOpen(false)}
          />

          <div className="relative w-full max-w-md bg-white rounded-[3rem] shadow-ambient border border-border-ghost overflow-hidden animate-in fade-in duration-300">
            <div className="p-10">
              <div className="flex justify-between items-start mb-10">
                <div className="space-y-2">
                  <h3 className="heading-md">Update Rack Details</h3>
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Modify storage allocation</p>
                </div>
                <button
                  onClick={() => setIsEditOpen(false)}
                  className="w-10 h-10 rounded-xl bg-surface-low flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors border border-border-ghost"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                    Rack Identifier
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. A-101"
                    className="input-field tabular-nums"
                    value={formData.rackNumber}
                    onChange={(e) => setFormData({ ...formData, rackNumber: e.target.value })}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                    Zone / Area (Optional)
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-40" />
                    <input
                      type="text"
                      placeholder="e.g. Main Hall"
                      className="input-field pl-12"
                      value={formData.zone}
                      onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="btn btn-neutral flex-1 h-14"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={isSubmitting}
                    type="submit"
                    className="btn btn-primary flex-1 h-14 shadow-glow-primary"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 text-left">
          <div
            className="absolute inset-0 bg-foreground/30 backdrop-blur-md"
            onClick={() => setIsDeleteOpen(false)}
          />

          <div className="relative w-full max-w-md bg-white rounded-[3rem] shadow-ambient border border-border-ghost overflow-hidden animate-in fade-in duration-300">
            <div className="p-10">
              <div className="flex justify-between items-start mb-8">
                <div className="space-y-2">
                  <h3 className="heading-md text-error">Delete Rack Storage</h3>
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Decommission space</p>
                </div>
                <button
                  onClick={() => setIsDeleteOpen(false)}
                  className="w-10 h-10 rounded-xl bg-surface-low flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors border border-border-ghost"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <p className="text-sm font-medium leading-relaxed text-slate-500">
                  Are you absolutely sure you want to delete <span className="font-black text-slate-900">Rack {rackNumber}</span>? 
                  This action is permanent and cannot be undone.
                </p>

                <div className="p-5 rounded-2xl bg-error/5 border border-error/10 text-xs font-semibold leading-relaxed text-error">
                  ⚠️ Note: A rack can only be deleted if it is completely empty. If it contains products, transfer them to other racks before deleting.
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsDeleteOpen(false)}
                    className="btn btn-neutral flex-1 h-14"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={isDeleting}
                    onClick={handleDeleteSubmit}
                    type="button"
                    className="btn btn-error flex-1 h-14 shadow-glow-error"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                    Decommission
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
