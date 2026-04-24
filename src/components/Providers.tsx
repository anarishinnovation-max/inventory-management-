"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { Toaster } from "react-hot-toast";

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--surface-lowest)',
            color: 'var(--foreground)',
            border: '1px solid var(--border-ghost)',
            borderRadius: '1.5rem',
            padding: '1rem 1.5rem',
            fontWeight: 600,
          },
        }}
      />
      {children}
    </QueryClientProvider>
  );
}
