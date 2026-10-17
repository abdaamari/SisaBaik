"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Package, Clock, MapPin, Loader2, ArrowLeft, Truck, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

interface OrderDonation {
  id: string;
  food_name: string;
  category: string;
  quantity: number;
  unit: string;
  status: string;
  expiry_time: string;
  pickup_address: string;
  description: string | null;
  profiles?: { organization_name: string } | { organization_name: string }[] | null;
}

interface OrderRow {
  id: string;
  status: string;
  claimed_at: string;
  completed_at: string | null;
  donation_id: string;
  donations: OrderDonation | null;
}

function getProviderName(profiles: OrderDonation["profiles"]): string {
  if (!profiles) return "Penyedia";
  if (Array.isArray(profiles)) return profiles[0]?.organization_name ?? "Penyedia";
  return profiles.organization_name ?? "Penyedia";
}

const STATUS_FILTERS = ["Semua", "pending", "in_transit", "completed", "cancelled"] as const;
const STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu",
  in_transit: "Dalam Pengiriman",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export default function PartnerOrdersPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("Semua");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data, error } = await supabase
        .from("orders")
        .select("id, status, claimed_at, completed_at, donation_id, donations!inner(id, food_name, category, quantity, unit, status, expiry_time, pickup_address, description, profiles!donations_provider_id_fkey(organization_name))")
        .eq("partner_id", user.id)
        .order("claimed_at", { ascending: false });
      if (error) throw error;
      setOrders((data as unknown as OrderRow[]) ?? []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memuat pesanan";
      toast.error(msg);
    } finally { setIsLoading(false); }
  }, [supabase, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchOrders();
  }, [fetchOrders]);

  const handleUpdate = async (orderId: string, next: "in_transit" | "completed" | "cancelled") => {
    const confirmText = next === "cancelled" ? "Yakin ingin membatalkan pesanan ini?" : next === "completed" ? "Tandai pesanan sebagai selesai?" : "Mulai pengiriman untuk pesanan ini?";
    if (!window.confirm(confirmText)) return;
    setUpdatingId(orderId);
    try {
      const { data, error } = await (supabase as unknown as { rpc: (n: string, a: Record<string, string>) => Promise<{ data: { success: boolean; error?: string }; error: unknown }> }).rpc("update_order_status", { p_order_id: orderId, p_new_status: next }) as { data: { success: boolean; error?: string } | null; error: unknown };
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error ?? "Gagal memperbarui status");
      toast.success(next === "completed" ? "Pesanan selesai." : next === "cancelled" ? "Pesanan dibatalkan." : "Status diperbarui.");
      await fetchOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memperbarui pesanan";
      toast.error(msg);
    } finally { setUpdatingId(null); }
  };

  const filtered = orders.filter((o) => statusFilter === "Semua" || o.status === statusFilter);

  if (isLoading) {
    return <div className="flex min-h-[400px] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Pesanan Saya" description="Kelola alur distribusi — dari klaim hingga selesai. Transisi status dijaga oleh RPC agar tetap konsisten." action={<Link href="/partner/donations"><Button variant="outline" className="rounded-full"><ArrowLeft className="mr-2 h-4 w-4" /> Donasi tersedia</Button></Link>} />
      <Card className="rounded-2xl"><CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Package className="h-4 w-4" /><span>{orders.length} pesanan</span><span className="hidden sm:inline">•</span><span className="hidden sm:inline">Filter status untuk fokus pada alur tertentu.</span></div><div className="flex items-center gap-2"><Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "Semua")}><SelectTrigger className="h-11 w-[180px] rounded-xl"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent>{STATUS_FILTERS.map((s) => (<SelectItem key={s} value={s}>{s === "Semua" ? "Semua status" : STATUS_LABEL[s]}</SelectItem>))}</SelectContent></Select></div></CardContent></Card>
      {filtered.length === 0 ? (
        <Card className="rounded-2xl"><CardContent className="p-0"><EmptyState icon={<Truck className="h-5 w-5" />} title={orders.length === 0 ? "Belum ada pesanan" : "Tidak ada pesanan pada filter ini"} description={orders.length === 0 ? "Klaim donasi dari halaman donasi tersedia, lalu kelola pengiriman di sini." : "Coba ubah filter status atau muat ulang."} action={<Link href="/partner/donations"><Button variant="outline" className="rounded-full">Jelajahi donasi</Button></Link>} /></CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((o) => {
            const d = o.donations;
            const isPending = o.status === "pending";
            const isTransit = o.status === "in_transit";
            return (
              <Card key={o.id} className="overflow-hidden rounded-2xl">
                <CardHeader className="pb-3"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><CardTitle className="truncate font-heading text-[17px] font-normal leading-tight">{d?.food_name ?? "Donasi"}</CardTitle><CardDescription className="mt-1 flex flex-wrap items-center gap-2"><span>{d ? getProviderName(d.profiles) : "Penyedia"}</span>{d && (<><span className="hidden sm:inline">•</span><span>{d.quantity} {d.unit}</span><span>• {d.category}</span></>)}</CardDescription></div><StatusBadge status={o.status} type="order" /></div></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> Klaim {new Date(o.claimed_at).toLocaleString("id-ID")}</span>{o.completed_at && (<span className="inline-flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Selesai {new Date(o.completed_at).toLocaleString("id-ID")}</span>)} {d && (<span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {d.pickup_address}</span>)}</div>
                  {d?.description && <p className="line-clamp-2 text-sm leading-6 text-foreground/80">{d.description}</p>}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {isPending && (<><Button size="sm" className="rounded-full" disabled={updatingId === o.id} onClick={() => handleUpdate(o.id, "in_transit")}>{updatingId === o.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />} Mulai Pengiriman</Button><Button size="sm" variant="outline" className="rounded-full text-destructive hover:bg-destructive/10" disabled={updatingId === o.id} onClick={() => handleUpdate(o.id, "cancelled")}><XCircle className="h-4 w-4" /> Batalkan</Button></>)}
                    {isTransit && (<><Button size="sm" className="rounded-full" disabled={updatingId === o.id} onClick={() => handleUpdate(o.id, "completed")}>{updatingId === o.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />} Tandai Selesai</Button><Button size="sm" variant="outline" className="rounded-full text-destructive hover:bg-destructive/10" disabled={updatingId === o.id} onClick={() => handleUpdate(o.id, "cancelled")}><XCircle className="h-4 w-4" /> Batalkan</Button></>)}
                    {d && (<Link href={`/partner/donations/${d.id}`} className="ml-auto"><Button variant="ghost" size="sm" className="rounded-full">Lihat donasi</Button></Link>)}
                  </div>
                  <div className="rounded-xl border border-dashed border-border bg-muted/20 px-3 py-2"><p className="text-xs text-muted-foreground">Foto & peta pickup — konsep desain, belum aktif pada Fase 3.</p></div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
