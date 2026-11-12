"use client";

import React from "react";
import { useReveal } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Delay dalam ms (dikalikan dengan index untuk stagger). */
  delayIndex?: number;
  /** Jika true, gunakan shutter (clip-path) sebagai gambar. */
  shutter?: boolean;
}

export function Reveal({
  children,
  className,
  delayIndex = 0,
  shutter = false,
}: RevealProps) {
  const { ref, isVisible } = useReveal(delayIndex);

  return (
    <div
      ref={ref}
      className={cn(
        "reveal-wrapper",
        shutter ? "shutter" : undefined,
        isVisible ? "is-in" : undefined,
        className,
      )}
      data-reveal
      style={{ animationDelay: isVisible ? `calc(${delayIndex} * 90ms + 150ms)` : undefined }}
    >
      {children}
    </div>
  );
}

/** Wrapper untuk teks yang muncul baris demi baris (headline). */
interface RevealLinesProps {
  children: React.ReactNode;
  className?: string;
  delayIndex?: number;
}

export function RevealLines({ children, className, delayIndex = 0 }: RevealLinesProps) {
  const { ref, isVisible } = useReveal(delayIndex);

  return (
    <div
      ref={ref}
      className={cn("lines", isVisible ? "is-in" : undefined, className)}
      data-reveal
    >
      {React.Children.map(children, (child, i) => (
        <div key={i} data-line style={{ animationDelay: isVisible ? `calc(${i} * 110ms + 150ms)` : undefined }}>
          {child}
        </div>
      ))}
    </div>
  );
}

/** Komponen untuk animasi yang loop terus-menerus (infinite). Digunakan untuk kartu-karta di tengah halaman agar tidak patah dan tidak kosong. */
interface LoopRevealProps {
  children: React.ReactNode;
  className?: string;
  /** Index untuk stagger delay. */
  index?: number;
}

export function LoopReveal({ children, className, index = 0 }: LoopRevealProps) {
  const delayMs = index * 300;
  return (
    <div
      className={cn("loop-reveal", className)}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      {children}
    </div>
  );
}
