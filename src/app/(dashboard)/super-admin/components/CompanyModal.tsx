"use client";

import { useEffect, useState } from "react";
import { X, Building2, Loader2, Save } from "lucide-react";
import toast from "react-hot-toast";

interface CompanyModalProps {
  isOpen: boolean;
  company: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CompanyModal({ isOpen, company, onClose, onSuccess }: CompanyModalProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    if (company) {
      setName(company.name);
    } else {
      setName("");
    }
  }, [company, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = company 
        ? `/api/super-admin/companies/${company.id}` 
        : "/api/super-admin/companies";
      
      const method = company ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) throw new Error("Failed to save company");

      toast.success(company ? "Company updated" : "Company registered");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      <div className="relative w-full max-w-lg bg-surface-lowest rounded-[2.5rem] shadow-ambient overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-8 border-b border-border-ghost flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="heading-md">{company ? "Edit Company" : "Register Company"}</h2>
              <p className="text-sm text-muted-foreground font-medium">Tenant details and configuration.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-surface-muted rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground ml-1">Company Name</label>
            <input 
              required
              type="text" 
              placeholder="e.g. Acme Corp" 
              className="w-full px-5 py-4 bg-surface-low border border-border-ghost rounded-2xl text-base font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="pt-4 flex gap-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 btn btn-secondary h-14 rounded-2xl"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-[2] btn btn-primary h-14 rounded-2xl"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {company ? "Save Changes" : "Register Company"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
