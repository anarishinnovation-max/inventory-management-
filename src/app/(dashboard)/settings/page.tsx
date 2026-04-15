import { 
  User, 
  Lock, 
  Bell, 
  Eye, 
  ShieldCheck, 
  Smartphone,
  ChevronRight,
  LogOut,
  Moon,
  Sun,
  Palette
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default async function SettingsPage() {
  const session = await getSession();

  const sections = [
    {
      id: "profile",
      title: "Public Profile",
      description: "Manage your personal information and how others see you.",
      icon: User,
      color: "bg-blue-500",
      fields: [
        { label: "Display Name", value: session?.username || "Admin User", type: "text" },
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
        { label: "Two-Factor Auth", value: "Disabled", type: "toggle" },
      ]
    },
    {
      id: "notifications",
      title: "Notification Preferences",
      description: "Configure how you want to be alerted about inventory changes.",
      icon: Bell,
      color: "bg-amber-500",
      fields: [
        { label: "Email Alerts", value: "On", type: "toggle" },
        { label: "In-App Mentions", value: "On", type: "toggle" },
        { label: "Push Notifications", value: "Off", type: "toggle" },
      ]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <header className="flex items-end justify-between border-b border-border-ghost pb-10">
        <div>
          <h1 className="heading-xl">Account Configuration</h1>
          <p className="text-muted-foreground mt-2 text-lg">Central control for your personal identity and application behavior.</p>
        </div>
        <div className="p-1 px-4 bg-surface-low rounded-2xl flex items-center gap-2 border border-border-ghost text-sm font-bold text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-success" />
            Verified Account
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Navigation Sidebar */}
        <aside className="lg:col-span-3 space-y-2">
            <nav className="space-y-1">
                {sections.map(section => (
                    <button 
                        key={section.id}
                        className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group text-left",
                            section.id === "profile" 
                                ? "bg-surface-lowest shadow-ambient border border-border-ghost text-primary" 
                                : "text-muted-foreground hover:bg-surface-lowest/50 hover:text-foreground"
                        )}
                    >
                        <section.icon className={cn("w-5 h-5", section.id === "profile" ? "text-primary" : "group-hover:text-foreground")} />
                        <span className="font-bold">{section.title}</span>
                    </button>
                ))}
            </nav>
            <div className="pt-8 mt-8 border-t border-border-ghost space-y-6">
                 <div>
                    <h4 className="px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Appearance</h4>
                    <div className="flex items-center gap-2 px-2">
                        <button className="flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl border-2 border-primary bg-surface-lowest shadow-ambient">
                            <Sun className="w-5 h-5 text-primary" />
                            <span className="text-xs font-bold text-primary">Light</span>
                        </button>
                        <button className="flex-1 flex flex-col items-center gap-2 p-3 rounded-2xl border-2 border-transparent hover:bg-surface-low text-muted-foreground transition-all">
                            <Moon className="w-5 h-5" />
                            <span className="text-xs font-bold">Dark</span>
                        </button>
                    </div>
                 </div>
                 
                 <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-error hover:bg-error/10 transition-all font-bold">
                    <LogOut className="w-5 h-5" />
                    Sign Out
                 </button>
            </div>
        </aside>

        {/* Content Area */}
        <main className="lg:col-span-9 space-y-8">
            {sections.map(section => (
                <div key={section.id} className="bg-surface-lowest rounded-[2rem] border border-border-ghost shadow-ambient overflow-hidden group hover:border-primary/20 transition-all duration-300">
                    <div className="p-8 pb-0 flex items-start justify-between">
                        <div className="flex items-center gap-5">
                            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg", section.color)}>
                                <section.icon className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-foreground">{section.title}</h3>
                                <p className="text-muted-foreground font-medium mt-0.5">{section.description}</p>
                            </div>
                        </div>
                        <button className="btn-ghost p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-8 space-y-6">
                        {section.fields.map((field, idx) => (
                            <div key={idx} className="flex items-center justify-between py-4 border-b border-border-ghost last:border-none">
                                <div>
                                    <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">{field.label}</p>
                                    <div className="mt-2 text-lg font-bold text-foreground">
                                        {field.type === 'badge' ? (
                                            <span className="badge-status bg-primary/10 text-primary border-primary/20">
                                                {field.value}
                                            </span>
                                        ) : (
                                            <span>{field.value}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {field.type === 'toggle' && (
                                        <div className={cn(
                                            "w-12 h-6 rounded-full p-1 transition-colors relative cursor-pointer",
                                            field.value === 'On' ? "bg-primary" : "bg-surface-low"
                                        )}>
                                            <div className={cn(
                                                "w-4 h-4 bg-white rounded-full shadow-sm transition-transform",
                                                field.value === 'On' ? "translate-x-6" : "translate-x-0"
                                            )} />
                                        </div>
                                    )}
                                    {field.type === 'password_action' && (
                                        <button className="text-sm font-bold text-primary hover:underline">Change Password</button>
                                    )}
                                    {field.type === 'text' && (
                                        <button className="p-2 rounded-xl hover:bg-surface-low text-muted-foreground transition-all">
                                            <Palette className="w-5 h-5 " />
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
