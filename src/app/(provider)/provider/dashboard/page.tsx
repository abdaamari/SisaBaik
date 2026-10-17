"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Package,
  Plus,
  TrendingUp,
  Calendar,
  CheckCircle,
  Hand,
  XCircle,
} from "lucide-react";
import Link from "next/link";

interface DonationStats {
  total: number;
  available: number;
  claimed: number;
  delivered: number;
  cancelled: number;
}

interface RecentDonation {
  id: string;
  food_name: string;
  category: string;
  quantity: number;
  unit: string;
  status: "available" | "claimed" | "delivered" | "cancelled";
  expiry_time: string;
  created_at: string;
}

interface DonationRow {
  status: "available" | "claimed" | "delivered" | "cancelled";
}

export default function ProviderDashboard() {
  const [stats, setStats] = useState<DonationStats>({
    total: 0,
    available: 0,
    claimed: 0,
    delivered: 0,
    cancelled: 0,
  });
  const [recentDonations, setRecentDonations] = useState<RecentDonation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  useEffect(() => {
    let isActive = true;

    const fetchDashboardData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!isActive || !user) return;

        // Fetch stats
        const { data: donations } = await supabase
          .from("donations")
          .select("status")
          .eq("provider_id", user.id);

        if (!isActive) return;
        if (donations) {
          const typedDonations = donations as DonationRow[];
          const newStats: DonationStats = {
            total: typedDonations.length,
            available: typedDonations.filter((d) => d.status === "available")
              .length,
            claimed: typedDonations.filter((d) => d.status === "claimed").length,
            delivered: typedDonations.filter((d) => d.status === "delivered")
              .length,
            cancelled: typedDonations.filter((d) => d.status === "cancelled")
              .length,
          };
          setStats(newStats);
        }

        // Fetch recent donations
        const { data: recent } = await supabase
          .from("donations")
          .select(
            "id, food_name, category, quantity, unit, status, expiry_time, created_at",
          )
          .eq("provider_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (isActive && recent) {
          setRecentDonations(recent as RecentDonation[]);
        }
      } catch (error: unknown) {
        if (isActive) {
          toast.error("Gagal memuat data dashboard");
          console.error("Dashboard error:", error);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void fetchDashboardData();

    return () => {
      isActive = false;
    };
  }, [supabase]);

  const getExpiryStatus = (expiryTime: string) => {
    const expiry = new Date(expiryTime);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0)
      return {
        status: "expired",
        color: "text-destructive",
        label: "Kedaluwarsa",
      };
    if (diffDays <= 1)
      return {
        status: "urgent",
        color: "text-amber-700 dark:text-amber-400",
        label: "Segera kedaluwarsa",
      };
    if (diffDays <= 3)
      return {
        status: "warning",
        color: "text-amber-600",
        label: `${diffDays} hari lagi`,
      };
    return {
      status: "good",
      color: "text-muted-foreground",
      label: `${diffDays} hari lagi`,
    };
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard Penyedia"
        description="Ringkasan donasi dan aktivitas terbaru Anda — data langsung dari donasi milik akun yang sedang login."
        action={
          <Link href="/provider/donations/new">
            <Button className="rounded-full">
              <Plus className="h-4 w-4" />
              Buat Donasi Baru
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatCard
          title="Total donasi"
          value={stats.total}
          icon={<Package className="h-4 w-4" />}
          description="Seluruh donasi yang pernah Anda catat."
        />
        <StatCard
          title="Tersedia"
          value={stats.available}
          icon={<CheckCircle className="h-4 w-4" />}
          description="Siap disalurkan dan belum diklaim."
        />
        <StatCard
          title="Diklaim"
          value={stats.claimed}
          icon={<Hand className="h-4 w-4" />}
          description="Sudah diambil mitra penyalur."
        />
        <StatCard
          title="Disalurkan"
          value={stats.delivered}
          icon={<TrendingUp className="h-4 w-4" />}
          description="Berhasil sampai ke penerima manfaat."
        />
        <StatCard
          title="Dibatalkan"
          value={stats.cancelled}
          icon={<XCircle className="h-4 w-4" />}
          description="Dibatalkan dan tidak disalurkan."
        />
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border bg-muted/20">
          <CardTitle className="font-heading text-[20px]">Donasi terbaru</CardTitle>
          <CardDescription>5 donasi terbaru Anda — ringkas, siap tindak lanjut.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {recentDonations.length === 0 ? (
            <EmptyState
              title="Belum ada donasi"
              description="Mulai dengan mencatat makanan berlebih pertama Anda. Data nyata, tanpa placeholder."
              icon={<Package className="h-5 w-5" />}
              action={
                <Link href="/provider/donations/new">
                  <Button>Buat donasi pertama</Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {recentDonations.map((donation) => {
                const expiryStatus = getExpiryStatus(donation.expiry_time);
                return (
                  <div
                    key={donation.id}
                    className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/20 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-medium text-foreground">
                        {donation.food_name}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {donation.category} • {donation.quantity}{" "}
                        {donation.unit}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-4">
                      <div className="text-right">
                        <StatusBadge status={donation.status} type="donation" />
                        <p className={`mt-1.5 text-xs ${expiryStatus.color}`}>
                          {expiryStatus.label}
                        </p>
                      </div>
                      <Link href={`/provider/donations/${donation.id}`}>
                        <Button variant="outline" size="sm" className="rounded-full">
                          Lihat
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card
          className="group cursor-pointer rounded-xl transition-colors hover:bg-muted/20"
          onClick={() => router.push("/provider/donations")}
        >
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-primary">
                <Package className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-medium text-foreground">Kelola Donasi</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  Lihat dan kelola semua donasi
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="group cursor-pointer rounded-xl transition-colors hover:bg-muted/20"
          onClick={() => router.push("/provider/donations?status=claimed")}
        >
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-primary">
                <Hand className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-medium text-foreground">Donasi diklaim</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  Sudah diambil mitra penyalur
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="group cursor-pointer rounded-xl transition-colors hover:bg-muted/20"
          onClick={() => router.push("/provider/donations")}
        >
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-primary">
                <Calendar className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-medium text-foreground">Riwayat</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  Riwayat distribusi Anda
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
