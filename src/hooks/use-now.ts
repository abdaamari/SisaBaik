"use client";

import { useSyncExternalStore } from "react";

// One shared clock for every countdown on the page.
// The server snapshot is 0, so nothing reads the current time during prerender;
// components show a neutral placeholder until the first client tick.
let current = 0;
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (timer === null) {
    current = Date.now();
    timer = setInterval(() => {
      current = Date.now();
      listeners.forEach((l) => l());
    }, 1000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
}

function getSnapshot() {
  // With no subscribers the clock is stopped, so a stale value must never leak into a fresh render.
  return timer === null ? 0 : current;
}

function getServerSnapshot() {
  return 0;
}

/** Milliseconds since epoch, refreshed every second. Returns 0 before the first client tick. */
export function useNow() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
