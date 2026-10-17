"use client";

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ExpiryCountdownProps {
  expiryTime: string; // ISO string
  className?: string;
}

export function ExpiryCountdown({ expiryTime, className }: ExpiryCountdownProps) {
  const [timeLeft, setTimeLeft] = useState(() => {
    const expiryDate = new Date(expiryTime);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    return Math.max(0, diffMs);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const expiryDate = new Date(expiryTime);
      const now = new Date();
      const diffMs = expiryDate.getTime() - now.getTime();

      if (diffMs <= 0) {
        setTimeLeft(0);
        clearInterval(interval);
      } else {
        setTimeLeft(diffMs);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiryTime]);

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  if (timeLeft <= 0) {
    return (
      <span className="px-2 py-1 text-xs bg-destructive/10 text-destructive rounded">
        Kadaluarsa
      </span>
    );
  }

  return (
    <span className={cn("px-2 py-1 text-xs bg-warning/10 text-warning rounded", className)}>
      {hours} jam {minutes} menit {seconds} detik
    </span>
  );
}
