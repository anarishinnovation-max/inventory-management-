import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex bg-background min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto h-screen p-8 no-scrollbar">
        {children}
      </main>
    </div>
  );
}
