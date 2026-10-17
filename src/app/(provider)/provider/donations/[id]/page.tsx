"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Calendar, MapPin, Package, Clock, Tag, Hash, XCircle, Loader2 } from "lucide-react";

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

function getExpiryMeta(expiryTime: string) {
  const expiry = new Date(expiryTime);
  const today = new Date();
  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: "Kedaluwarsa", tone: "bg-destructive/10 text-destructive border-destructive/20" };
  if (diffDays <= 1) return { label: "Segera kedaluwarsa", tone: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/30" };
  if (diffDays <= 3) return { label: `${diffDays} hari lagi`, tone: "bg-amber-50 text-amber-800 border-amber-200" };
  return { label: `${diffDays} hari lagi`, tone: "bg-muted text-muted-foreground border-border" };
}

function ProviderDonationDetailInner() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [donation, setDonation] = useState<DonationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
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
    const t = setTimeout(() => {
      void fetchDetail(() => isActive);
    }, 0);
    let isActive = true;

    return () => {
      isActive = false;
      clearTimeout(t);
    };
  }, [fetchDetail]);

  const handleCancel = async () => {
    if (!donation || donation.status !== "available") return;
    if (!window.confirm("Yakin ingin membatalkan donasi ini?")) return;
    setIsCancelling(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).rpc("cancel_donation", { p_donation_id: donation.id });
      if (error) throw error;
      toast.success("Donasi berhasil dibatalkan"); fetchDetail();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal membatalkan donasi");
    } finally { setIsCancelling(false); }
  };

  if (isLoading) {
    return <div className="flex min-h-[400px] items-center justify-center bg-background"><div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" /></div>;
  }
  if (notFound) {
    return (
      <div className="space-y-6">
        <Link href="/provider/donations" className="inline-flex"><Button variant="outline" size="sm" className="rounded-full"><ArrowLeft className="h-4 w-4" /> Kembali ke daftar</Button></Link>
        <EmptyState title="Donasi tidak ditemukan" description="Donasi tidak ditemukan atau Anda tidak memiliki akses. Pesan disamakan untuk menjaga privasi pemilik lain." icon={<Package className="h-5 w-5" />} action={<Link href="/provider/donations"><Button className="rounded-full">Kembali ke daftar</Button></Link>} />
      </div>
    );
  }
  if (errorMsg || !donation) {
    return (
      <div className="space-y-6">
        <Link href="/provider/donations" className="inline-flex"><Button variant="outline" size="sm" className="rounded-full"><ArrowLeft className="h-4 w-4" /> Kembali</Button></Link>
        <Card className="rounded-2xl border-destructive/20"><CardContent className="p-8 text-center"><p className="text-sm text-destructive">{errorMsg ?? "Gagal memuat detail."}</p><Button variant="outline" className="mt-4 rounded-full" onClick={() => void fetchDetail()}>Coba lagi</Button></CardContent></Card>
      </div>
    );
  }
  const expiryMeta = getExpiryMeta(donation.expiry_time);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/provider/donations">
          <Button variant="outline" size="sm" className="rounded-full">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Button>
        </Link>
        <div className="min-w-0">
          <h1 className="font-heading text-[28px] font-normal leading-none tracking-tight text-foreground truncate">
            {donation.food_name}
          </h1>
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
            Detail donasi milik akun Anda — hanya dapat diakses oleh pemilik.
          </p>
        </div>
      </div>

      <Card className="overflow-hidden rounded-2xl">
        <CardHeader className="border-b border-border bg-muted/20">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 font-heading text-[20px] font-normal">
                <Package className="h-5 w-5 text-primary" /> {donation.food_name}
              </CardTitle>
              <CardDescription className="mt-1">
                {donation.category} • {donation.quantity} {donation.unit} • Dibuat{" "}
                {new Date(donation.created_at).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </CardDescription>
            </div>
            <StatusBadge status={donation.status} type="donation" />
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/30">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Kategori
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">{donation.category}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/30">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Kuantitas
                  </p>
                  <p className="mt-1 text-sm font-medium tabular-nums text-foreground">
                    {donation.quantity} {donation.unit}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/30">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Batas kelayakan
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {new Date(donation.expiry_time).toLocaleString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <span
                    className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${expiryMeta.tone}`}
                  >
                    {expiryMeta.label}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/30">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Alamat pengambilan
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-foreground">
                    {donation.pickup_address}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/30">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Tanggal dibuat
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {new Date(donation.created_at).toLocaleString("id-ID")}
                  </p>
                  {donation.updated_at && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Diperbarui {new Date(donation.updated_at).toLocaleString("id-ID")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {donation.description && (
            <div className="mt-6 rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Deskripsi kondisi
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">
                {donation.description}
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-6">
            {donation.status === "available" ? (
              <Button
                variant="outline"
                className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={handleCancel}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                Batalkan donasi
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">
                Aksi batal hanya tersedia saat status Tersedia — aturan bisnis dipertahankan via RPC.
              </p>
            )}
            <Link href="/provider/donations" className="ml-auto">
              <Button variant="outline" className="rounded-full">
                Kembali ke daftar
              </Button>
            </Link>
          </div>

          <div className="mt-6 rounded-xl border border-dashed border-border bg-background p-4">
            <p className="text-xs font-medium text-muted-foreground">
              Foto & peta pickup — konsep desain tidak aktif pada Fase 2. Tidak ada upload, izin lokasi,
              atau map API.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProviderDonationDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        </div>
      }
    >
      <ProviderDonationDetailInner />
    </Suspense>
  );
}
