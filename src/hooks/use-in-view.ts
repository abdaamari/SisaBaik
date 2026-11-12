"use client";

import { useEffect, useState, useCallback, useRef } from "react";

/** Hook untuk memantau apakah elemen masuk viewport. Hanya trigger sekali. */
export function useInView(options?: IntersectionObserverInit) {
  const [isInView, setIsInView] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const observer = useRef<IntersectionObserver | null>(null);

  const reset = useCallback(() => {
    setIsInView(false);
    setHasTriggered(false);
  }, []);

  useEffect(() => {
    if (!ref.current || hasTriggered) return;

    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTriggered) {
            setIsInView(true);
            setHasTriggered(true);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px", ...options },
    );

    observer.current.observe(ref.current);

    return () => {
      observer.current?.disconnect();
      observer.current = null;
    };
  }, [ref.current, hasTriggered, options]);

  return { ref, isInView, reset };
}

/** Hook untuk animasi yang muncul saat elemen masuk viewport, dengan delay bertahap. */
export function useReveal(index = 0, threshold = 0.15) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.current?.disconnect();
          }
        });
      },
      { threshold, rootMargin: "0px 0px -12% 0px" },
    );

    observer.current.observe(ref.current);

    return () => {
      observer.current?.disconnect();
      observer.current = null;
    };
  }, [threshold]);

  return { ref, isVisible, index };
}

/** Hook untuk animasi yang loop terus-menerus (infinite). Cocok untuk kartu-kartu di tengah halaman. */
export function useLoopReveal(index = 0) {
  const ref = useRef<HTMLDivElement | null>(null);
  return { ref, index };
}

/** Tambahkan class .js ke <body> saat JavaScript tersedia, lalu hapus animasi saat reduced motion. */
export function useMotion() {
  const [hasMotion, setHasMotion] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.add("js");
    setHasMotion(true);

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = () => {
      // Biarkan CSS yang menangani reduced motion; kita hanya butuh tahu JS siap
    };
    media.addEventListener("change", handler);
    return () => {
      media.removeEventListener("change", handler);
      document.documentElement.classList.remove("js");
    };
  }, []);

  return hasMotion;
}
