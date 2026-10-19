"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Building2, Calendar, Clock, Hash, Loader2, MapPin, Package, Tag } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { FreshnessMeter } from "@/components/ui/freshness-meter";
import { InfoItem } from "@/components/ui/info-item";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { PageLoader } from "@/components/ui/page-loader";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime, getProviderName, type ProfileRef } from "@/lib/format";

interface PartnerDonationDetail {
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

function PartnerDonationDetailInner() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [donation, setDonation] = useState<PartnerDonationDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setNotFound(false);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("is_verified").eq("id", user.id).single() as { data: { is_verified: boolean } | null };
      setIsVerified(profile ? !!profile.is_verified : false);
      const { data, error } = await supabase.from("donations").select("id, food_name, category, quantity, unit, status, expiry_time, pickup_address, description, created_at, profiles!donations_provider_id_fkey(organization_name)").eq("id", id).single();
      if (error || !data) { setNotFound(true); return; }
      const row = data as unknown as PartnerDonationDetail;
      if (row.status !== "available" || new Date(row.expiry_time) <= new Date()) {
        const { data: order } = await supabase.from("orders").select("id").eq("donation_id", id).eq("partner_id", user.id).maybeSingle();
        if (!order) { setNotFound(true); return; }
      }
      setDonation(row);
    } catch {
      toast.error("Gagal memuat detail donasi");
      setNotFound(true);
    } finally { setIsLoading(false); }
  }, [id, supabase, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchDetail();
  }, [fetchDetail]);

  const handleClaim = async () => {
    if (!donation || !isVerified) return;
    setClaiming(true);
    try {
      const { data, error } = await (supabase as unknown as { rpc: (n: string, a: Record<string, string>) => Promise<{ data: { success: boolean; error?: string }; error: unknown }> }).rpc("claim_donation", { p_donation_id: donation.id }) as { data: { success: boolean; error?: string } | null; error: unknown };
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error ?? "Gagal mengklaim");
      toast.success("Donasi berhasil diklaim!");
      setConfirmOpen(false);
      router.push("/partner/orders");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengklaim donasi";
      toast.error(msg);
    } finally { setClaiming(false); }
  };

  if (isLoading) return <PageLoader variant="detail" label="Memuat detail donasi" />;

  if (notFound || !donation) {
    return (
      <div>
        <PageHeader title="Donasi tidak tersedia" backHref="/partner/donations" backLabel="Donasi tersedia" />
        <EmptyState
          icon={<Package className="size-6" />}
          title="Donasi tidak tersedia"
          description="Donasi ini tidak ditemukan, sudah kedaluwarsa, atau sudah diklaim mitra lain."
          action={
            <Link href="/partner/donations" className={buttonVariants()}>
              Lihat donasi tersedia
            </Link>
          }
        />
      </div>
    );
  }

  const providerName = getProviderName(donation.profiles);
  const canClaim = donation.status === "available" && new Date(donation.expiry_time) > new Date();

  return (
    <div>
      <PageHeader
        title={donation.food_name}
        description={`${donation.category}, dari ${providerName}`}
        backHref="/partner/donations"
        backLabel="Donasi tersedia"
        action={<StatusBadge status={donation.status} />}
      />

      <div className="space-y-6">
        {isVerified === false && (
          <Notice title="Akun Anda belum diverifikasi">
            Anda bisa melihat detail, tetapi klaim aktif setelah admin menyetujui akun Anda.
          </Notice>
        )}

        <Card>
          <CardContent className="space-y-8">
            {donation.status === "available" && (
              <section aria-label="Sisa waktu">
                <p className="mb-2 text-sm font-semibold text-muted-foreground">Sisa waktu layak konsumsi</p>
                <FreshnessMeter expiryTime={donation.expiry_time} clock size="lg" />
              </section>
            )}

            <dl className="grid gap-6 sm:grid-cols-2">
              <InfoItem icon={Building2} label="Penyedia">
                {providerName}
              </InfoItem>
              <InfoItem icon={Tag} label="Kategori">
                {donation.category}
              </InfoItem>
              <InfoItem icon={Hash} label="Jumlah">
                <span className="tabular-nums">
                  {donation.quantity} {donation.unit}
                </span>
              </InfoItem>
              <InfoItem icon={Clock} label="Batas kelayakan">
                {formatDateTime(donation.expiry_time)}
              </InfoItem>
              <InfoItem icon={MapPin} label="Alamat pengambilan" className="sm:col-span-2">
                <span className="whitespace-pre-wrap">{donation.pickup_address}</span>
              </InfoItem>
              <InfoItem icon={Calendar} label="Dicatat">
                {formatDateTime(donation.created_at)}
              </InfoItem>
            </dl>

            {donation.description && (
              <section aria-label="Deskripsi kondisi" className="rounded-xl bg-muted p-4">
                <p className="text-xs font-semibold text-muted-foreground">Kondisi makanan</p>
                <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap text-foreground">{donation.description}</p>
              </section>
            )}

            <div className="flex flex-wrap items-center gap-3 border-t border-border pt-6">
              {canClaim ? (
                <Button size="lg" onClick={() => setConfirmOpen(true)} disabled={isVerified === false || claiming}>
                  {claiming && <Loader2 className="animate-spin" aria-hidden="true" />}
                  Klaim donasi
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">Klaim hanya untuk donasi yang masih tersedia dan belum kedaluwarsa.</p>
              )}
              <Link href="/partner/donations" className={buttonVariants({ variant: "outline", size: "lg", className: "sm:ml-auto" })}>
                Kembali ke daftar
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Klaim donasi ini?"
        description={`Anda akan bertanggung jawab menjemput "${donation.food_name}" dari ${providerName}.`}
        confirmLabel="Klaim donasi"
        loading={claiming}
        onConfirm={handleClaim}
      />
    </div>
  );
}

export default function PartnerDonationDetailPage() {
  return (
    <Suspense fallback={<PageLoader variant="detail" label="Memuat detail donasi" />}>
      <PartnerDonationDetailInner />
    </Suspense>
  );
}
