"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

function generateInstanceId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

type Notification = Database["public"]["Tables"]["notifications"]["Row"];
type NotificationInsert = Database["public"]["Tables"]["notifications"]["Insert"];

const REFRESH_EVENT = "sisabaik:notifications-refresh";

/**
 * Ambil chat_thread_id dari kolom `data` (jsonb) sebuah notifikasi.
 * Menangani data yang sudah di-parse (object) maupun string JSON.
 */
export function getChatThreadId(notification: { data?: unknown }): string | null {
  const raw = notification.data;
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const id = parsed?.chat_thread_id;
      return typeof id === "string" ? id : null;
    } catch {
      return null;
    }
  }
  if (typeof raw === "object") {
    const id = (raw as Record<string, unknown>).chat_thread_id;
    return typeof id === "string" ? id : null;
  }
  return null;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  createNotification: (insert: Omit<NotificationInsert, "id" | "created_at" | "read">) => Promise<void>;
  subscribe: () => void;
}

/** Hook untuk notifikasi real-time lewat Supabase Realtime. */
export function useNotifications(userId: string | null): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const instanceIdRef = useRef<string>(generateInstanceId());

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications((data ?? []) as Notification[]);
    } catch {
      // Biarkan notifications kosong saat error
    } finally {
      setIsLoading(false);
    }
  }, [userId, supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchNotifications();
  }, [fetchNotifications]);

  // Sinkronisasi antar instance hook (mis. AppShell + NotificationBell + ChatInbox)
  // agar badge "Pesan" ikut hilang begitu notifikasi ditandai sudah dibaca.
  useEffect(() => {
    const handler = () => {
      void fetchNotifications();
    };
    window.addEventListener(REFRESH_EVENT, handler);
    return () => window.removeEventListener(REFRESH_EVENT, handler);
  }, [fetchNotifications]);

  const subscribe = useCallback(() => {
    if (!userId || channelRef.current) return;

    channelRef.current = supabase
      .channel(`notifications:${userId}:${instanceIdRef.current}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => [newNotif, ...prev.slice(0, 49)]);
          // Toast notifikasi real-time saat ada notifikasi baru
          const title = newNotif.title;
          const message = newNotif.message;
          console.log("New notification:", title, message);
        },
      )
      .subscribe();
  }, [userId, supabase]);

  useEffect(() => {
    subscribe();
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [subscribe, supabase, userId]);

  const markAsRead = useCallback(async (id: string) => {
    if (!userId) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("notifications")
      .update({ read: true })
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw error;
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    window.dispatchEvent(new CustomEvent(REFRESH_EVENT));
  }, [userId, supabase]);

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);
    if (error) throw error;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [userId, supabase]);

  const createNotification = useCallback(
    async (insert: Omit<NotificationInsert, "id" | "created_at" | "read">) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("notifications").insert({ ...insert, read: false });
      if (error) throw error;
    },
    [supabase],
  );

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    createNotification,
    subscribe,
  };
}
