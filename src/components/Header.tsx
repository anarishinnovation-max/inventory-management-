"use client";

import { useEffect, useState } from "react";

export default function Header() {
  const [userData, setUserData] = useState<{ name: string } | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUserData(data);
        }
      } catch (err) {}
    }
    fetchUser();
  }, []);

  const initials = userData?.name
    ? userData.name.split(" ").map(n => n[0]).join("").substring(0, 2)
    : "U";

  return (
    <header className="sticky top-0 z-40 bg-transparent">
      <div className="flex items-center justify-between px-8 py-2">
        <div className="flex-1" />

        {/* Right Actions */}
        <div className="flex items-center gap-3">

          <button className="p-0.5 border-2 border-transparent hover:border-primary/20 rounded-full transition-all  overflow-hidden" suppressHydrationWarning>
             <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-primary font-black text-xs uppercase">
                {initials}
             </div>
          </button>
        </div>
      </div>
    </header>
  );
}

