"use client";

import { Suspense, useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Package, Plus, Search } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { ChoiceChips } from "@/components/ui/choice-chips";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DonationCard } from "@/components/ui/donation-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { PageLoader } from "@/components/ui/page-loader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { DONATION_CATEGORIES } from "@/lib/donation-options";

type DonationStatus = "available" | "claimed" | "delivered" | "cancelled";
type StatusFilter = "all" | DonationStatus;
type SortKey = "newest" | "urgent";

interface Donation {
  id: string;
  food_name: string;
  category: string;
  quantity: number;
  unit: string;
  status: DonationStatus;
  expiry_time: string;
  created_at: string;
  pickup_address?: string;
  description?: string | null;
}

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "available", label: "Tersedia" },
  { value: "claimed", label: "Diklaim" },
  { value: "delivered", label: "Disalurkan" },
  { value: "cancelled", label: "Dibatalkan" },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Terbaru" },
  { value: "urgent", label: "Paling mendesak" },
];

// A sentinel that doubles as the visible label, so the select always shows readable text.
const ALL_CATEGORIES = "Semua kategori";

function parseStatus(value: string | null): StatusFilter {
  return STATUS_OPTIONS.some((option) => option.value === value) ? (value as StatusFilter) : "all";
}

const stageRank = (status: DonationStatus) => (status === "available" ? 0 : status === "claimed" ? 1 : 2);

function DonationsContent({ initialStatus }: { initialStatus: StatusFilter }) {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(initialStatus);
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL_CATEGORIES);
  const [sort, setSort] = useState<SortKey>("newest");
  const [cancelTarget, setCancelTarget] = useState<Donation | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const supabase = useMemo(() => createClient(), []);

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

  const counts = useMemo(() => {
    const result: Record<StatusFilter, number> = { all: donations.length, available: 0, claimed: 0, delivered: 0, cancelled: 0 };
    for (const donation of donations) result[donation.status] += 1;
    return result;
  }, [donations]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = donations.filter((d) => {
      const matchesSearch = !term || d.food_name.toLowerCase().includes(term);
      const matchesStatus = statusFilter === "all" || d.status === statusFilter;
      const matchesCategory = categoryFilter === ALL_CATEGORIES || d.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });

    return [...filtered].sort((a, b) =>
      sort === "newest"
        ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        : stageRank(a.status) - stageRank(b.status) ||
          new Date(a.expiry_time).getTime() - new Date(b.expiry_time).getTime(),
    );
  }, [donations, search, statusFilter, categoryFilter, sort]);

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    setIsCancelling(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).rpc("cancel_donation", {
        p_donation_id: cancelTarget.id,
      });
      if (error) throw error;
      toast.success("Donasi berhasil dibatalkan");
      setCancelTarget(null);
      void fetchDonations();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || "Gagal membatalkan donasi");
      } else {
        toast.error("Gagal membatalkan donasi");
      }
    } finally {
      setIsCancelling(false);
    }
  };

  const hasFilters = search.trim() !== "" || statusFilter !== "all" || categoryFilter !== ALL_CATEGORIES;

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setCategoryFilter(ALL_CATEGORIES);
  };

  if (isLoading) {
    return <PageLoader variant="list" label="Memuat donasi" />;
  }

  return (
    <div>
      <PageHeader
        title="Donasi saya"
        description="Semua makanan yang pernah Anda catat, lengkap dengan sisa waktu dan tahapnya."
        action={
          <Link href="/provider/donations/new" className={buttonVariants({ size: "lg" })}>
            <Plus aria-hidden="true" />
            Buat donasi
          </Link>
        }
      />

      {donations.length === 0 ? (
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
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  aria-label="Cari nama makanan"
                  placeholder="Cari nama makanan"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value ?? ALL_CATEGORIES)}>
                <SelectTrigger aria-label="Filter kategori" className="w-full sm:w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_CATEGORIES}>{ALL_CATEGORIES}</SelectItem>
                  {DONATION_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <ChoiceChips
                label="Filter status"
                value={statusFilter}
                onChange={setStatusFilter}
                options={STATUS_OPTIONS.map((option) => ({ ...option, count: counts[option.value] }))}
              />
              <ChoiceChips label="Urutkan" value={sort} onChange={setSort} options={SORT_OPTIONS} />
            </div>
          </div>

          <p className="text-sm text-muted-foreground" aria-live="polite">
            Menampilkan <span className="font-semibold text-foreground tabular-nums">{visible.length}</span> dari{" "}
            <span className="tabular-nums">{donations.length}</span> donasi
          </p>

          {visible.length === 0 ? (
            <EmptyState
              title="Tidak ada yang cocok"
              description="Ubah kata kunci atau filter, atau tampilkan semua donasi."
              icon={<Search className="size-6" />}
              action={
                hasFilters ? (
                  <Button variant="outline" onClick={resetFilters}>
                    Hapus filter
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((donation) => (
                <DonationCard
                  key={donation.id}
                  href={`/provider/donations/${donation.id}`}
                  foodName={donation.food_name}
                  category={donation.category}
                  quantity={donation.quantity}
                  unit={donation.unit}
                  expiryTime={donation.expiry_time}
                  address={donation.pickup_address}
                  description={donation.description}
                  status={donation.status}
                  showMeter={donation.status === "available"}
                  extraAction={
                    donation.status === "available" ? (
                      <Button variant="destructive" onClick={() => setCancelTarget(donation)}>
                        Batalkan
                      </Button>
                    ) : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={cancelTarget !== null}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null);
        }}
        title="Batalkan donasi ini?"
        description={
          cancelTarget
            ? `"${cancelTarget.food_name}" tidak akan lagi muncul di daftar mitra. Pembatalan tidak bisa diurungkan.`
            : undefined
        }
        confirmLabel="Batalkan donasi"
        cancelLabel="Jangan batalkan"
        tone="danger"
        loading={isCancelling}
        onConfirm={handleConfirmCancel}
      />
    </div>
  );
}

// The status in the address (?status=claimed) picks the starting filter.
// Keying by it remounts the list when the link changes, so the filter always matches the address.
function DonationsRoute() {
  const searchParams = useSearchParams();
  const initialStatus = parseStatus(searchParams.get("status"));
  return <DonationsContent key={initialStatus} initialStatus={initialStatus} />;
}

export default function DonationsPage() {
  return (
    <Suspense fallback={<PageLoader variant="list" label="Memuat donasi" />}>
      <DonationsRoute />
    </Suspense>
  );
}
