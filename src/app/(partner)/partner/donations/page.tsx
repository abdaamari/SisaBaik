"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Search, Package, Clock, MapPin, Loader2, Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

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

function getProviderName(profiles: PartnerDonation["profiles"]): string {
  if (!profiles) return "Penyedia";
  if (Array.isArray(profiles)) return profiles[0]?.organization_name ?? "Penyedia";
  return profiles.organization_name ?? "Penyedia";
}

const CATEGORIES = ["Semua", "Makanan Matang", "Bahan Mentah", "Roti & Kue", "Minuman", "Lainnya"];

export default function PartnerDonationsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [donations, setDonations] = useState<PartnerDonation[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Semua");
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

  const filtered = useMemo(() => {
    return donations.filter((d) => {
      const matchesSearch = !search || d.food_name.toLowerCase().includes(search.toLowerCase()) || getProviderName(d.profiles).toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "Semua" || d.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [donations, search, category]);

  const handleClaim = async (id: string) => {
    if (isVerified === false) { toast.error("Akun belum diverifikasi — belum dapat mengklaim."); return; }
    if (!window.confirm("Klaim donasi ini? Anda akan menjadi penanggung jawab penjemputan.")) return;
    setClaimingId(id);
    try {
      const { data, error } = (await (supabase as unknown as { rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: { success: boolean; error?: string }; error: Error | null }> }).rpc("claim_donation", { p_donation_id: id }));
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error ?? "Gagal mengklaim donasi");
      toast.success("Donasi berhasil diklaim — cek Pesanan saya.");
      fetchData();
      router.push("/partner/orders");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengklaim";
      toast.error(msg);
    } finally { setClaimingId(null); }
  };

  if (isLoading) {
    return (<div className="flex min-h-[400px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Donasi Tersedia" description="Jelajahi donasi layak konsumsi dari penyedia terverifikasi — pilih yang paling dekat dengan jadwal penjemputan Anda." action={<Link href="/partner/orders"><Button variant="outline" className="rounded-full">Pesanan saya</Button></Link>} />
      {isVerified === false && (<Card className="rounded-2xl border-amber-200 bg-amber-50/60"><CardContent className="p-4 text-sm leading-6 text-amber-800">Akun Anda belum diverifikasi. Anda dapat melihat donasi, tetapi tombol klaim akan nonaktif sampai admin menyetujui verifikasi.</CardContent></Card>)}
      <Card className="rounded-2xl"><CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="relative flex-1 sm:max-w-sm"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Cari makanan atau penyedia..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-11 rounded-xl pl-10" /></div><div className="flex items-center gap-3"><Filter className="h-4 w-4 text-muted-foreground" /><Select value={category} onValueChange={(v) => setCategory(v ?? "Semua")}><SelectTrigger className="h-11 w-[180px] rounded-xl"><SelectValue placeholder="Kategori" /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent></Select></div></CardContent></Card>
      {filtered.length === 0 ? (<Card className="rounded-2xl"><CardContent className="p-0"><EmptyState icon={<Package className="h-5 w-5" />} title="Belum ada donasi yang cocok" description="Coba ubah pencarian atau kategori, atau periksa kembali nanti." action={<Button variant="outline" onClick={fetchData} className="rounded-full">Muat ulang</Button>} /></CardContent></Card>) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((d) => {
            const meta = getExpiryMeta(d.expiry_time);
            return (
              <Card key={d.id} className="flex flex-col overflow-hidden rounded-2xl transition hover:shadow-sm">
                <CardHeader className="pb-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><CardTitle className="truncate font-heading text-[17px] font-normal leading-tight">{d.food_name}</CardTitle><CardDescription className="mt-1 flex flex-wrap items-center gap-2"><span>{getProviderName(d.profiles)}</span><span className="hidden sm:inline">•</span><span>{d.quantity} {d.unit}</span><span>• {d.category}</span></CardDescription></div><StatusBadge status={d.status} type="donation" /></div></CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4"><div className="flex flex-wrap items-center gap-2 text-xs"><span className={`inline-flex rounded-full border px-2.5 py-1 font-medium ${meta.tone}`}>{meta.label}</span><span className="inline-flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" /> {new Date(d.expiry_time).toLocaleDateString("id-ID", { day: "numeric", month: "long" })}</span></div><p className="flex items-start gap-2 text-sm leading-6 text-muted-foreground"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /><span className="line-clamp-2">{d.pickup_address}</span></p>{d.description && <p className="line-clamp-2 text-sm leading-6 text-foreground/80">{d.description}</p>}<div className="mt-auto flex items-center gap-2 pt-2"><Link href={`/partner/donations/${d.id}`} className="flex-1"><Button variant="outline" className="w-full rounded-full">Lihat Detail</Button></Link><Button className="flex-1 rounded-full" disabled={isVerified === false || claimingId === d.id} onClick={() => handleClaim(d.id)}>{claimingId === d.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Klaim"}</Button></div><div className="rounded-xl border border-dashed border-border bg-muted/20 px-3 py-2"><p className="text-xs text-muted-foreground">Foto & peta pickup — konsep desain, belum aktif pada Fase 3.</p></div></CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
