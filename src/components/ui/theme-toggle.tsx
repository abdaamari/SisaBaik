"use client";

import { Moon, Sun } from 'lucide-react';
import { setTheme, useIsDark } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const isDark = useIsDark();

  return (
    <button
      type="button"
      onClick={() => setTheme(!isDark)}
      aria-label={isDark ? 'Ganti ke tampilan terang' : 'Ganti ke tampilan gelap'}
      className={cn(
        'inline-flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        className,
      )}
    >
      {isDark ? <Sun className="size-[18px]" aria-hidden="true" /> : <Moon className="size-[18px]" aria-hidden="true" />}
    </button>
  );
}
