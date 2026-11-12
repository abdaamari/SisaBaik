"use client";

import { useState } from "react";
import { Bell, BellOff, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { useNotifications } from "@/hooks/use-notifications";

interface NotificationBellProps {
  userId: string | null;
  className?: string;
}

const TYPE_LABEL: Record<string, string> = {
  new_donation: "Donasi baru",
  donation_claimed: "Donasi diklaim",
  order_status_changed: "Status pesanan berubah",
  system: "Sistem",
};

export function NotificationBell({ userId, className }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } =
    useNotifications(userId);

  if (isLoading && notifications.length === 0) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled
        className={className}
        aria-label="Notifikasi (memuat)"
      >
        <Bell className="size-4" aria-hidden="true" />
      </Button>
    );
  }

  return (
    <div className={cn("relative inline-block", className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={`Notifikasi (${unreadCount} belum dibaca)`}
        className="relative"
      >
        {unreadCount > 0 ? <Bell className="size-4" aria-hidden="true" /> : <BellOff className="size-4" aria-hidden="true" />}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute z-50 mt-2 w-72 rounded-xl border border-border bg-card p-1 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <CardHeader className="px-4 py-3 flex items-center justify-between gap-2">
            <CardTitle className="text-sm font-semibold">Notifikasi</CardTitle>
            {unreadCount > 0 && (
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={markAllAsRead}
                className="text-xs px-2"
              >
                Tandai semua dibaca
              </Button>
            )}
          </CardHeader>
          <CardContent className="px-0 pt-0 pb-3 max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                Belum ada notifikasi
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {notifications.map((n) => (
                  <li key={n.id} className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => markAsRead(n.id)}
                      className="w-full flex items-start gap-3"
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex items-center justify-center min-w-6 h-6 rounded-full bg-muted text-muted-foreground text-[10px] font-semibold">
                          {TYPE_LABEL[n.type]?.[0] ?? "S"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground leading-tight">{n.title}</p>
                          {n.message && (
                            <p className="mt-0.5 text-sm text-muted-foreground leading-tight">{n.message}</p>
                          )}
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDateTime(n.created_at)}
                          </p>
                        </div>
                        {!n.read && (
                          <span className="h-2 w-2 rounded-full bg-primary shrink-0" aria-hidden="true" />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void markAsRead(n.id);
                        }}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="Hapus notifikasi"
                      >
                        <X className="size-3" aria-hidden="true" />
                      </button>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </div>
      )}
    </div>
  );
}

function cn(...classes: (string | undefined | null | boolean)[]) {
  return classes.filter(Boolean).join(" ");
}
