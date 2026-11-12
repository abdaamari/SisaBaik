"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Search, ShoppingBag, Truck, CheckCircle, Clock, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { PageLoader } from "@/components/ui/page-loader";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { ChoiceChips } from "@/components/ui/choice-chips";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Pagination } from "@/components/ui/pagination";
import { formatDateTime } from "@/lib/format";

interface AdminOrder {
  id: string;
  order_status: "pending" | "in_transit" | "completed" | "cancelled";
  claimed_at: string;
  completed_at: string | null;
  donation_id: string;
  partner_id: string;
  donation: {
    id: string;
    provider_id: string;
    food_name: string;
    category: string;
    quantity: number;
    unit: string;
    expiry_time: string;
    pickup_address: string;
    image_url: string | null;
    status: string;
  };
  partner: {
    id: string;
    organization_name: string;
  };
}

const PAGE_SIZE = 10;

const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Menunggu", color: "bg-soon-soft text-soon-ink" },
  in_transit: { label: "Dalam pengiriman", color: "bg-fresh-soft text-fresh-ink" },
  completed: { label: "Selesai", color: "bg-primary text-primary-foreground" },
  cancelled: { label: "Dibatalkan", color: "bg-muted text-muted-foreground" },
};

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "pending", label: "Menunggu" },
  { value: "in_transit", label: "Dalam pengiriman" },
  { value: "completed", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" },
];

export default function AdminOrdersClient() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const supabase = createClient();

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error, count } = await supabase
        .from("orders")
        .select(`
          id, status, claimed_at, completed_at, donation_id, partner_id,
          donations!inner(id, provider_id, food_name, category, quantity, unit, expiry_time, pickup_address, image_url, status),
          profiles!orders_partner_id_fkey(id, organization_name)
        `, { count: "exact" })
        .order("claimed_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      const formatted: AdminOrder[] = (data ?? []).map((o: any) => ({
        id: o.id,
        order_status: o.status,
        claimed_at: o.claimed_at,
        completed_at: o.completed_at,
        donation_id: o.donation_id,
        partner_id: o.partner_id,
        donation: {
          id: o.donations[0]?.id ?? o.donations?.id,
          provider_id: o.donations[0]?.provider_id ?? o.donations?.provider_id,
          food_name: o.donations[0]?.food_name ?? o.donations?.food_name,
          category: o.donations[0]?.category ?? o.donations?.category,
          quantity: o.donations[0]?.quantity ?? o.donations?.quantity,
          unit: o.donations[0]?.unit ?? o.donations?.unit,
          expiry_time: o.donations[0]?.expiry_time ?? o.donations?.expiry_time,
          pickup_address: o.donations[0]?.pickup_address ?? o.donations?.pickup_address,
          image_url: o.donations[0]?.image_url ?? o.donations?.image_url,
          status: o.donations[0]?.status ?? o.donations?.status,
        },
        partner: {
          id: o.profiles?.[0]?.id ?? o.profiles?.id,
          organization_name: o.profiles?.[0]?.organization_name ?? o.profiles?.organization_name ?? "Mitra",
        },
      }));

      setTotalCount(count ?? 0);
      setOrders(formatted);
    } catch {
      toast.error("Gagal memuat daftar pesanan");
    } finally {
      setIsLoading(false);
    }
  }, [supabase, page]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  // Reset ke halaman 1 saat filter atau pencarian berubah
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((o) => {
      const matchesSearch =
        !term ||
        o.donation.food_name.toLowerCase().includes(term) ||
        o.partner.organization_name.toLowerCase().includes(term);
      const matchesStatus = statusFilter === "all" || o.order_status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const counts = useMemo(() => {
    const result: Record<string, number> = { all: totalCount };
    for (const o of orders) {
      result[o.order_status] = (result[o.order_status] ?? 0) + 1;
    }
    return result;
  }, [orders, totalCount]);

  if (isLoading) {
    return <PageLoader variant="list" label="Memuat daftar pesanan" />;
  }

  if (totalCount === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag className="size-6" />}
        title="Belum ada pesanan"
        description="Belum ada pesanan yang tercatat di platform SisaBaik."
        action={
          <Button variant="outline" onClick={() => void fetchOrders()}>
            Muat Ulang
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pantau Semua Pesanan"
        description="Lihat seluruh pesanan klaim donasi dari semua mitra di platform, difilter berdasarkan status."
        action={
          <Button variant="outline" size="lg" onClick={() => void fetchOrders()}>
            Muat Ulang
          </Button>
        }
      />

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative sm:w-80">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              type="search"
              aria-label="Cari pesanan"
              placeholder="Cari nama makanan atau mitra"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <ChoiceChips
            label="Filter status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_FILTERS.map((s) => ({ ...s, count: counts[s.value] ?? 0 }))}
          />
        </div>

        <p className="text-sm text-muted-foreground" aria-live="polite">
          <span className="font-semibold text-foreground tabular-nums">{visible.length}</span> dari{" "}
          <span className="tabular-nums">{totalCount}</span> pesanan
        </p>

        {visible.length === 0 ? (
          <EmptyState
            icon={<Search className="size-6" />}
            title="Tidak ada yang cocok"
            description="Ubah kata kunci atau filter untuk melihat lebih banyak pesanan."
            action={
              <Button variant="outline" onClick={() => setSearch("")}>
                Hapus pencarian
              </Button>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="h-10 px-4 text-left text-xs font-medium text-muted-foreground uppercase">Makanan</th>
                    <th className="h-10 px-4 text-left text-xs font-medium text-muted-foreground uppercase">Mitra</th>
                    <th className="h-10 px-4 text-left text-xs font-medium text-muted-foreground uppercase">Penyedia</th>
                    <th className="h-10 px-4 text-left text-xs font-medium text-muted-foreground uppercase">Jumlah</th>
                    <th className="h-10 px-4 text-left text-xs font-medium text-muted-foreground uppercase">Status Pesanan</th>
                    <th className="h-10 px-4 text-left text-xs font-medium text-muted-foreground uppercase">Diklaim</th>
                    <th className="h-10 px-4 text-right text-xs font-medium text-muted-foreground uppercase">Selesai</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((o) => {
                    const config = ORDER_STATUS_CONFIG[o.order_status];
                    return (
                      <tr key={o.id} className="border-b border-border hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">{o.donation.food_name}</div>
                          <div className="text-xs text-muted-foreground">{o.donation.id.slice(0, 8)}…</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">{o.partner.organization_name}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{o.donation.category}</td>
                        <td className="px-4 py-3">
                          <span className={cn("inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-semibold", config.color)}>
                            {o.donation.quantity} {o.donation.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-semibold", config.color)}>
                            {config.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {formatDateTime(o.claimed_at)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                          {o.completed_at ? formatDateTime(o.completed_at) : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined | null | boolean)[]) {
  return classes.filter(Boolean).join(" ");
}
