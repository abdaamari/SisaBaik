"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { CheckCircle, MapPin, Truck, XCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChoiceChips } from "@/components/ui/choice-chips";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { FreshnessMeter } from "@/components/ui/freshness-meter";
import { PageHeader } from "@/components/ui/page-header";
import { PageLoader } from "@/components/ui/page-loader";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatusTimeline, getOrderTimeline } from "@/components/ui/status-timeline";
import { formatDateTime, getProviderName, type ProfileRef } from "@/lib/format";

interface OrderDonation {
  id: string;
  food_name: string;
  category: string;
  quantity: number;
  unit: string;
  status: string;
  expiry_time: string;
  pickup_address: string;
  description: string | null;
  profiles?: ProfileRef;
}

interface OrderRow {
  id: string;
  status: string;
  claimed_at: string;
  completed_at: string | null;
  donation_id: string;
  donations: OrderDonation | null;
}

type OrderAction = "in_transit" | "completed" | "cancelled";
type StatusFilter = "all" | "pending" | "in_transit" | "completed" | "cancelled";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "pending", label: "Menunggu" },
  { value: "in_transit", label: "Dalam pengiriman" },
  { value: "completed", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" },
];

// What the confirmation dialog says for each action. The button always names what it will do.
const ACTION_COPY: Record<OrderAction, { title: string; description: string; confirm: string; tone: "default" | "danger" }> = {
  in_transit: {
    title: "Mulai pengiriman?",
    description: "Status pesanan menjadi Dalam pengiriman. Pastikan makanan sudah Anda jemput.",
    confirm: "Mulai pengiriman",
    tone: "default",
  },
  completed: {
    title: "Tandai pesanan selesai?",
    description: "Lakukan ini setelah makanan sampai ke penerima. Status tidak bisa diubah lagi.",
    confirm: "Tandai selesai",
    tone: "default",
  },
  cancelled: {
    title: "Batalkan pesanan ini?",
    description: "Pesanan dibatalkan dan tidak bisa dilanjutkan lagi.",
    confirm: "Batalkan pesanan",
    tone: "danger",
  },
};

