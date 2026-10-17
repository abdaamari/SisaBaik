'use client';

import { Toaster } from 'sonner';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {children}
      <Toaster position="top-right" closeButton={true} />
    </div>
  );
}