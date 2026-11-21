"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export function useChatTyping(threadId: string, userId: string) {
  const supabase = useMemo(() => createClient(), []);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const ready = useRef(false);
  const lastSent = useRef(0);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [typing, setTyping] = useState(false);

  const publish = useCallback((active: boolean) => {
    if (ready.current) void channelRef.current?.send({
      type: "broadcast", event: "typing", payload: { active },
    });
  }, []);

  const stop = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    lastSent.current = 0;
    publish(false);
  }, [publish]);

  const update = useCallback((value: string) => {
    if (!value.trim()) { stop(); return; }
    if (Date.now() - lastSent.current > 1200) {
      publish(true);
      lastSent.current = Date.now();
    }
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(stop, 2500);
  }, [publish, stop]);

  useEffect(() => {
    let alive = true;
    let expiry: ReturnType<typeof setTimeout> | undefined;
    const channel = supabase.channel(`chat-typing:${threadId}`, {
      config: { private: true, broadcast: { self: false } },
    }).on("broadcast", { event: "typing" }, ({ payload }) => {
      if (!alive || typeof payload?.active !== "boolean") return;
      clearTimeout(expiry);
      setTyping(payload.active);
      if (payload.active) expiry = setTimeout(() => setTyping(false), 3500);
    });
    channelRef.current = channel;
    channel.subscribe(status => { ready.current = status === "SUBSCRIBED"; });
    const onHidden = () => { if (document.hidden) stop(); };
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("blur", stop);
    return () => {
      alive = false;
      stop();
      ready.current = false;
      clearTimeout(expiry);
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("blur", stop);
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [supabase, threadId, userId, stop]);

  return { typing, update, stop };
}