export default function PartnerOrdersPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [pending, setPending] = useState<{ order: OrderRow; next: OrderAction } | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data, error } = await supabase
        .from("orders")
        .select("id, status, claimed_at, completed_at, donation_id, donations!inner(id, food_name, category, quantity, unit, status, expiry_time, pickup_address, description, profiles!donations_provider_id_fkey(organization_name))")
        .eq("partner_id", user.id)
        .order("claimed_at", { ascending: false });
      if (error) throw error;
      setOrders((data as unknown as OrderRow[]) ?? []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memuat pesanan";
      toast.error(msg);
    } finally { setIsLoading(false); }
  }, [supabase, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchOrders();
  }, [fetchOrders]);

  const counts = useMemo(() => {
    const result: Record<StatusFilter, number> = { all: orders.length, pending: 0, in_transit: 0, completed: 0, cancelled: 0 };
    for (const order of orders) {
      if (order.status in result) result[order.status as StatusFilter] += 1;
    }
    return result;
  }, [orders]);

  const handleUpdate = async () => {
    if (!pending) return;
    const { order, next } = pending;
    setUpdatingId(order.id);
    try {
      const { data, error } = await (supabase as unknown as { rpc: (n: string, a: Record<string, string>) => Promise<{ data: { success: boolean; error?: string }; error: unknown }> }).rpc("update_order_status", { p_order_id: order.id, p_new_status: next }) as { data: { success: boolean; error?: string } | null; error: unknown };
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error ?? "Gagal memperbarui status");
      toast.success(next === "completed" ? "Pesanan selesai." : next === "cancelled" ? "Pesanan dibatalkan." : "Status diperbarui.");
      setPending(null);
      await fetchOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memperbarui pesanan";
      toast.error(msg);
    } finally { setUpdatingId(null); }
  };

  const filtered = orders.filter((o) => statusFilter === "all" || o.status === statusFilter);

  if (isLoading) {
    return <PageLoader variant="list" label="Memuat pesanan" />;
  }

  return (
    <div>
      <PageHeader
        title="Pesanan saya"
        description="Pantau tiap donasi yang Anda klaim, dari penjemputan sampai makanan sampai."
        action={
          <Link href="/partner/donations" className={buttonVariants({ variant: "outline", size: "lg" })}>
            Cari donasi
          </Link>
        }
      />

      {orders.length === 0 ? (
        <EmptyState
          icon={<Truck className="size-6" />}
          title="Belum ada pesanan"
          description="Klaim donasi dari halaman Donasi tersedia, lalu kelola penjemputannya di sini."
          action={
            <Link href="/partner/donations" className={buttonVariants()}>
              Jelajahi donasi
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          <ChoiceChips
            label="Filter status pesanan"
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_OPTIONS.map((option) => ({ ...option, count: counts[option.value] }))}
          />

          {filtered.length === 0 ? (
            <EmptyState
              icon={<Truck className="size-6" />}
              title="Tidak ada pesanan di tahap ini"
              description="Pilih tahap lain untuk melihat pesanan Anda."
              action={
                <Button variant="outline" onClick={() => setStatusFilter("all")}>
                  Tampilkan semua
                </Button>
              }
            />
          ) : (
            <ul className="grid gap-4">
              {filtered.map((o) => {
                const d = o.donations;
                const isPending = o.status === "pending";
                const isTransit = o.status === "in_transit";
                const busy = updatingId === o.id;
                return (
                  <li key={o.id}>
                    <Card>
                      <CardContent className="space-y-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h2 className="truncate font-heading text-xl font-bold">{d?.food_name ?? "Donasi"}</h2>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                              {d ? getProviderName(d.profiles) : "Penyedia"}
                              {d && (
                                <>
                                  {" "}
                                  <span aria-hidden="true">·</span> {d.category}{" "}
                                  <span aria-hidden="true">·</span>{" "}
                                  <span className="tabular-nums">
                                    {d.quantity} {d.unit}
                                  </span>
                                </>
                              )}
                            </p>
                          </div>
                          <StatusBadge status={o.status} type="order" />
                        </div>

                        <StatusTimeline steps={getOrderTimeline(o.status)} orientation="horizontal" />

                        {d && (isPending || isTransit) && (
                          <div className="rounded-xl bg-muted px-4 py-3">
                            <FreshnessMeter expiryTime={d.expiry_time} />
                          </div>
                        )}

                        <div className="space-y-1.5 text-sm text-muted-foreground">
                          {d && (
                            <p className="flex items-start gap-2">
                              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                              <span>{d.pickup_address}</span>
                            </p>
                          )}
                          <p>Diklaim {formatDateTime(o.claimed_at)}</p>
                          {o.completed_at && <p>Selesai {formatDateTime(o.completed_at)}</p>}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
                          {isPending && (
                            <Button disabled={busy} onClick={() => setPending({ order: o, next: "in_transit" })}>
                              <Truck aria-hidden="true" />
                              Mulai pengiriman
                            </Button>
                          )}
                          {isTransit && (
                            <Button disabled={busy} onClick={() => setPending({ order: o, next: "completed" })}>
                              <CheckCircle aria-hidden="true" />
                              Tandai selesai
                            </Button>
                          )}
                          {(isPending || isTransit) && (
                            <Button variant="destructive" disabled={busy} onClick={() => setPending({ order: o, next: "cancelled" })}>
                              <XCircle aria-hidden="true" />
                              Batalkan
                            </Button>
                          )}
                          {d && (
                            <Link href={`/partner/donations/${d.id}`} className={buttonVariants({ variant: "ghost", className: "sm:ml-auto" })}>
                              Lihat donasi
                            </Link>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
        title={pending ? ACTION_COPY[pending.next].title : ""}
        description={pending ? ACTION_COPY[pending.next].description : undefined}
        confirmLabel={pending ? ACTION_COPY[pending.next].confirm : "Konfirmasi"}
        tone={pending ? ACTION_COPY[pending.next].tone : "default"}
        loading={updatingId !== null}
        onConfirm={handleUpdate}
      />
    </div>
  );
}
