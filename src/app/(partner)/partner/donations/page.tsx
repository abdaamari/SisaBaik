"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Package, Search } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { ChoiceChips } from "@/components/ui/choice-chips";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DonationCard } from "@/components/ui/donation-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { PageLoader } from "@/components/ui/page-loader";
import { DONATION_CATEGORIES } from "@/lib/donation-options";
import { getProviderName, type ProfileRef } from "@/lib/format";

interface PartnerDonation {
  id: string;
  food_name: string;
  category: string;
  quantity: number;
  unit: string;
  status: string;
  expiry_time: string;
  pickup_address: string;
  description: string | null;
  created_at: string;
  profiles: ProfileRef;
}

type SortKey = "urgent" | "newest";

const ALL = "all";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "urgent", label: "Paling mendesak" },
  { value: "newest", label: "Terbaru" },
];

export default function PartnerDonationsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [donations, setDonations] = useState<PartnerDonation[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>(ALL);
  // Time is what matters for cooked food, so the soonest-expiring donation comes first.
  const [sort, setSort] = useState<SortKey>("urgent");
  const [claimTarget, setClaimTarget] = useState<PartnerDonation | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: profile } = (await supabase.from("profiles").select("is_verified").eq("id", user.id).single()) as { data: { is_verified: boolean } | null };
      setIsVerified(profile ? !!profile.is_verified : false);
      const { data, error } = await supabase
        .from("donations")
        .select("id, food_name, category, quantity, unit, status, expiry_time, pickup_address, description, created_at, profiles!donations_provider_id_fkey(organization_name)")
        .eq("status", "available")
        .gt("expiry_time", new Date().toISOString())
        .order("created_at", { ascending: false });
      if (error) throw error;
      setDonations((data as unknown as PartnerDonation[]) ?? []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memuat donasi";
      toast.error(msg);
    } finally { setIsLoading(false); }
  }, [supabase, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchData();
  }, [fetchData]);

  const categoryOptions = useMemo(() => {
    const countFor = (name: string) => donations.filter((d) => d.category === name).length;
    return [
      { value: ALL, label: "Semua", count: donations.length },
      ...DONATION_CATEGORIES.map((name) => ({ value: name as string, label: name as string, count: countFor(name) })),
    ];
  }, [donations]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = donations.filter((d) => {
      const matchesSearch =
        !term || d.food_name.toLowerCase().includes(term) || getProviderName(d.profiles).toLowerCase().includes(term);
      const matchesCategory = category === ALL || d.category === category;
      return matchesSearch && matchesCategory;
    });
    return [...filtered].sort((a, b) =>
      sort === "urgent"
        ? new Date(a.expiry_time).getTime() - new Date(b.expiry_time).getTime()
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [donations, search, category, sort]);

  const handleClaim = async () => {
    const target = claimTarget;
    if (!target) return;
    if (isVerified === false) { toast.error("Akun belum diverifikasi — belum dapat mengklaim."); return; }
    setClaimingId(target.id);
    try {
      const { data, error } = (await (supabase as unknown as { rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: { success: boolean; error?: string }; error: Error | null }> }).rpc("claim_donation", { p_donation_id: target.id }));
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error ?? "Gagal mengklaim donasi");
      toast.success("Donasi berhasil diklaim — cek Pesanan saya.");
      setClaimTarget(null);
      void fetchData();
      router.push("/partner/orders");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengklaim";
      toast.error(msg);
    } finally { setClaimingId(null); }
  };

  const hasFilters = search.trim() !== "" || category !== ALL;

  if (isLoading) {
    return <PageLoader variant="list" label="Memuat donasi tersedia" />;
  }

  return (
    <div>
      <PageHeader
        title="Donasi tersedia"
        description="Makanan layak dari penyedia, diurutkan dari yang waktunya paling sempit."
        action={
          <Link href="/partner/orders" className={buttonVariants({ variant: "outline", size: "lg" })}>
            Pesanan saya
          </Link>
        }
      />

      <div className="space-y-6">
        {isVerified === false && (
          <Notice title="Akun Anda belum diverifikasi">
            Anda bisa melihat donasi, tetapi tombol klaim aktif setelah admin menyetujui akun Anda.
          </Notice>
        )}

        <div className="space-y-4">
          <div className="relative sm:max-w-md">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              aria-label="Cari makanan atau penyedia"
              placeholder="Cari makanan atau penyedia"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <ChoiceChips label="Filter kategori" value={category} onChange={setCategory} options={categoryOptions} />
            <ChoiceChips label="Urutkan" value={sort} onChange={setSort} options={SORT_OPTIONS} />
          </div>
        </div>

        <p className="text-sm text-muted-foreground" aria-live="polite">
          <span className="font-semibold text-foreground tabular-nums">{visible.length}</span> donasi ditemukan
        </p>

        {visible.length === 0 ? (
          <EmptyState
            icon={<Package className="size-6" />}
            title={donations.length === 0 ? "Belum ada donasi tersedia" : "Tidak ada yang cocok"}
            description={
              donations.length === 0
                ? "Donasi baru muncul di sini begitu penyedia mencatatnya. Muat ulang untuk memeriksa."
                : "Ubah kata kunci atau kategori untuk melihat lebih banyak donasi."
            }
            action={
              hasFilters ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setCategory(ALL);
                  }}
                >
                  Hapus filter
                </Button>
              ) : (
                <Button variant="outline" onClick={() => void fetchData()}>
                  Muat ulang
                </Button>
              )
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((d) => (
              <DonationCard
                key={d.id}
                href={`/partner/donations/${d.id}`}
                foodName={d.food_name}
                category={d.category}
                quantity={d.quantity}
                unit={d.unit}
                providerName={getProviderName(d.profiles)}
                expiryTime={d.expiry_time}
                address={d.pickup_address}
                description={d.description}
                onClaim={() => setClaimTarget(d)}
                claimDisabled={isVerified === false}
                claimHint={isVerified === false ? "Menunggu verifikasi admin" : undefined}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={claimTarget !== null}
        onOpenChange={(open) => {
          if (!open) setClaimTarget(null);
        }}
        title="Klaim donasi ini?"
        description={
          claimTarget
            ? `Anda akan bertanggung jawab menjemput "${claimTarget.food_name}" dari ${getProviderName(claimTarget.profiles)}.`
            : undefined
        }
        confirmLabel="Klaim donasi"
        loading={claimingId !== null}
        onConfirm={handleClaim}
      />
    </div>
  );
}
