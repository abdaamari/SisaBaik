"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Package,
  ShoppingBag,
  ShieldCheck,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { PageLoader } from "@/components/ui/page-loader";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { StatCard } from "@/components/ui/stat-card";

interface Stat {
  title: string;
  value: number;
  icon: React.ElementType;
  description: string;
  href?: string;
  color?: "fresh" | "soon" | "primary" | "muted";
}

const STAT_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  available: { label: "Siap diklaim", icon: Package, color: "bg-fresh-soft text-fresh-ink" },
  claimed: { label: "Sudah diklaim", icon: ShoppingBag, color: "bg-soon-soft text-soon-ink" },
  delivered: { label: "Disalurkan", icon: CheckCircle, color: "bg-primary text-primary-foreground" },
  cancelled: { label: "Dibatalkan", icon: XCircle, color: "bg-muted text-muted-foreground" },
  pending: { label: "Menunggu", icon: Clock, color: "bg-soon-soft text-soon-ink" },
  in_transit: { label: "Dalam pengiriman", icon: Truck, color: "bg-fresh-soft text-fresh-ink" },
  completed: { label: "Selesai", icon: CheckCircle, color: "bg-primary text-primary-foreground" },
};

export default function AdminDashboardClient() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/stats", { cache: "no-store" });
      if (!response.ok) throw new Error("Gagal memuat statistik");
      setStats(await response.json());
    } catch {
      toast.error("Gagal memuat statistik admin");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial request shares the loading state with the manual refresh action.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchStats();
  }, [fetchStats]);

  if (isLoading) {
    return <PageLoader variant="dashboard" label="Memuat statistik admin" />;
  }

  const statCards: Stat[] = [
    {
      title: "Penyedia",
      value: stats.totalProviders ?? 0,
      icon: Users,
      description: "Total penyedia makanan",
      href: "/admin/users?role=provider",
    },
    {
      title: "Mitra (Terverifikasi)",
      value: stats.verifiedPartners ?? 0,
      icon: ShieldCheck,
      description: `${stats.pendingPartners ?? 0} menunggu verifikasi`,
      href: "/admin/users?role=partner",
    },
    {
      title: "Donasi Tersedia",
      value: stats.availableDonations ?? 0,
      icon: Package,
      description: "Siap diklaim mitra",
      href: "/admin/donations?status=available",
    },
    {
      title: "Pesanan Menunggu",
      value: stats.pendingOrders ?? 0,
      icon: Clock,
      description: "Belum diproses mitra",
      href: "/admin/orders?status=pending",
    },
  ];

  const donationStats = [
    { key: "available", label: "Tersedia", value: stats.availableDonations ?? 0 },
    { key: "claimed", label: "Diklaim", value: stats.claimedDonations ?? 0 },
    { key: "delivered", label: "Disalurkan", value: stats.deliveredDonations ?? 0 },
    { key: "cancelled", label: "Dibatalkan", value: stats.cancelledDonations ?? 0 },
  ];

  const orderStats = [
    { key: "pending", label: "Menunggu", value: stats.pendingOrders ?? 0 },
    { key: "in_transit", label: "Dalam pengiriman", value: stats.in_transit ?? 0 },
    { key: "completed", label: "Selesai", value: stats.completedOrders ?? 0 },
    { key: "cancelled", label: "Dibatalkan", value: stats.cancelledDonations ?? 0 },
  ];

  return (
    <div className="space-y-12 pb-8 sm:space-y-14 sm:pb-10">
      <Reveal delayIndex={0}>
        <PageHeader
          title="Admin Dashboard"
          description="Ringkasan kondisi platform SisaBaik: pengguna, donasi, dan pesanan."
          action={
            <Button variant="outline" size="lg">
              Muat Ulang
            </Button>
          }
        />
      </Reveal>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const config = STAT_CONFIG[stat.title.toLowerCase().includes("mitra") ? "pending" : stat.title.toLowerCase().includes("donasi") ? "available" : stat.title.toLowerCase().includes("pesanan") ? "pending" : "primary"];
          return (
            <StatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              icon={<Icon className="size-5" />}
              description={stat.description}
              href={stat.href}
            />
          );
        })}
      </div>

      {/* Donation & Order Distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribusi Donasi</CardTitle>
            <CardDescription>Berdasarkan status donasi di seluruh platform.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {donationStats.map((item) => {
              const config = STAT_CONFIG[item.key] ?? STAT_CONFIG.available;
              return (
                <div key={item.key} className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn("flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold", config.color)}
                    >
                      {config.icon ? <config.icon className="size-4" /> : null}
                    </span>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground tabular-nums">{item.value}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribusi Pesanan</CardTitle>
            <CardDescription>Berdasarkan status order di seluruh platform.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {orderStats.map((item) => {
              const config = STAT_CONFIG[item.key] ?? STAT_CONFIG.available;
              return (
                <div key={item.key} className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn("flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold", config.color)}
                    >
                      {config.icon ? <config.icon className="size-4" /> : null}
                    </span>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground tabular-nums">{item.value}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Aksi Cepat Admin</CardTitle>
          <CardDescription>Tindakan administratif yang sering dilakukan.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <Link href="/admin/users?role=partner&verified=false" className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border bg-card hover:bg-muted transition-colors">
            <ShieldCheck className="size-5" aria-hidden="true" />
            <span className="text-sm font-medium text-foreground">Verifikasi Mitra</span>
          </Link>
          <Link href="/admin/donations" className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border bg-card hover:bg-muted transition-colors">
            <Package className="size-5" aria-hidden="true" />
            <span className="text-sm font-medium text-foreground">Pantau Donasi</span>
          </Link>
          <Link href="/admin/orders" className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border bg-card hover:bg-muted transition-colors">
            <ShoppingBag className="size-5" aria-hidden="true" />
            <span className="text-sm font-medium text-foreground">Pantau Pesanan</span>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function cn(...classes: (string | undefined | null | boolean)[]) {
  return classes.filter(Boolean).join(" ");
}
