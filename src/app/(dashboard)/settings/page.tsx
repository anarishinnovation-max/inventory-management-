import { 
  User as UserIcon, 
  Lock, 
  Bell, 
  ShieldCheck, 
  ChevronRight,
  LogOut,
  Palette
} from "lucide-react";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { SettingToggle } from "./SettingToggle";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default async function SettingsPage() {
  const session = await getSession();
  const user = session?.id ? await prisma.user.findUnique({ where: { id: session.id } }) : null;

  const sections = [
    {
      id: "profile",
      title: "Public Profile",
      description: "Manage your personal information and how others see you.",
      icon: UserIcon,
      color: "bg-blue-500",
      fields: [
        { label: "Display Name", value: user?.name || session?.username || "Admin User", type: "text" },
        { label: "Account ID", value: session?.id || "N/A", type: "readonly" },
        { label: "Organization Role", value: session?.role || "OWNER", type: "badge" },
      ]
    },
    {
      id: "security",
      title: "Security & Authentication",
      description: "Keep your account secure with multi-factor auth and password management.",
      icon: Lock,
      color: "bg-emerald-500",
      fields: [
        { label: "Password", value: "********", type: "password_action" },
        { label: "Two-Factor Auth", value: user?.twoFactorEnabled ? "Enabled" : "Disabled", type: "toggle", key: "twoFactorEnabled" },
      ]
    },
    {
      id: "notifications",
      title: "Notification Preferences",
      description: "Configure how you want to be alerted about inventory changes.",
      icon: Bell,
      color: "bg-amber-500",
      fields: [
        { label: "Email Alerts", value: user?.emailAlerts ? "On" : "Off", type: "toggle", key: "emailAlerts" },
        { label: "In-App Mentions", value: "On", type: "toggle" },
        { label: "Push Notifications", value: "Off", type: "toggle" },
      ]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <nav className="flex gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">
             <span>System control</span>
             <span className="opacity-30">/</span>
             <span className="text-primary">Personal profile</span>
          </nav>
          <h1 className="heading-xl tracking-tight text-4xl">Control Center</h1>
          <p className="text-muted-foreground mt-2 font-medium">Manage your digital identity and operational preferences.</p>
        </div>
        <div className="badge border-none bg-success/10 text-success text-[10px] h-8 px-4 font-black tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5 mr-2" />
            IDENTITY VERIFIED
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Navigation Sidebar */}
        <aside className="lg:col-span-3 space-y-6">
            <nav className="space-y-1.5">
                {sections.map(section => (
                    <button 
                        key={section.id}
                        className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group text-left",
                            section.id === "profile" 
                                ? "bg-white shadow-soft border border-border-ghost text-primary" 
                                : "text-muted-foreground hover:bg-white/50 hover:text-foreground border border-transparent"
                        )}
                    >
                        <section.icon className={cn("w-4 h-4", section.id === "profile" ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                        <span className="text-xs font-black uppercase tracking-wider">{section.title}</span>
                    </button>
                ))}
            </nav>
            <div className="pt-6 mt-6 border-t border-border-ghost/50 space-y-6">

                 
                 <form action={async () => {
                   "use server";
                   const { logout } = await import("@/lib/auth");
                   const { redirect } = await import("next/navigation");
                   await logout();
                   redirect("/login");
                 }}>
                     <button type="submit" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-error/70 hover:text-error hover:bg-error/5 transition-all text-xs font-black uppercase tracking-widest border border-transparent hover:border-error/10">
                        <LogOut className="w-4 h-4" />
                        Sign Out
                     </button>
                 </form>
            </div>
        </aside>

        {/* Content Area */}
        <main className="lg:col-span-9 space-y-8">
            {sections.map(section => (
                <div key={section.id} className="card-premium !p-0 overflow-hidden group hover:border-primary/20 transition-all duration-500 bg-white/50">
                    <div className="p-8 pb-6 flex items-start justify-between border-b border-border-ghost/50">
                        <div className="flex items-center gap-6">
                            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-xl rotate-3 group-hover:rotate-0 transition-all duration-500", section.color)}>
                                <section.icon className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-foreground tracking-tight">{section.title}</h3>
                                <p className="text-sm text-muted-foreground font-medium mt-1">{section.description}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 space-y-2">
                        {section.fields.map((field, idx) => (
                            <div key={idx} className="flex items-center justify-between py-5 border-b border-border-ghost/50 last:border-none group/row transition-all hover:bg-primary/[0.01] -mx-8 px-8">
                                <div className="space-y-1">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">{field.label}</p>
                                    <div className="text-sm font-bold text-foreground">
                                        {field.type === 'badge' ? (
                                            <span className="badge border-none bg-primary/10 text-primary text-[10px] h-6 px-3">
                                                {field.value}
                                            </span>
                                        ) : (
                                            <span className="tracking-tight">{field.value}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {field.type === 'toggle' && (
                                        <SettingToggle 
                                            label={field.label}
                                            initialValue={field.value === 'On' || field.value === 'Enabled'}
                                            type={(field as any).key}
                                        />
                                    )}
                                    {field.type === 'password_action' && (
                                        <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary-dark transition-colors px-3 py-1.5 rounded-lg border border-primary/20 hover:bg-primary/5">Revise auth</button>
                                    )}
                                    {field.type === 'text' && (
                                        <button className="p-2 rounded-xl hover:bg-primary/10 text-primary transition-all opacity-0 group-hover/row:opacity-100">
                                            <Palette className="w-4 h-4 " />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </main>
      </div>
    </div>
  );
}
