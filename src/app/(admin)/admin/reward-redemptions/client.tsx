"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Gift, Truck, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { PageLoader } from "@/components/ui/page-loader";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { ChoiceChips } from "@/components/ui/choice-chips";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatDateTime } from "@/lib/format";

interface RewardRedemption {
  id: string;
  user_id: string;
  reward_id: string;
  points_spent: number;
  status: "pending" | "fulfilled" | "cancelled";
  created_at: string;
  updated_at: string;
  rewards: {
    id: string;
    name: string;
    points_cost: number;
  } | null;
  profiles: {
    id: string;
    organization_name: string;
  } | null;
}

export default function AdminRewardRedemptionsClient() {
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const supabase = createClient();

  const fetchRedemptions = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("reward_redemptions")
        .select("*, rewards(*), profiles!reward_redemptions_user_id_fkey(organization_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setRedemptions(
        (data ?? []).map((r: any) => ({
          id: r.id,
          user_id: r.user_id,
          reward_id: r.reward_id,
          points_spent: r.points_spent,
          status: r.status,
          created_at: r.created_at,
          updated_at: r.updated_at,
          rewards: r.rewards?.[0] ?? r.rewards ?? null,
          profiles: r.profiles?.[0] ?? r.profiles ?? null,
        })) as RewardRedemption[],
      );
    } catch {
      toast.error("Gagal memuat daftar penukaran");
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void fetchRedemptions();
  }, [fetchRedemptions]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return redemptions.filter((r) => {
      const matchesSearch =
        !term ||
        r.rewards?.name.toLowerCase().includes(term) ||
        r.profiles?.organization_name.toLowerCase().includes(term);
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [redemptions, search, statusFilter]);

  const counts = useMemo(() => {
    return {
      all: redemptions.length,
      pending: redemptions.filter((r) => r.status === "pending").length,
      fulfilled: redemptions.filter((r) => r.status === "fulfilled").length,
      cancelled: redemptions.filter((r) => r.status === "cancelled").length,
    };
  }, [redemptions]);

  const handleFulfill = async (redemption: RewardRedemption) => {
    if (redemption.status !== "pending") return;
    setBusyId(redemption.id);
    try {
      // Ambil stok saat ini
      const { data: rewardData, error: fetchError } = await supabase
        .from("rewards")
        .select("stock")
        .eq("id", redemption.reward_id)
        .single();
      if (fetchError) throw fetchError;

      const newStock = (rewardData as any).stock - 1;

      // Kurangi stok hadiah
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: stockError } = await (supabase as any)
        .from("rewards")
        .update({ stock: newStock })
        .eq("id", redemption.reward_id);
      if (stockError) throw stockError;

      // Update status redemption
      const { error } = await (supabase as any)
        .from("reward_redemptions")
        .update({ status: "fulfilled" })
        .eq("id", redemption.id);
      if (error) throw error;

      toast.success("Permintaan penukaran telah diselesaikan — stok hadiah dikurangi");
      void fetchRedemptions();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menyelesaikan penukaran");
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (redemption: RewardRedemption) => {
    if (redemption.status !== "pending") return;
    setBusyId(redemption.id);
    try {
      // Kembalikan poin ke provider via RPC add_points (amount negatif untuk refund)
      const { error: refundError } = await (supabase as any).rpc("add_points", {
        p_user_id: redemption.user_id,
        p_amount: -redemption.points_spent,
        p_description: `Refund penukaran "${redemption.rewards?.name ?? "hadiah"}" dibatalkan`,
      });
      if (refundError) throw refundError;

      const { error } = await (supabase as any)
        .from("reward_redemptions")
        .update({ status: "cancelled" })
        .eq("id", redemption.id);
      if (error) throw error;

      toast.success("Permintaan penukaran dibatalkan — poin dikembalikan");
      void fetchRedemptions();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal membatalkan permintaan");
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) {
    return <PageLoader variant="list" label="Memuat daftar penukaran" />;
  }

  return (
    <div className="space-y-6">
      {redemptions.length === 0 ? (
        <EmptyState
          icon={<Gift className="size-6" />}
          title="Belum ada penukaran hadiah"
          description="Para penyedia belum melakukan penukaran hadiah apa pun."
        />
      ) : (
        <div>
          <PageHeader
            title="Kelola Penukaran Hadiah"
            description="Lihat dan kelola semua permintaan penukaran hadiah dari para penyedia."
          />

          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative sm:w-80">
                <Gift className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  type="search"
                  aria-label="Cari penukaran"
                  placeholder="Cari nama hadiah atau penyedia"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <ChoiceChips
                label="Filter status"
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: "all", label: "Semua", count: counts.all },
                  { value: "pending", label: "Menunggu", count: counts.pending },
                  { value: "fulfilled", label: "Selesai", count: counts.fulfilled },
                  { value: "cancelled", label: "Dibatalkan", count: counts.cancelled },
                ]}
              />
            </div>

            <p className="text-sm text-muted-foreground" aria-live="polite">
              <span className="font-semibold text-foreground tabular-nums">{visible.length}</span> dari{" "}
              <span className="tabular-nums">{redemptions.length}</span> permintaan
            </p>

            {visible.length === 0 ? (
              <EmptyState
                icon={<ShieldCheck className="size-6" />}
                title="Tidak ada yang cocok"
                description="Ubah kata kunci atau filter untuk melihat lebih banyak permintaan."
                action={
                  <Button variant="outline" onClick={() => setSearch("")}>
                    Hapus pencarian
                  </Button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="h-10 px-4 text-left text-xs font-medium text-muted-foreground uppercase">Penyedia</th>
                      <th className="h-10 px-4 text-left text-xs font-medium text-muted-foreground uppercase">Hadiah</th>
                      <th className="h-10 px-4 text-right text-xs font-medium text-muted-foreground uppercase">Poin</th>
                      <th className="h-10 px-4 text-center text-xs font-medium text-muted-foreground uppercase">Status</th>
                      <th className="h-10 px-4 text-left text-xs font-medium text-muted-foreground uppercase">Tanggal</th>
                      <th className="h-10 px-4 text-right text-xs font-medium text-muted-foreground uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((r) => {
                      const statusConfig: Record<string, { label: string; color: string }> = {
                        pending: { label: "Menunggu", color: "bg-soon-soft text-soon-ink" },
                        fulfilled: { label: "Selesai", color: "bg-primary text-primary-foreground" },
                        cancelled: { label: "Dibatalkan", color: "bg-muted text-muted-foreground" },
                      };
                      const config = statusConfig[r.status];
                      return (
                        <tr key={r.id} className="border-b border-border hover:bg-muted/50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-foreground">
                              {r.profiles?.organization_name ?? "Penyedia"}
                            </div>
                            <div className="text-xs text-muted-foreground">{r.user_id.slice(0, 8)}…</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-foreground">
                            {r.rewards?.name ?? "Hadiah"}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-muted-foreground tabular-nums">
                            {r.points_spent}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={cn(
                              "inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-semibold",
                              config.color,
                            )}>
                              {r.status === "pending" ? <Loader2 className="animate-spin size-3.5" aria-hidden="true" /> : <Truck className="size-3.5" aria-hidden="true" />}
                              {config.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {formatDateTime(r.created_at)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {r.status === "pending" ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleFulfill(r)}
                                    disabled={busyId === r.id}
                                  >
                                    Selesaikan
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleCancel(r)}
                                    disabled={busyId === r.id}
                                  >
                                    Batalkan
                                  </Button>
                                </>
                              ) : (
                                <Button size="sm" variant="ghost" disabled>
                                  {r.status === "fulfilled" ? "Selesai" : "Dibatalkan"}
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function cn(...classes: (string | undefined | null | boolean)[]) {
  return classes.filter(Boolean).join(" ");
}
