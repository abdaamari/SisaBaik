"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Package,
  ShoppingBag,
  CheckCircle,
  Clock,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";

interface PartnerDashboardData {
  availableDonations: number;
  claimedDonations: number;
  pendingOrders: number;
  completedOrders: number;
}

interface RecentDonation {
  id: string;
  food_name: string;
  category: string;
  quantity: number;
  unit: string;
  status: "available" | "claimed" | "delivered" | "cancelled";
  provider_name: string;
  created_at: string;
  expiry_time: string;
}

interface DonationRow {
  id: string;
  food_name: string;
  category: string;
  quantity: number;
  unit: string;
  status: string;
  created_at: string;
  expiry_time: string;
  profiles: { organization_name: string }[] | { organization_name: string };
}

function getExpiryMeta(expiryTime: string) {
  const expiry = new Date(expiryTime);
  const now = new Date();
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: "Kedaluwarsa", tone: "bg-destructive/10 text-destructive border-destructive/20" };
  if (diffDays <= 1) return { label: "Segera kedaluwarsa", tone: "bg-amber-50 text-amber-800 border-amber-200" };
  if (diffDays <= 3) return { label: `${diffDays} hari lagi`, tone: "bg-amber-50 text-amber-700 border-amber-200" };
  return { label: `${diffDays} hari lagi`, tone: "bg-muted text-muted-foreground border-border" };
}

export default function PartnerDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [dashboardData, setDashboardData] = useState<PartnerDashboardData | null>(null);
  const [recentDonations, setRecentDonations] = useState<RecentDonation[]>([]);
  const router = useRouter();
  const supabase = createClient();

  const fetchDashboardData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile, error: profileError } = (await supabase
        .from("profiles")
        .select("role, is_verified")
        .eq("id", user.id)
        .single()) as { data: { role: string; is_verified: boolean } | null; error: Error | null };

      if (profileError || !profile) {
        toast.error("Gagal memuat profil.");
        return;
      }

      const verified = !!profile.is_verified;
      setIsVerified(verified);
      if (!verified) {
        toast.error("Akun Anda belum diverifikasi. Anda masih dapat melihat donasi, tetapi belum dapat mengklaim.");
      }
      const [
        { count: availableDonations },
        { count: claimedDonations },
        { count: pendingOrders },
        { count: completedOrders },
      ] = await Promise.all([
        supabase.from('donations').select('*', { count: 'exact', head: true }).eq('status', 'available'),
        supabase.from('donations').select('*', { count: 'exact', head: true }).eq('status', 'claimed'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      ]);

      setDashboardData({
        availableDonations: availableDonations || 0,
        claimedDonations: claimedDonations || 0,
        pendingOrders: pendingOrders || 0,
        completedOrders: completedOrders || 0,
      });

      const { data: donations, error: donationsError } = await supabase
        .from("donations")
        .select(
          `
          id,
          food_name,
          category,
          quantity,
          unit,
          status,
          created_at,
          expiry_time,
          profiles!donations_provider_id_fkey(organization_name)
        `
        )
        .eq("status", "available")
        .order("created_at", { ascending: false })
        .limit(5) as { data: DonationRow[] | null; error: Error | null };

      if (donationsError) throw donationsError;

      const formattedDonations: RecentDonation[] = (donations || []).map((donation) => {
        const prov = donation.profiles;
        const name = Array.isArray(prov)
          ? (prov[0]?.organization_name ?? "Penyedia")
          : ((prov as { organization_name: string })?.organization_name ?? "Penyedia");
        return {
          id: donation.id,
          food_name: donation.food_name,
          category: donation.category,
          quantity: donation.quantity,
          unit: donation.unit,
          status: donation.status as RecentDonation["status"],
          provider_name: name,
          created_at: donation.created_at,
          expiry_time: donation.expiry_time,
        };
      });

      setRecentDonations(formattedDonations);
    } catch (error) {
      toast.error("Gagal memuat data dashboard");
      console.error("Dashboard error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchDashboardData();
  }, [fetchDashboardData]);

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
        title="Dashboard Mitra"
        description="Kelola donasi yang tersedia dan pesanan distribusi Anda."
        action={
          <div className="flex gap-2">
            <Button onClick={() => router.push("/partner/donations")} className="rounded-full">
              <Package className="h-4 w-4" />
              Lihat Donasi
            </Button>
            <Button variant="outline" onClick={() => router.push("/partner/orders")} className="rounded-full">
              <ShoppingBag className="h-4 w-4" />
              Pesanan
            </Button>
          </div>
        }
      />

      {isVerified === false && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="text-sm leading-6">
            <p className="font-medium">Akun belum diverifikasi</p>
            <p className="text-amber-800/80 dark:text-amber-100/80">
              Anda dapat melihat donasi yang tersedia, tetapi tombol klaim akan dinonaktifkan sampai admin memverifikasi akun. Hubungi admin jika verifikasi tertunda.
            </p>
          </div>
        </div>
      )}

      {dashboardData && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard title="Donasi Tersedia" value={dashboardData.availableDonations} icon={<Package className="h-4 w-4" />} />
          <StatCard title="Sudah Diklaim" value={dashboardData.claimedDonations} icon={<ShoppingBag className="h-4 w-4" />} />
          <StatCard title="Pesanan Pending" value={dashboardData.pendingOrders} icon={<Clock className="h-4 w-4" />} />
          <StatCard title="Selesai" value={dashboardData.completedOrders} icon={<CheckCircle className="h-4 w-4" />} />
        </div>
      )}

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="font-heading text-[17px]">Aksi Cepat</CardTitle>
          <CardDescription>Lanjutkan alur distribusi Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => router.push("/partner/donations")} className="rounded-full">
              <Package className="mr-2 h-4 w-4" />
              Lihat Donasi Tersedia
            </Button>
            <Button variant="outline" onClick={() => router.push("/partner/orders")} className="rounded-full">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Kelola Pesanan
            </Button>
            <Link href="/partner/donations" className="ml-auto hidden items-center gap-1 text-sm text-muted-foreground hover:text-foreground md:inline-flex">
              Jelajahi semua donasi <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="font-heading text-[17px]">Donasi Terbaru</CardTitle>
            <CardDescription>5 donasi makanan terbaru yang tersedia untuk diklaim</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push("/partner/donations")} className="rounded-full">
            Lihat semua <ArrowRight className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {recentDonations.length > 0 ? (
            <div className="space-y-3">
              {recentDonations.map((donation) => {
                const meta = getExpiryMeta(donation.expiry_time);
                return (
                  <div
                    key={donation.id}
                    className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition hover:bg-muted/20 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate font-medium text-foreground">{donation.food_name}</h4>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span>{donation.provider_name}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="tabular-nums">
                          {donation.quantity} {donation.unit}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span>{donation.category}</span>
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${meta.tone}`}>
                          {meta.label}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3 sm:shrink-0">
                      <StatusBadge status={donation.status} type="donation" />
                      <Button size="sm" onClick={() => router.push(`/partner/donations/${donation.id}`)} className="rounded-full">
                        Lihat Detail
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="Belum ada donasi tersedia"
              description="Donasi yang tersedia akan muncul di sini. Periksa kembali nanti atau hubungi penyedia terdekat."
              action={
                <Button variant="outline" onClick={() => router.push("/partner/donations")} className="rounded-full">
                  Jelajahi donasi
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}