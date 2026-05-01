"use client";

import { Loader2, MapPin, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { showToast } from "@/lib/toast";

export default function AddRackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    rackNumber: "",
    zone: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/racks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create rack");
      }

      showToast("Rack storage initialized.", "success");
      setIsOpen(false);
      setFormData({ rackNumber: "", zone: "" });
      router.refresh();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn btn-primary px-8 h-12 shadow-glow-primary !rounded-xl"
      >
        <Plus className="w-5 h-5" />
        Add New Rack
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-foreground/30 backdrop-blur-md"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative w-full max-w-md bg-white rounded-[3rem] shadow-ambient border border-border-ghost overflow-hidden animate-in fade-in duration-300">
            <div className="p-10">
              <div className="flex justify-between items-start mb-10">
                <div className="space-y-2">
                  <h3 className="heading-md">Setup New Rack</h3>
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Initialize storage location</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 rounded-xl bg-surface-low flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors border border-border-ghost"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
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
                    onClick={() => setIsOpen(false)}
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
                      <Plus className="w-5 h-5" />
                    )}
                    Create Rack
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


