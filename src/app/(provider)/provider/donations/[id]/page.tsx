"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Calendar, Clock, Hash, MapPin, Package, Tag, XCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { FreshnessMeter } from "@/components/ui/freshness-meter";
import { InfoItem } from "@/components/ui/info-item";
import { PageHeader } from "@/components/ui/page-header";
import { PageLoader } from "@/components/ui/page-loader";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatusTimeline, getDonationTimeline } from "@/components/ui/status-timeline";
import { createClient } from "@/lib/supabase/client";
import { formatDate, formatDateTime } from "@/lib/format";

type DonationStatus = "available" | "claimed" | "delivered" | "cancelled";

interface DonationDetail {
  id: string;
  food_name: string;
  category: string;
  quantity: number;
  unit: string;
  status: DonationStatus;
  expiry_time: string;
  pickup_address: string;
  description: string | null;
  created_at: string;
  updated_at: string | null;
}

function ProviderDonationDetailInner() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [donation, setDonation] = useState<DonationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchDetail = useCallback(async (isActive: () => boolean = () => true) => {
    if (!id) {
      if (isActive()) setIsLoading(false);
      return;
    }

    if (isActive()) {
      setIsLoading(true);
      setErrorMsg(null);
      setNotFound(false);
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!isActive()) return;
      if (!user) { router.replace("/login"); return; }
      const { data, error } = await supabase.from("donations").select("id, food_name, category, quantity, unit, status, expiry_time, pickup_address, description, created_at, updated_at").eq("id", id).eq("provider_id", user.id).single();
      if (!isActive()) return;
      if (error || !data) { setNotFound(true); setDonation(null); return; }
      setDonation(data as DonationDetail);
    } catch (err: unknown) {
      if (!isActive()) return;
      const msg = err instanceof Error ? err.message : "Gagal memuat detail donasi";
      setErrorMsg(msg); toast.error(msg);
    } finally { if (isActive()) setIsLoading(false); }
  }, [id, supabase, router]);

  useEffect(() => {
    let isActive = true;
    const t = setTimeout(() => {
      void fetchDetail(() => isActive);
    }, 0);

    return () => {
      isActive = false;
      clearTimeout(t);
    };
  }, [fetchDetail]);

  const handleCancel = async () => {
    if (!donation || donation.status !== "available") return;
    setIsCancelling(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).rpc("cancel_donation", { p_donation_id: donation.id });
      if (error) throw error;
      toast.success("Donasi berhasil dibatalkan");
      setConfirmOpen(false);
      void fetchDetail();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal membatalkan donasi");
    } finally { setIsCancelling(false); }
  };

  if (isLoading) {
    return <PageLoader variant="detail" label="Memuat detail donasi" />;
  }

  if (notFound) {
    return (
      <div>
        <PageHeader title="Donasi tidak ditemukan" backHref="/provider/donations" backLabel="Semua donasi" />
        <EmptyState
          title="Donasi tidak ditemukan"
          description="Donasi ini tidak ada, atau bukan milik akun Anda."
          icon={<Package className="size-6" />}
          action={
            <Link href="/provider/donations" className={buttonVariants()}>
              Kembali ke daftar
            </Link>
          }
        />
      </div>
    );
  }

  if (errorMsg || !donation) {
    return (
      <div>
        <PageHeader title="Detail donasi" backHref="/provider/donations" backLabel="Semua donasi" />
        <EmptyState
          title="Detail belum bisa dimuat"
          description={errorMsg ?? "Terjadi kesalahan saat memuat detail."}
          icon={<XCircle className="size-6" />}
          action={
            <Button variant="outline" onClick={() => void fetchDetail()}>
              Coba lagi
            </Button>
          }
        />
      </div>
    );
  }

  const isLive = donation.status === "available" || donation.status === "claimed";

  return (
    <div>
      <PageHeader
        title={donation.food_name}
        description={`${donation.category}, dicatat ${formatDate(donation.created_at)}`}
        backHref="/provider/donations"
        backLabel="Semua donasi"
        action={<StatusBadge status={donation.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <Card>
          <CardContent className="space-y-8">
            {isLive ? (
              <section aria-label="Sisa waktu">
                <p className="mb-2 text-sm font-semibold text-muted-foreground">Sisa waktu layak konsumsi</p>
                <FreshnessMeter expiryTime={donation.expiry_time} clock size="lg" />
              </section>
            ) : null}

            <dl className="grid gap-6 sm:grid-cols-2">
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
              <InfoItem icon={Calendar} label="Dicatat">
                {formatDateTime(donation.created_at)}
                {donation.updated_at && (
                  <span className="mt-0.5 block text-xs font-medium text-muted-foreground">
                    Diperbarui {formatDateTime(donation.updated_at)}
                  </span>
                )}
              </InfoItem>
              <InfoItem icon={MapPin} label="Alamat pengambilan" className="sm:col-span-2">
                <span className="whitespace-pre-wrap">{donation.pickup_address}</span>
              </InfoItem>
            </dl>

            {donation.description && (
              <section aria-label="Deskripsi kondisi" className="rounded-xl bg-muted p-4">
                <p className="text-xs font-semibold text-muted-foreground">Kondisi makanan</p>
                <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap text-foreground">{donation.description}</p>
              </section>
            )}

            <div className="flex flex-wrap items-center gap-3 border-t border-border pt-6">
              {donation.status === "available" ? (
                <Button variant="destructive" onClick={() => setConfirmOpen(true)} disabled={isCancelling}>
                  <XCircle aria-hidden="true" />
                  Batalkan donasi
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">Donasi hanya bisa dibatalkan selama masih tersedia.</p>
              )}
              <Link href="/provider/donations" className={buttonVariants({ variant: "outline", className: "sm:ml-auto" })}>
                Kembali ke daftar
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg font-bold">Perjalanan donasi</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusTimeline steps={getDonationTimeline(donation.status)} />
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Batalkan donasi ini?"
        description={`"${donation.food_name}" tidak akan lagi muncul di daftar mitra. Pembatalan tidak bisa diurungkan.`}
        confirmLabel="Batalkan donasi"
        cancelLabel="Jangan batalkan"
        tone="danger"
        loading={isCancelling}
        onConfirm={handleCancel}
      />
    </div>
  );
}

export default function ProviderDonationDetailPage() {
  return (
    <Suspense fallback={<PageLoader variant="detail" label="Memuat detail donasi" />}>
      <ProviderDonationDetailInner />
    </Suspense>
  );
}
