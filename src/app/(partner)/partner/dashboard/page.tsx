"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { CheckCircle, Clock, Package, ShoppingBag, Truck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { DonationRow } from "@/components/ui/donation-row";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { PageLoader } from "@/components/ui/page-loader";
import { StatCard } from "@/components/ui/stat-card";
import { getProviderName, type ProfileRef } from "@/lib/format";

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

interface DonationQueryRow {
  id: string;
  food_name: string;
  category: string;
  quantity: number;
  unit: string;
  status: string;
  created_at: string;
  expiry_time: string;
  profiles: ProfileRef;
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

      setIsVerified(!!profile.is_verified);
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
        .limit(5) as { data: DonationQueryRow[] | null; error: Error | null };

      if (donationsError) throw donationsError;

      const formattedDonations: RecentDonation[] = (donations || []).map((donation) => ({
        id: donation.id,
        food_name: donation.food_name,
        category: donation.category,
        quantity: donation.quantity,
        unit: donation.unit,
        status: donation.status as RecentDonation["status"],
        provider_name: getProviderName(donation.profiles),
        created_at: donation.created_at,
        expiry_time: donation.expiry_time,
      }));

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
    return <PageLoader variant="dashboard" label="Memuat beranda" />;
  }

  return (
    <div className="space-y-10">
      <PageHeader
        title="Beranda"
        description="Donasi yang bisa Anda ambil, dan pesanan yang sedang berjalan."
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/partner/donations" className={buttonVariants({ size: "lg" })}>
              <Package aria-hidden="true" />
              Cari donasi
            </Link>
            <Link href="/partner/orders" className={buttonVariants({ variant: "outline", size: "lg" })}>
              <ShoppingBag aria-hidden="true" />
              Pesanan saya
            </Link>
          </div>
        }
        className="mb-0"
      />

      {isVerified === false && (
        <Notice title="Akun Anda belum diverifikasi">
          Anda bisa melihat semua donasi yang tersedia, tetapi tombol klaim aktif setelah admin memverifikasi akun.
          Hubungi admin bila verifikasi tertunda.
        </Notice>
      )}

      {dashboardData && (
        <section aria-labelledby="ringkasan">
          <h2 id="ringkasan" className="sr-only">
            Ringkasan
          </h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              title="Siap diklaim"
              value={dashboardData.availableDonations}
              icon={<Package className="size-4" />}
              description="Donasi tersedia"
              href="/partner/donations"
            />
            <StatCard
              title="Sudah diklaim"
              value={dashboardData.claimedDonations}
              icon={<Truck className="size-4" />}
              description="Sedang disalurkan"
            />
            <StatCard
              title="Menunggu"
              value={dashboardData.pendingOrders}
              icon={<Clock className="size-4" />}
              description="Pesanan belum berjalan"
              href="/partner/orders"
            />
            <StatCard
              title="Selesai"
              value={dashboardData.completedOrders}
              icon={<CheckCircle className="size-4" />}
              description="Pesanan tuntas"
              href="/partner/orders"
            />
          </div>
        </section>
      )}

      <section aria-labelledby="terbaru">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 id="terbaru" className="font-heading text-2xl font-extrabold tracking-tight">
            Donasi terbaru
          </h2>
          {recentDonations.length > 0 && (
            <Link
              href="/partner/donations"
              className="rounded-full px-1 text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Lihat semua
            </Link>
          )}
        </div>

        {recentDonations.length > 0 ? (
          <ul className="space-y-3">
            {recentDonations.map((donation) => (
              <DonationRow
                key={donation.id}
                href={`/partner/donations/${donation.id}`}
                foodName={donation.food_name}
                category={donation.category}
                quantity={donation.quantity}
                unit={donation.unit}
                byline={donation.provider_name}
                expiryTime={donation.expiry_time}
                status={donation.status}
                showMeter
              />
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Belum ada donasi tersedia"
            description="Donasi baru dari penyedia akan muncul di sini. Cek lagi sebentar lagi."
            icon={<Package className="size-6" />}
            action={
              <Link href="/partner/donations" className={buttonVariants({ variant: "outline" })}>
                Jelajahi donasi
              </Link>
            }
          />
        )}
      </section>
    </div>
  );
}
