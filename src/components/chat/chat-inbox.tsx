"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { PageLoader } from "@/components/ui/page-loader";
import { createClient } from "@/lib/supabase/client";
import { getChatThreadId, useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

export type ChatRole = "provider" | "partner" | "admin";
type ThreadKind = "donation" | "provider_admin" | "partner_admin";

interface ChatThread {
  id: string;
  kind: ThreadKind;
  donation_id: string | null;
  provider_id: string | null;
  partner_id: string | null;
  requester_id: string | null;
  subject: string;
  last_message_at: string;
  created_at: string;
}

interface ChatMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export function ChatInbox({ role }: { role: ChatRole }) {
  return (
    <Suspense fallback={<PageLoader variant="list" label="Memuat pesan" />}>
      <ChatInboxContent role={role} />
    </Suspense>
  );
}

function ChatInboxContent({ role }: { role: ChatRole }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedThreadId = searchParams.get("thread");
  const requestedDonationId = searchParams.get("donation");
  const supabase = useMemo(() => createClient(), []);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { notifications, markAsRead } = useNotifications(userId);
  // Batas "pesan baru" per thread: waktu notifikasi chat paling lama yang belum dibaca.
  const [unreadSinceByThread, setUnreadSinceByThread] = useState<Record<string, string>>({});

  const loadInbox = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        router.replace("/login");
        return;
      }
      setUserId(user.id);

      let supportThreadId: string | null = null;
      if (role !== "admin") {
        const { data, error } = await supabase.rpc("get_or_create_support_chat", {} as never);
        if (error) {
          // Jangan gagalkan seluruh inbox hanya karena thread bantuan belum bisa dibuat.
          // Biasanya ini terjadi kalau migrasi DB belum di-sync atau role tidak sesuai.
          console.warn("Thread bantuan belum bisa dimuat:", error.message);
        } else {
          supportThreadId = data;
        }
      }

      let donationThreads: ChatThread[] = [];
      if (role !== "admin") {
        const participantColumn = role === "provider" ? "provider_id" : "partner_id";
        const { data, error } = await supabase
          .from("chat_threads")
          .select("id, kind, donation_id, provider_id, partner_id, requester_id, subject, last_message_at, created_at")
          .eq("kind", "donation")
          .eq(participantColumn, user.id)
          .order("last_message_at", { ascending: false });
        if (error) throw error;
        donationThreads = (data ?? []) as ChatThread[];
      }

      const threadQuery = supabase
        .from("chat_threads")
        .select("id, kind, donation_id, provider_id, partner_id, requester_id, subject, last_message_at, created_at")
        .in("kind", role === "admin" ? ["provider_admin", "partner_admin"] : [role === "provider" ? "provider_admin" : "partner_admin"])
        .order("last_message_at", { ascending: false });

      const { data: supportThreads, error: supportError } = role === "admin"
        ? await threadQuery
        : await threadQuery.eq("id", supportThreadId ?? "00000000-0000-0000-0000-000000000000").limit(1);
      if (supportError) throw supportError;

      const allThreads = [
        ...((supportThreads ?? []) as ChatThread[]),
        ...donationThreads,
      ].sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
      setThreads(allThreads);

      const requested = requestedThreadId
        ? allThreads.find((thread) => thread.id === requestedThreadId)
        : requestedDonationId
          ? allThreads.find((thread) => thread.kind === "donation" && thread.donation_id === requestedDonationId)
          : undefined;
      const defaultSupport = supportThreadId
        ? allThreads.find((thread) => thread.id === supportThreadId)
        : undefined;
      setActiveThreadId(requested?.id ?? defaultSupport?.id ?? allThreads[0]?.id ?? null);
    } catch (error) {
      console.error("Chat inbox load error:", error);
      setLoadError("Pesan belum bisa dimuat. Pastikan migration chat sudah dijalankan, lalu coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }, [requestedDonationId, requestedThreadId, role, router, supabase]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      if (active) void loadInbox();
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [loadInbox]);

  const activeThread = threads.find((thread) => thread.id === activeThreadId) ?? null;

  // Catat batas pesan baru sebelum notifikasi ditandai terbaca,
  // supaya chat tetap menampilkan penanda "Pesan baru" di tempat yang tepat.
  useEffect(() => {
    if (!activeThreadId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUnreadSinceByThread((current) => {
      if (current[activeThreadId]) return current;
      const timestamps = notifications
        .filter((notification) => !notification.read && getChatThreadId(notification) === activeThreadId)
        .map((notification) => notification.created_at)
        .sort();
      if (timestamps.length === 0) return current;
      return { ...current, [activeThreadId]: timestamps[0] };
    });
  }, [activeThreadId, notifications]);

  // Notifikasi chat untuk thread yang sedang dibuka ditandai sudah dibaca,
  // sehingga badge di menu "Pesan" langsung hilang.
  useEffect(() => {
    if (!activeThreadId || !userId) return;
    const related = notifications.filter(
      (notification) => !notification.read && getChatThreadId(notification) === activeThreadId,
    );
    if (related.length === 0) return;
    for (const notification of related) {
      void markAsRead(notification.id);
    }
  }, [activeThreadId, markAsRead, notifications, userId]);

  if (isLoading) return <PageLoader variant="list" label="Memuat pesan" />;

  if (loadError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Pesan" description="Percakapan privat di Sisabaik." />
        <EmptyState
          icon={<MessageCircle className="size-6" />}
          title="Pesan belum tersedia"
          description={loadError}
          action={<Button variant="outline" onClick={() => void loadInbox()}>Coba lagi</Button>}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pesan"
        description={role === "admin" ? "Percakapan bantuan dari provider dan mitra." : "Percakapan privat dengan mitra donasi dan Admin."}
      />

      <section className="grid h-[calc(100dvh_-_16rem)] overflow-hidden rounded-2xl border border-border bg-card md:h-[calc(100dvh_-_9rem)] md:grid-cols-[minmax(15rem,20rem)_minmax(0,1fr)]" aria-label="Kotak masuk pesan">
        <aside className={cn("flex h-full min-h-0 flex-col overflow-hidden border-b border-border md:border-b-0 md:border-r", activeThreadId ? "hidden md:flex" : "flex")}>
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-heading text-lg font-bold">Percakapan</h2>
            <p className="mt-1 text-xs text-muted-foreground">Hanya peserta percakapan yang dapat membaca pesan.</p>
          </div>
          {threads.length === 0 ? (
            <div className="flex-1 p-5 text-sm text-muted-foreground">Belum ada percakapan.</div>
          ) : (
            <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
              {threads.map((thread) => (
                <li key={thread.id}>
                  <button
                    type="button"
                    onClick={() => setActiveThreadId(thread.id)}
                    aria-current={activeThreadId === thread.id ? "true" : undefined}
                    className={cn(
                      "w-full px-5 py-4 text-left transition-colors hover:bg-muted/70 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-ring",
                      activeThreadId === thread.id && "bg-secondary/70",
                    )}
                  >
                    <span className="block truncate text-sm font-semibold text-foreground">{thread.subject}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {thread.kind === "donation" ? "Chat donasi" : "Chat bantuan Admin"}
                      <span aria-hidden="true"> · </span>
                      {formatChatTime(thread.last_message_at)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <div className={cn("h-full min-h-0 min-w-0 overflow-hidden", activeThreadId ? "block" : "hidden md:flex md:items-center md:justify-center")}>
          {activeThread && userId ? (
            <ChatConversation
              key={activeThread.id}
              thread={activeThread}
              role={role}
              userId={userId}
              unreadSince={unreadSinceByThread[activeThread.id] ?? null}
              onBack={() => setActiveThreadId(null)}
            />
          ) : (
            <div className="hidden p-8 text-center text-sm text-muted-foreground md:block">
              Pilih percakapan untuk mulai membaca pesan.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function ChatConversation({
  thread,
  role,
  userId,
  unreadSince,
  onBack,
}: {
  thread: ChatThread;
  role: ChatRole;
  userId: string;
  unreadSince: string | null;
  onBack: () => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [liveDividerId, setLiveDividerId] = useState<string | null>(null);
  const [localBoundary] = useState<string | null>(() => {
    try {
      return window.localStorage.getItem(`sisabaik:chat-terakhir-dibaca:${thread.id}`);
    } catch {
      return null;
    }
  });
  const hasLoadedRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const storageKey = `sisabaik:chat-terakhir-dibaca:${thread.id}`;

  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("id, thread_id, sender_id, body, created_at")
      .eq("thread_id", thread.id)
      .order("created_at", { ascending: true });
    if (error) throw error;
    setMessages((data ?? []) as ChatMessage[]);
  }, [supabase, thread.id]);

  useEffect(() => {
    let active = true;
    const channel = supabase
      .channel(`chat-messages:${thread.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `thread_id=eq.${thread.id}` },
        (payload) => {
          const incoming = payload.new as ChatMessage;
          setMessages((current) => current.some((item) => item.id === incoming.id)
            ? current
            : [...current, incoming].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
          // Pesan masuk dari lawan → tandai batas "Pesan baru".
          if (
            hasLoadedRef.current &&
            incoming.sender_id.toLowerCase() !== userId.toLowerCase()
          ) {
            setLiveDividerId((current) => current ?? incoming.id);
          }
        },
      )
      .subscribe();

    const timer = window.setTimeout(() => {
      void fetchMessages()
        .catch(() => toast.error("Pesan percakapan gagal dimuat."))
        .finally(() => {
          if (!active) return;
          hasLoadedRef.current = true;
          setIsLoading(false);
        });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [fetchMessages, supabase, thread.id, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  // Batas "Pesan baru" versi lokal per perangkat: independent dari role
  // (provider/mitra/admin) sehingga penanda tetap muncul untuk semua akun.
  useEffect(() => {
    if (isLoading || messages.length === 0) return;
    const lastSeen = messages[messages.length - 1].created_at;
    try {
      window.localStorage.setItem(storageKey, lastSeen);
    } catch {
      // abaikan bila storage tidak tersedia
    }
  }, [isLoading, messages, storageKey]);

  const sendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || isSending) return;
    setIsSending(true);

    // Optimistic: tampilkan pesan sendiri langsung di kanan.
    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: optimisticId,
      thread_id: thread.id,
      sender_id: userId,
      body,
      created_at: new Date().toISOString(),
    };
    setMessages((current) =>
      [...current, optimisticMessage].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      ),
    );

    try {
      const { error } = await supabase.rpc("send_chat_message", {
        p_thread_id: thread.id,
        p_body: body,
      } as never);
      if (error) throw error;
      setDraft("");
      await fetchMessages();
    } catch (error) {
      // Rollback optimistic message on error.
      setMessages((current) => current.filter((m) => m.id !== optimisticId));
      const message = error instanceof Error ? error.message : "Pesan gagal dikirim. Coba lagi.";
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  };

  const senderLabel = (message: ChatMessage) => {
    if (message.sender_id.toLowerCase() === userId.toLowerCase()) return "Anda";
    if (thread.kind === "donation") return role === "provider" ? "Mitra penyalur" : "Penyedia makanan";
    return role === "admin" ? "Pengguna" : "Admin Sisabaik";
  };

  // Id pesan tepat sebelum pesan baru dimulai (batas "Pesan baru").
  const dividerId = useMemo(() => {
    if (liveDividerId) return liveDividerId;
    // Utamakan batas dari notifikasi server (lintas perangkat), cadangan dari localStorage.
    const boundary = unreadSince ?? localBoundary;
    if (!boundary) return null;
    const boundaryTime = new Date(boundary).getTime();
    const firstNew = messages.find(
      (message) => new Date(message.created_at).getTime() >= boundaryTime,
    );
    return firstNew?.id ?? null;
  }, [liveDividerId, localBoundary, messages, unreadSince]);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-4 sm:px-6">
        <Button type="button" variant="ghost" size="icon-sm" className="md:hidden" onClick={onBack} aria-label="Kembali ke daftar percakapan">
          <ArrowLeft aria-hidden="true" />
        </Button>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-fresh-soft text-fresh-ink">
          <MessageCircle className="size-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-sm font-bold text-foreground">{thread.subject}</h2>
          <p className="text-xs text-muted-foreground">{thread.kind === "donation" ? "Percakapan privat donasi" : "Percakapan privat dengan Admin"}</p>
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6" aria-live="polite">
        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Memuat pesan…</p>
        ) : messages.length === 0 ? (
          <div className="py-10 text-center">
            <p className="font-semibold text-foreground">Mulai percakapan</p>
            <p className="mt-1 text-sm text-muted-foreground">Pesan hanya terlihat oleh peserta percakapan ini.</p>
          </div>
        ) : messages.map((message) => {
          const mine = message.sender_id.toLowerCase() === userId.toLowerCase();
          const shouldAlignRight = mine;
          const showDivider = message.id === dividerId;
          return (
            <div key={message.id}>
              {showDivider && (
                <div className="flex items-center gap-3 py-1" role="separator" aria-label="Pesan baru">
                  <span className="h-px flex-1 bg-border" aria-hidden="true" />
                  <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                    Pesan baru
                  </span>
                  <span className="h-px flex-1 bg-border" aria-hidden="true" />
                </div>
              )}
              <div className={cn("flex", shouldAlignRight ? "justify-end" : "justify-start")}>
                <article className={cn("max-w-[min(85%,38rem)] rounded-2xl px-4 py-3", shouldAlignRight ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-muted text-foreground")}>
                  <p className={cn("mb-1 text-[11px] font-semibold", shouldAlignRight ? "text-primary-foreground/75" : "text-muted-foreground")}>{senderLabel(message)}</p>
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.body}</p>
                  <time className={cn("mt-1 block text-[10px]", shouldAlignRight ? "text-right text-primary-foreground/70" : "text-left text-muted-foreground")} dateTime={message.created_at}>
                    {formatChatTime(message.created_at)}
                  </time>
                </article>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="flex shrink-0 items-end gap-3 border-t border-border bg-card p-4 sm:px-6">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value.slice(0, 2000))}
          placeholder="Tulis pesan…"
          aria-label="Tulis pesan"
          autoComplete="off"
          disabled={isSending}
          className="min-h-11"
        />
        <Button type="submit" size="icon-lg" disabled={!draft.trim() || isSending} aria-label="Kirim pesan">
          {isSending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
        </Button>
      </form>
      <p className="shrink-0 bg-card px-4 pb-3 text-center text-[11px] text-muted-foreground sm:px-6">Pesan dilindungi akses privat berbasis akun.</p>
    </div>
  );
}

function formatChatTime(value: string) {
  return new Date(value).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
