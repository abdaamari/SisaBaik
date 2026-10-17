"use client";

import { Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    // Check for saved theme or prefers-color-scheme
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sisabaik-theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
      localStorage.setItem('sisabaik-theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('sisabaik-theme', 'light');
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark((prev) => !prev)}
      aria-label="Toggle theme"
      className="p-2 rounded-lg hover:bg-muted transition-colors"
    >
      {isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}