"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Clock, MapPin, Package, Tag, Hash, Calendar, Loader2, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";

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
  profiles: { organization_name: string } | { organization_name: string }[] | null;
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

function getProviderName(profiles: PartnerDonationDetail["profiles"]): string {
  if (!profiles) return "Penyedia";
  if (Array.isArray(profiles)) return profiles[0]?.organization_name ?? "Penyedia";
  return profiles.organization_name ?? "Penyedia";
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
    if (!window.confirm("Yakin ingin mengklaim donasi ini?")) return;
    setClaiming(true);
    try {
      const { data, error } = await (supabase as unknown as { rpc: (n: string, a: Record<string, string>) => Promise<{ data: { success: boolean; error?: string }; error: unknown }> }).rpc("claim_donation", { p_donation_id: donation.id }) as { data: { success: boolean; error?: string } | null; error: unknown };
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error ?? "Gagal mengklaim");
      toast.success("Donasi berhasil diklaim!");
      router.push("/partner/orders");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengklaim donasi";
      toast.error(msg);
    } finally { setClaiming(false); }
  };

  if (isLoading) return <div className="flex min-h-[400px] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" /></div>;
  if (notFound || !donation) return <div className="space-y-6"><EmptyState icon={<Package className="h-5 w-5" />} title="Donasi tidak tersedia" description="Donasi tidak ditemukan, sudah kedaluwarsa, atau tidak dapat diakses untuk mitra saat ini." action={<Link href="/partner/donations"><Button variant="outline" className="rounded-full"><ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke donasi</Button></Link>} /></div>;

  const meta = getExpiryMeta(donation.expiry_time);
  const canClaim = donation.status === "available" && new Date(donation.expiry_time) > new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/partner/donations"><Button variant="outline" size="sm" className="rounded-full"><ArrowLeft className="h-4 w-4" /> Kembali</Button></Link>
        <div className="min-w-0"><h1 className="truncate font-heading text-[28px] font-normal leading-none tracking-tight text-foreground">{donation.food_name}</h1><p className="mt-1.5 text-sm leading-6 text-muted-foreground">Detail donasi — klaim dijaga oleh RPC dan RLS.</p></div>
      </div>
      {isVerified === false && (<Card className="rounded-2xl border-amber-200 bg-amber-50/60"><CardContent className="flex items-start gap-3 p-4 text-sm leading-6 text-amber-800"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /> Akun belum diverifikasi — Anda dapat melihat detail, tetapi klaim akan aktif setelah admin menyetujui.</CardContent></Card>)}
      <Card className="overflow-hidden rounded-2xl">
        <CardHeader className="border-b border-border bg-muted/20"><div className="flex flex-wrap items-start justify-between gap-4"><div><CardTitle className="flex items-center gap-2 font-heading text-[20px] font-normal"><Package className="h-5 w-5 text-primary" /> {donation.food_name}</CardTitle><CardDescription className="mt-1">{donation.category} • {donation.quantity} {donation.unit} • {getProviderName(donation.profiles)}</CardDescription></div><StatusBadge status={donation.status} type="donation" /></div></CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/30"><Tag className="h-4 w-4 text-muted-foreground" /></div><div><p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Kategori</p><p className="mt-1 text-sm font-medium text-foreground">{donation.category}</p></div></div>
              <div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/30"><Hash className="h-4 w-4 text-muted-foreground" /></div><div><p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Kuantitas</p><p className="mt-1 text-sm font-medium tabular-nums text-foreground">{donation.quantity} {donation.unit}</p></div></div>
              <div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/30"><Clock className="h-4 w-4 text-muted-foreground" /></div><div><p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Batas kelayakan</p><p className="mt-1 text-sm text-foreground">{new Date(donation.expiry_time).toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p><span className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${meta.tone}`}>{meta.label}</span></div></div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/30"><MapPin className="h-4 w-4 text-muted-foreground" /></div><div><p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Alamat pengambilan</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-foreground">{donation.pickup_address}</p></div></div>
              <div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/30"><Calendar className="h-4 w-4 text-muted-foreground" /></div><div><p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Dibuat</p><p className="mt-1 text-sm text-foreground">{new Date(donation.created_at).toLocaleString("id-ID")}</p><p className="mt-1 text-xs text-muted-foreground">Penyedia: {getProviderName(donation.profiles)}</p></div></div>
            </div>
          </div>
          {donation.description && (<div className="mt-6 rounded-xl border border-border bg-muted/20 p-4"><p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Deskripsi kondisi</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">{donation.description}</p></div>)}
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-6">
            {canClaim ? (<Button className="rounded-full" onClick={handleClaim} disabled={isVerified === false || claiming}>{claiming ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Klaim Donasi</Button>) : (<p className="text-xs text-muted-foreground">Klaim hanya untuk status Tersedia yang belum kedaluwarsa — aturan dijaga RLS & RPC.</p>)}
            <Link href="/partner/donations" className="ml-auto"><Button variant="outline" className="rounded-full">Kembali ke daftar</Button></Link>
          </div>
          <div className="mt-6 rounded-xl border border-dashed border-border bg-background p-4"><p className="text-xs font-medium text-muted-foreground">Foto & peta pickup — konsep desain tidak aktif pada Fase 3. Tidak ada upload, izin lokasi, atau map API.</p></div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PartnerDonationDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        </div>
      }
    >
      <PartnerDonationDetailInner />
    </Suspense>
  );
}
