"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Coins, Gift, History, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { PageLoader } from "@/components/ui/page-loader";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatDateTime } from "@/lib/format";
import { OptimizedImage, DonationPlaceholder } from "@/components/ui/image";

interface Reward {
  id: string;
  name: string;
  description: string | null;
  points_cost: number;
  stock: number;
  is_active: boolean;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

interface PointTransaction {
  id: string;
  type: "earned" | "redeemed";
  amount: number;
  description: string | null;
  created_at: string;
}

interface RewardRedemption {
  id: string;
  reward_id: string;
  points_spent: number;
  status: "pending" | "fulfilled" | "cancelled";
  created_at: string;
  updated_at: string;
  rewards: Reward | null;
}

interface Profile {
  id: string;
  points: number;
}

export default function ProviderRewardsClient() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [redeemTarget, setRedeemTarget] = useState<Reward | null>(null);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [profileResult, rewardsResult, transactionsResult, redemptionsResult] =
        await Promise.all([
          supabase.from("profiles").select("id, points").eq("id", user.id).single(),
          supabase.from("rewards").select("*").eq("is_active", true).order("points_cost", { ascending: true }),
          supabase.from("point_transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
          supabase.from("reward_redemptions")
            .select("*, rewards(*)")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
        ]);

        if (profileResult.error) throw profileResult.error;
        if (rewardsResult.error) throw rewardsResult.error;
        if (transactionsResult.error) throw transactionsResult.error;
        if (redemptionsResult.error) throw redemptionsResult.error;

        setProfile(profileResult.data as Profile);
        setRewards((rewardsResult.data ?? []) as Reward[]);
        setTransactions((transactionsResult.data ?? []) as PointTransaction[]);
        setRedemptions((redemptionsResult.data ?? []) as RewardRedemption[]);
    } catch {
      toast.error("Gagal memuat data reward");
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const totalEarned = useMemo(() => {
    return transactions
      .filter((t) => t.type === "earned")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const totalRedeemed = useMemo(() => {
    return transactions
      .filter((t) => t.type === "redeemed")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const canRedeem = (reward: Reward) => {
    return profile ? profile.points >= reward.points_cost && reward.stock > 0 : false;
  };

  const handleRedeem = async (reward: Reward) => {
    if (!profile) return;
    if (!canRedeem(reward)) {
      toast.error("Poin tidak cukup atau stok hadiah habis");
      return;
    }

    setRedeemTarget(reward);
  };

  const confirmRedeem = async () => {
    if (!redeemTarget || !profile) return;
    setRedeeming(redeemTarget.id);

    try {
      // 1. Potong poin provider segera (status redemption masih pending)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: pointsError } = await (supabase as any).rpc("add_points", {
        p_user_id: profile.id,
        p_amount: -redeemTarget.points_cost,
        p_description: `Tukar hadiah "${redeemTarget.name}" (menunggu persetujuan admin)`,
      });
      if (pointsError) throw pointsError;

      // 2. Buat permintaan penukaran
      const { error } = await (supabase as any).from("reward_redemptions").insert({
        user_id: profile.id,
        reward_id: redeemTarget.id,
        points_spent: redeemTarget.points_cost,
        status: "pending",
      });

      if (error) throw error;

      toast.success(`Hadiah "${redeemTarget.name}" berhasil ditukarkan! Menunggu persetujuan admin.`);
      setRedeemTarget(null);
      setRedeeming(null);
      void fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menukar hadiah";
      toast.error(msg);
      setRedeeming(null);
    }
  };

  if (isLoading) {
    return <PageLoader variant="list" label="Memuat reward" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hadiah & Poin"
        description={`Saat ini Anda memiliki ${profile?.points ?? 0} poin. Tukarkan poin dengan hadiah menarik.`}
        backHref="/provider/dashboard"
        backLabel="Kembali ke Beranda"
      />

      {/* Poin overview cards */}
      <div className="grid gap-5 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-extrabold text-foreground tabular-nums">{profile?.points ?? 0}</h2>
                <p className="text-sm text-muted-foreground">Poin saat ini</p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-full bg-fresh-soft text-fresh-ink">
                <Coins className="size-6" aria-hidden="true" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-extrabold text-foreground tabular-nums">{totalEarned}</h2>
                <p className="text-sm text-muted-foreground">Total poin terkumpul</p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <History className="size-6" aria-hidden="true" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-extrabold text-foreground tabular-nums">{totalRedeemed}</h2>
                <p className="text-sm text-muted-foreground">Total poin ditukarkan</p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-full bg-soon-soft text-soon-ink">
                <Gift className="size-6" aria-hidden="true" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Katalog Hadiah */}
      <Card>
        <CardHeader>
          <CardTitle>Katalog Hadiah</CardTitle>
          <CardDescription>Tukarkan poin Anda dengan hadiah berikut.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rewards.length === 0 ? (
            <EmptyState
              icon={<Gift className="size-6" />}
              title="Belum ada hadiah tersedia"
              description="Admin belum menambahkan hadiah ke katalog."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {rewards.map((reward) => (
                <Card key={reward.id} className="h-full">
                  <CardContent className="flex h-full flex-col gap-4">
                    {reward.image_url ? (
                      <div className="relative h-32 overflow-hidden rounded-xl bg-muted border border-border">
                        <OptimizedImage
                          src={reward.image_url}
                          alt={reward.name}
                          fill
                          className="w-full h-full object-cover"
                        />
                        {reward.stock === 0 && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">Stok Habis</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-32 overflow-hidden rounded-xl bg-muted border border-border flex items-center justify-center">
                        <DonationPlaceholder className="h-32 w-full" />
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Gift className="size-5 text-primary" aria-hidden="true" />
                        <h3 className="font-semibold text-foreground">{reward.name}</h3>
                      </div>
                      <span
                        className={cn(
                          "inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-semibold",
                          reward.stock > 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {reward.stock > 0 ? `${reward.stock} tersedia` : "Habis"}
                      </span>
                    </div>
                    {reward.description && (
                      <p className="text-sm text-muted-foreground">{reward.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Coins className="size-4" aria-hidden="true" />
                      <span className="text-sm font-semibold text-foreground">{reward.points_cost} poin</span>
                    </div>
                    <div className="mt-auto pt-2">
                      <Button
                        onClick={() => handleRedeem(reward)}
                        disabled={!canRedeem(reward) || redeeming === reward.id}
                        className="w-full"
                      >
                        {redeeming === reward.id ? (
                          <>
                            <Loader2 className="animate-spin size-4" aria-hidden="true" />
                            Memproses...
                          </>
                        ) : canRedeem(reward) ? (
                          "Tukarkan"
                        ) : profile ? (
                          profile.points < reward.points_cost ? "Poin kurang" : "Stok habis"
                        ) : "Tukarkan"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Riwayat Transaksi Poin */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Poin</CardTitle>
          <CardDescription>Transaksi poin terbaru Anda.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Belum ada transaksi poin. Mulai donasi untuk mendapatkan poin!
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-full", t.type === "earned" ? "bg-fresh-soft text-fresh-ink" : "bg-muted text-muted-foreground")}>
                      {t.type === "earned" ? <Coins className="size-4" /> : <Gift className="size-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {t.type === "earned" ? "Poin ditambahkan" : "Poin ditukarkan"}
                      </p>
                      <p className="text-xs text-muted-foreground">{t.description ?? "-"}</p>
                    </div>
                  </div>
                  <span className={cn("text-sm font-semibold tabular-nums", t.type === "earned" ? "text-fresh-ink" : "text-muted-foreground")}>
                    {t.type === "earned" ? "+" : "-"}{t.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Riwayat Penukaran Hadiah */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Penukaran Hadiah</CardTitle>
          <CardDescription>Status permintaan penukaran hadiah Anda.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {redemptions.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Belum ada penukaran hadiah.
            </div>
          ) : (
            <div className="space-y-2">
              {redemptions.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-soon-soft text-soon-ink">
                      <Gift className="size-4" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {r.rewards?.name ?? "Hadiah"}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(r.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex h-5 items-center gap-1 rounded-full px-2 text-[10px] font-semibold",
                        r.status === "fulfilled" && "bg-fresh-soft text-fresh-ink",
                        r.status === "pending" && "bg-soon-soft text-soon-ink",
                        r.status === "cancelled" && "bg-muted text-muted-foreground",
                      )}
                    >
                      {r.status === "fulfilled" ? "Selesai" : r.status === "pending" ? "Menunggu" : "Dibatalkan"}
                    </span>
                    <span className="text-sm text-muted-foreground tabular-nums">-{r.points_spent} poin</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm Redeem Dialog */}
      {redeemTarget && (
        <ConfirmDialog
          open={redeemTarget !== null}
          onOpenChange={(open) => {
            if (!open) setRedeemTarget(null);
          }}
          title={`Tukarkan "${redeemTarget.name}"?`}
          description={
            `Anda akan menghabiskan ${redeemTarget.points_cost} poin untuk menukar hadiah ini. Admin akan memproses permintaan Anda.`
          }
          confirmLabel="Tukarkan Hadiah"
          cancelLabel="Batal"
          loading={redeeming === redeemTarget.id}
          onConfirm={confirmRedeem}
        />
      )}
    </div>
  );
}

function cn(...classes: (string | undefined | null | boolean)[]) {
  return classes.filter(Boolean).join(" ");
}
