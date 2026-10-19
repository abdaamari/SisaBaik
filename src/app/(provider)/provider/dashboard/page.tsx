"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CheckCircle, Hand, Package, Plus, TrendingUp, XCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { DonationRow } from "@/components/ui/donation-row";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageLoader } from "@/components/ui/page-loader";
import { StatCard } from "@/components/ui/stat-card";
import { createClient } from "@/lib/supabase/client";

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

interface DonationStatusRow {
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
          const typedDonations = donations as DonationStatusRow[];
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

  if (isLoading) {
    return <PageLoader variant="dashboard" label="Memuat beranda" />;
  }

  return (
    <div className="space-y-10">
      <PageHeader
        title="Beranda"
        description="Ringkasan donasi Anda. Pilih salah satu angka untuk melihat daftarnya."
        action={
          <Link href="/provider/donations/new" className={buttonVariants({ size: "lg" })}>
            <Plus aria-hidden="true" />
            Buat donasi
          </Link>
        }
        className="mb-0"
      />

      <section aria-labelledby="ringkasan">
        <h2 id="ringkasan" className="sr-only">
          Ringkasan
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          <StatCard
            title="Semua donasi"
            value={stats.total}
            icon={<Package className="size-4" />}
            href="/provider/donations"
            className="col-span-2 md:col-span-1"
          />
          <StatCard
            title="Tersedia"
            value={stats.available}
            icon={<CheckCircle className="size-4" />}
            description="Belum diklaim"
            href="/provider/donations?status=available"
          />
          <StatCard
            title="Diklaim"
            value={stats.claimed}
            icon={<Hand className="size-4" />}
            description="Diambil mitra"
            href="/provider/donations?status=claimed"
          />
          <StatCard
            title="Disalurkan"
            value={stats.delivered}
            icon={<TrendingUp className="size-4" />}
            description="Sudah sampai"
            href="/provider/donations?status=delivered"
          />
          <StatCard
            title="Dibatalkan"
            value={stats.cancelled}
            icon={<XCircle className="size-4" />}
            href="/provider/donations?status=cancelled"
          />
        </div>
      </section>

      <section aria-labelledby="terbaru">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 id="terbaru" className="font-heading text-2xl font-extrabold tracking-tight">
            Donasi terbaru
          </h2>
          {recentDonations.length > 0 && (
            <Link
              href="/provider/donations"
              className="rounded-full px-1 text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Lihat semua
            </Link>
          )}
        </div>

        {recentDonations.length === 0 ? (
          <EmptyState
            title="Belum ada donasi"
            description="Catat makanan berlebih pertama Anda. Mitra terverifikasi bisa langsung melihat dan mengklaimnya."
            icon={<Package className="size-6" />}
            action={
              <Link href="/provider/donations/new" className={buttonVariants()}>
                Buat donasi pertama
              </Link>
            }
          />
        ) : (
          <ul className="space-y-3">
            {recentDonations.map((donation) => (
              <DonationRow
                key={donation.id}
                href={`/provider/donations/${donation.id}`}
                foodName={donation.food_name}
                category={donation.category}
                quantity={donation.quantity}
                unit={donation.unit}
                expiryTime={donation.expiry_time}
                status={donation.status}
                showMeter={donation.status === "available"}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
