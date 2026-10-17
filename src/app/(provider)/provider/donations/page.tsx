"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Search,
  Plus,
  XCircle,
  Package,
} from "lucide-react";
import Link from "next/link";

interface Donation {
  id: string;
  food_name: string;
  category: string;
  quantity: number;
  unit: string;
  status: "available" | "claimed" | "delivered" | "cancelled";
  expiry_time: string;
  created_at: string;
}

export default function DonationsPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const supabase = useMemo(() => createClient(), []);

  const categories = [
    "Makanan Berat",
    "Roti/Kue",
    "Minuman",
    "Buah/Sayur",
    "Lainnya",
  ];

  const fetchDonations = useCallback(async (isActive: () => boolean = () => true) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!isActive() || !user) return;

      const query = supabase
        .from("donations")
        .select("*")
        .eq("provider_id", user.id)
        .order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      if (!isActive()) return;
      if (data) {
        setDonations(data as Donation[]);
      }
    } catch (error) {
      if (isActive()) {
        toast.error("Gagal memuat daftar donasi");
        console.error("Donations error:", error);
      }
    } finally {
      if (isActive()) {
        setIsLoading(false);
      }
    }
  }, [supabase]);

  useEffect(() => {
    let isActive = true;
    const timeout = setTimeout(() => {
      void fetchDonations(() => isActive);
    }, 0);

    return () => {
      isActive = false;
      clearTimeout(timeout);
    };
  }, [fetchDonations]);

  const filteredDonations = donations.filter((d) => {
    const matchesSearch = d.food_name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || d.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" || d.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleCancel = async (id: string) => {
    if (!window.confirm("Yakin ingin membatalkan donasi ini?")) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).rpc("cancel_donation", {
        p_donation_id: id,
      });
      if (error) throw error;
      toast.success("Donasi berhasil dibatalkan");
      fetchDonations();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || "Gagal membatalkan donasi");
      } else {
        toast.error("Gagal membatalkan donasi");
      }
    }
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-[28px] font-normal leading-none tracking-tight text-foreground">
            Kelola Donasi
          </h1>
          <p className="mt-2 max-w-[60ch] text-sm leading-6 text-muted-foreground">
            Lihat dan kelola semua donasi makanan Anda — pencarian dan filter
            tetap di perangkat Anda, sumber data tetap milik Anda.
          </p>
        </div>
        <Link href="/provider/donations/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Buat Donasi Baru
          </Button>
        </Link>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama makanan..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex-1 sm:w-64">
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value ?? "all")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="available">Tersedia</SelectItem>
                  <SelectItem value="claimed">Diklaim</SelectItem>
                  <SelectItem value="delivered">Disalurkan</SelectItem>
                  <SelectItem value="cancelled">Dibatalkan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 sm:w-64">
              <Select
                value={categoryFilter}
                onValueChange={(value) => setCategoryFilter(value ?? "all")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-2xl">
        <CardContent className="p-0">
          {filteredDonations.length === 0 ? (
            <div className="py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted text-muted-foreground">
                <Package className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-heading text-[18px] text-foreground">
                Tidak ada donasi
              </h3>
              <p className="mx-auto mt-1 max-w-[36ch] text-sm leading-6 text-muted-foreground">
                Tidak ada donasi yang cocok dengan filter Anda. Sesuaikan
                pencarian atau buat donasi baru.
              </p>
              <div className="mt-6">
                <Link href="/provider/donations/new">
                  <Button variant="outline" className="rounded-full">
                    Buat Donasi Baru
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-muted/20">
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      Nama Makanan
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      Kategori
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      Jumlah
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      Batas Kelayakan
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDonations.map((donation) => {
                    const expiry = new Date(donation.expiry_time);
                    const today = new Date();
                    const diffDays = Math.ceil(
                      (expiry.getTime() - today.getTime()) /
                        (1000 * 60 * 60 * 24),
                    );
                    const isExpired = diffDays < 0;

                    return (
                      <tr
                        key={donation.id}
                        className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-4 py-3.5">
                          <div className="font-medium text-foreground">
                            {donation.food_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(donation.created_at).toLocaleDateString(
                              "id-ID",
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-muted-foreground">
                          {donation.category}
                        </td>
                        <td className="px-4 py-3.5 text-sm tabular-nums">
                          {donation.quantity} {donation.unit}
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge
                            status={donation.status}
                            type="donation"
                          />
                        </td>
                        <td className="px-4 py-3.5 text-sm">
                          <span
                            className={`font-medium ${isExpired ? "text-destructive" : "text-muted-foreground"}`}
                          >
                            {isExpired
                              ? "Kedaluwarsa"
                              : `${diffDays} hari lagi`}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/provider/donations/${donation.id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 rounded-full p-0"
                              >
                                <span className="sr-only">Lihat detail</span>
                                <Package className="h-4 w-4" />
                              </Button>
                            </Link>
                            {donation.status === "available" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 rounded-full p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => handleCancel(donation.id)}
                              >
                                <span className="sr-only">Batalkan</span>
                                <XCircle className="h-4 w-4" />
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
        </CardContent>
      </Card>
    </div>
  );
}
