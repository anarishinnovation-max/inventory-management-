"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { Toaster } from "react-hot-toast";
import ConfirmDialog from "./ConfirmDialog";

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--color-surface-lowest)',
            color: 'var(--color-foreground)',
            border: '1px solid var(--color-border-ghost)',
            borderRadius: '1.25rem',
            padding: '0.75rem 1.25rem',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
          success: {
            iconTheme: {
              primary: 'oklch(0.65 0.2 150)',
              secondary: 'white',
            },
          },
          error: {
            iconTheme: {
              primary: 'oklch(0.55 0.2 25)',
              secondary: 'white',
            },
          },
        }}
      />
      <ConfirmDialog />
      {children}
    </QueryClientProvider>
  );
}
