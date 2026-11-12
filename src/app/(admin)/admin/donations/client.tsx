"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Search, Package, Clock, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { PageLoader } from "@/components/ui/page-loader";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { ChoiceChips } from "@/components/ui/choice-chips";
import { Pagination } from "@/components/ui/pagination";
import { formatDateTime } from "@/lib/format";
import { OptimizedImage } from "@/components/ui/image";

interface AdminDonation {
  id: string;
  provider_id: string;
  food_name: string;
  category: string;
  quantity: number;
  unit: string;
  status: "available" | "claimed" | "delivered" | "cancelled";
  expiry_time: string;
  pickup_address: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string | null;
  provider_name: string;
}

const PAGE_SIZE = 10;

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  available: { label: "Tersedia", color: "bg-fresh-soft text-fresh-ink" },
  claimed: { label: "Diklaim", color: "bg-soon-soft text-soon-ink" },
  delivered: { label: "Disalurkan", color: "bg-primary text-primary-foreground" },
  cancelled: { label: "Dibatalkan", color: "bg-muted text-muted-foreground" },
};

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "available", label: "Tersedia" },
  { value: "claimed", label: "Diklaim" },
  { value: "delivered", label: "Disalurkan" },
  { value: "cancelled", label: "Dibatalkan" },
];

export default function AdminDonationsClient() {
  const [donations, setDonations] = useState<AdminDonation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const supabase = createClient();

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const fetchDonations = useCallback(async () => {
    setIsLoading(true);
    try {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error, count } = await supabase
        .from("donations")
        .select(`
          id, provider_id, food_name, category, quantity, unit, status,
          expiry_time, pickup_address, description, image_url, created_at, updated_at,
          profiles!donations_provider_id_fkey(organization_name)
        `, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      const formatted: AdminDonation[] = (data ?? []).map((d: any) => ({
        id: d.id,
        provider_id: d.provider_id,
        food_name: d.food_name,
        category: d.category,
        quantity: d.quantity,
        unit: d.unit,
        status: d.status,
        expiry_time: d.expiry_time,
        pickup_address: d.pickup_address,
        description: d.description,
        image_url: d.image_url,
        created_at: d.created_at,
        updated_at: d.updated_at,
        provider_name: d.profiles?.[0]?.organization_name ?? d.profiles?.organization_name ?? "Penyedia",
      }));

      setTotalCount(count ?? 0);
      setDonations(formatted);
    } catch {
      toast.error("Gagal memuat daftar donasi");
    } finally {
      setIsLoading(false);
    }
  }, [supabase, page]);

  useEffect(() => {
    void fetchDonations();
  }, [fetchDonations]);

  // Reset ke halaman 1 saat filter atau pencarian berubah
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return donations.filter((d) => {
      const matchesSearch =
        !term ||
        d.food_name.toLowerCase().includes(term) ||
        d.category.toLowerCase().includes(term) ||
        d.provider_name.toLowerCase().includes(term) ||
        d.pickup_address.toLowerCase().includes(term);
      const matchesStatus = statusFilter === "all" || d.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [donations, search, statusFilter]);

  const counts = useMemo(() => {
    const result: Record<string, number> = { all: totalCount };
    for (const d of donations) {
      result[d.status] = (result[d.status] ?? 0) + 1;
    }
    return result;
  }, [donations, totalCount]);

  if (isLoading) {
    return <PageLoader variant="list" label="Memuat daftar donasi" />;
  }

  if (totalCount === 0) {
    return (
      <EmptyState
        icon={<Package className="size-6" />}
        title="Belum ada donasi"
        description="Belum ada donasi yang tercatat di platform SisaBaik."
        action={
          <Button variant="outline" onClick={() => void fetchDonations()}>
            Muat Ulang
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pantau Semua Donasi"
        description="Lihat seluruh donasi dari semua penyedia di platform, difilter berdasarkan status."
        action={
          <Button variant="outline" size="lg" onClick={() => void fetchDonations()}>
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
              aria-label="Cari donasi"
              placeholder="Cari nama makanan, kategori, atau penyedia"
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
          <span className="tabular-nums">{totalCount}</span> donasi
        </p>

        {visible.length === 0 ? (
          <EmptyState
            icon={<Search className="size-6" />}
            title="Tidak ada yang cocok"
            description="Ubah kata kunci atau filter untuk melihat lebih banyak donasi."
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
                    <th className="h-10 px-4 text-left text-xs font-medium text-muted-foreground uppercase">Penyedia</th>
                    <th className="h-10 px-4 text-left text-xs font-medium text-muted-foreground uppercase">Kategori</th>
                    <th className="h-10 px-4 text-left text-xs font-medium text-muted-foreground uppercase">Jumlah</th>
                    <th className="h-10 px-4 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                    <th className="h-10 px-4 text-left text-xs font-medium text-muted-foreground uppercase">Batas Kelayakan</th>
                    <th className="h-10 px-4 text-left text-xs font-medium text-muted-foreground uppercase">Alamat</th>
                    <th className="h-10 px-4 text-right text-xs font-medium text-muted-foreground uppercase">Foto</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((d) => {
                    const config = STATUS_CONFIG[d.status];
                    return (
                      <tr key={d.id} className="border-b border-border hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">{d.food_name}</div>
                          <div className="text-xs text-muted-foreground">{d.id.slice(0, 8)}…</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">{d.provider_name}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{d.category}</td>
                        <td className="px-4 py-3">
                          <span className={cn("inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-semibold", config.color)}>
                            {d.quantity} {d.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-semibold", config.color)}>
                            {config.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {formatDateTime(d.expiry_time)}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-pre-wrap">
                          {d.pickup_address}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {d.image_url ? (
                            <a
                              href={d.image_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block h-8 w-8 p-0"
                            >
                              <OptimizedImage
                                src={d.image_url}
                                alt=""
                                width={32}
                                height={32}
                                className="rounded-full object-cover border border-border"
                              />
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
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
