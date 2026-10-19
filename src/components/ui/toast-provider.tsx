'use client';

import { Toaster } from 'sonner';
import { useIsDark } from '@/hooks/use-theme';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const isDark = useIsDark();

  return (
    <div>
      {children}
      <Toaster
        position="top-center"
        closeButton={true}
        theme={isDark ? 'dark' : 'light'}
        toastOptions={{ classNames: { toast: 'font-sans' } }}
      />
    </div>
  );
}
