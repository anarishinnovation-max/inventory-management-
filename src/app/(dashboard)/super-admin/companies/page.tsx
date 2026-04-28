"use client";

import { useEffect, useState } from "react";
import { 
  Building2, 
  Plus, 
  MoreVertical, 
  Settings2, 
  Trash2, 
  Loader2,
  Users as UsersIcon,
  Search,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import CompanyModal from "../components/CompanyModal";
import { useConfirm } from "@/hooks/use-confirm";

interface Company {
  id: string;
  name: string;
  settings: any;
  createdAt: string;
  _count: {
    users: number;
  };
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const confirm = useConfirm();

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/super-admin/companies");
      if (!response.ok) throw new Error("Failed to fetch companies");
      const data = await response.json();
      setCompanies(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const deleteCompany = async (company: Company) => {
    if (!(await confirm("Delete Company", `Are you sure you want to delete ${company.name}? This cannot be undone.`))) return;

    try {
      const response = await fetch(`/api/super-admin/companies/${company.id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete company");
      }
      toast.success("Company deleted successfully");
      fetchCompanies();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Link 
            href="/super-admin" 
            className="flex items-center gap-2 text-sm font-bold text-primary hover:gap-3 transition-all mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="heading-xl tracking-tight flex items-center gap-3">
            <Building2 className="w-10 h-10 text-primary" />
            Company Management
          </h1>
          <p className="text-muted-foreground font-medium">
            Manage tenants, their subscription status, and configurations.
          </p>
        </div>
        
        <button 
          onClick={() => {
            setSelectedCompany(null);
            setIsModalOpen(true);
          }}
          className="btn btn-primary self-start"
        >
          <Plus className="w-5 h-5" />
          Register New Company
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-4 p-4 bg-surface-lowest border border-border-ghost rounded-2xl shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search companies..." 
            className="w-full pl-12 pr-4 py-2.5 bg-surface-low border border-border-ghost rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Companies Table */}
      <div className="table-container animate-in delay-100">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-muted-foreground font-medium">Loading companies...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="table-header">
                <tr>
                  <th className="table-cell-header">Company Name</th>
                  <th className="table-cell-header">Users</th>
                  <th className="table-cell-header">Created</th>
                  <th className="table-cell-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-ghost">
                {filteredCompanies.map((company) => (
                  <tr key={company.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-surface-muted flex items-center justify-center font-black text-primary text-xl border border-border-ghost">
                          {company.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground text-lg">{company.name}</span>
                          <span className="text-xs text-muted-foreground font-mono">ID: {company.id.slice(0, 8)}...</span>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-2 text-sm font-bold">
                        <UsersIcon className="w-4 h-4 text-muted-foreground" />
                        {company._count.users} members
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="text-sm text-muted-foreground font-medium">
                        {new Date(company.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="table-cell text-right">
                      <div className="relative inline-block text-left">
                        <button 
                          onClick={() => setActiveMenu(activeMenu === company.id ? null : company.id)}
                          className="p-3 hover:bg-surface-muted rounded-xl transition-colors"
                        >
                          <MoreVertical className="w-5 h-5 text-muted-foreground" />
                        </button>

                        {activeMenu === company.id && (
                          <div className="absolute right-0 mt-2 w-56 bg-surface-lowest border border-border-ghost rounded-2xl shadow-ambient z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                            <button 
                              onClick={() => {
                                setSelectedCompany(company);
                                setIsModalOpen(true);
                                setActiveMenu(null);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold hover:bg-surface-muted rounded-xl transition-colors"
                            >
                              <Settings2 className="w-4 h-4 text-primary" />
                              Edit Company
                            </button>
                            <div className="h-px bg-border-ghost my-1" />
                            <button 
                              onClick={() => deleteCompany(company)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold hover:bg-red-500/10 text-red-500 rounded-xl transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete Company
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CompanyModal 
        isOpen={isModalOpen}
        company={selectedCompany}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchCompanies();
        }}
      />
    </div>
  );
}
