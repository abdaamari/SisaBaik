"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Building2, Check } from "lucide-react";
type P = { id: string; organization_name: string; organization_type: string | null; phone: string | null; address: string | null; created_at: string; };
export default function AdminVerificationPage() {
  const [rows, setRows] = useState<P[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const supabase = createClient();
  const fetchRows = useCallback(async (): Promise<P[] | null> => {
    const { data, error } = await supabase.from("profiles").select("id, organization_name, organization_type, phone, address, created_at").eq("role","partner").eq("is_verified",false).order("created_at",{ascending:false});
    if (error) {
      toast.error("Gagal memuat mitra");
      return null;
    }
    return (data as P[]) ?? [];
  }, [supabase]);
  const load = useCallback(async () => {
    setLoading(true);
    const nextRows = await fetchRows();
    if (nextRows) setRows(nextRows);
    setLoading(false);
  }, [fetchRows]);
  useEffect(() => {
    let active = true;
    void fetchRows().then((nextRows) => {
      if (!active) return;
      if (nextRows) setRows(nextRows);
      setLoading(false);
    });
    return () => { active = false; };
  }, [fetchRows]);
  const verify = async (id: string) => {
    setBusy(id);
    const { data, error } = await supabase.rpc("verify_profile", { p_profile_id: id, p_verified: true } as never);
    if (error) toast.error(error.message);
    else {
      const r = data as unknown as { success: boolean; error?: string };
      if (r && r.success === false) toast.error(r.error || "Gagal");
      else { toast.success("Mitra terverifikasi"); setRows((v) => v.filter((x) => x.id !== id)); }
    }
    setBusy(null);
  };
  return (
    <div className="space-y-6">
      <PageHeader title="Verifikasi Mitra" description="Hanya admin via RPC verify_profile (SECURITY DEFINER). RLS mencegah update langsung is_verified." action={<Button variant="outline" size="sm" onClick={load} disabled={loading}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}Muat Ulang</Button>} />
      <Card><CardContent className="p-0">
        {loading ? <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground"/></div> : rows.length === 0 ? <EmptyState icon={<ShieldCheck />} title="Tidak ada mitra menunggu" description="Semua mitra sudah terverifikasi."/> : (
          <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b bg-muted/30 text-left"><th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Organisasi</th><th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipe</th><th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Daftar</th><th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Aksi</th></tr></thead><tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20">
                <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="h-9 w-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center"><Building2 className="h-4 w-4 text-amber-700"/></div><div><div className="font-medium">{p.organization_name}</div><div className="text-xs text-muted-foreground truncate max-w-[28ch]">{p.address ?? "-"}</div></div></div></td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{p.organization_type ?? "-"}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(p.created_at).toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"})}</td>
                <td className="px-6 py-4 text-right"><Button size="sm" onClick={() => verify(p.id)} disabled={busy===p.id}>{busy===p.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Check className="mr-1.5 h-4 w-4"/>}Verifikasi</Button></td>
              </tr>
            ))}
          </tbody></table></div>
        )}
      </CardContent></Card>
    </div>
  );
}
