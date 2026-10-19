"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Building2, Calendar, Check, Loader2, MapPin, Phone, Search, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { PageLoader } from "@/components/ui/page-loader";
import { formatDate } from "@/lib/format";

type PendingPartner = {
  id: string;
  organization_name: string;
  organization_type: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
};

export default function AdminVerificationClient() {
  const [rows, setRows] = useState<PendingPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [target, setTarget] = useState<PendingPartner | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const fetchRows = useCallback(async (): Promise<PendingPartner[] | null> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, organization_name, organization_type, phone, address, created_at")
      .eq("role", "partner")
      .eq("is_verified", false)
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Gagal memuat mitra");
      console.error("Gagal memuat mitra:", error);
      return null;
    }
    return (data as PendingPartner[]) ?? [];
  }, [supabase]);

  const reload = useCallback(async () => {
    setRefreshing(true);
    const nextRows = await fetchRows();
    if (nextRows) {
      setRows(nextRows);
      setLoadError(false);
    } else {
      setLoadError(true);
    }
    setRefreshing(false);
  }, [fetchRows]);

  useEffect(() => {
    let active = true;
    void fetchRows().then((nextRows) => {
      if (!active) return;
      if (nextRows) {
        setRows(nextRows);
      } else {
        setLoadError(true);
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [fetchRows]);

  const verify = async () => {
    if (!target) return;
    const { id } = target;
    setBusy(id);
    const { data, error } = await supabase.rpc("verify_profile", { p_profile_id: id, p_verified: true } as never);
    if (error) {
      toast.error(error.message);
    } else {
      const result = data as unknown as { success: boolean; error?: string };
      if (result && result.success === false) {
        toast.error(result.error || "Gagal");
      } else {
        toast.success("Mitra terverifikasi");
        setRows((current) => current.filter((row) => row.id !== id));
        setTarget(null);
      }
    }
    setBusy(null);
  };

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (row) =>
        row.organization_name.toLowerCase().includes(term) ||
        (row.organization_type ?? "").toLowerCase().includes(term) ||
        (row.address ?? "").toLowerCase().includes(term) ||
        (row.phone ?? "").toLowerCase().includes(term),
    );
  }, [rows, search]);

  return (
    <div className="space-y-6">
      {loading ? (
        <PageLoader variant="list" label="Memuat daftar mitra" />
      ) : loadError ? (
        <EmptyState
          icon={<ShieldCheck className="size-6" />}
          title="Daftar mitra gagal dimuat"
          description="Periksa koneksi dan akses akun admin, lalu coba muat ulang."
          action={
            <Button variant="outline" size="lg" onClick={() => void reload()} disabled={refreshing}>
              Muat Ulang
            </Button>
          }
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="size-6" />}
          title="Tidak ada mitra yang menunggu"
          description="Belum ada pendaftaran mitra yang menunggu verifikasi. Mitra baru akan muncul di sini setelah mendaftar."
        />
      ) : (
        <div>
          <PageHeader
            title="Verifikasi mitra"
            description="Mitra penyalur baru perlu disetujui sebelum bisa mengklaim donasi. Periksa data mereka, lalu verifikasi."
            action={
              <Button variant="outline" size="lg" onClick={() => void reload()} disabled={refreshing}>
                Muat Ulang
              </Button>
            }
          />
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative sm:w-80">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  aria-label="Cari mitra"
                  placeholder="Cari nama, jenis, atau alamat"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-sm text-muted-foreground" aria-live="polite">
                <span className="font-semibold text-foreground tabular-nums">{visible.length}</span> mitra menunggu
                verifikasi
              </p>
            </div>

            {visible.length === 0 ? (
              <EmptyState
                icon={<Search className="size-6" />}
                title="Tidak ada yang cocok"
                description="Coba kata kunci lain."
                action={
                  <Button variant="outline" onClick={() => setSearch("")}>
                    Hapus pencarian
                  </Button>
                }
              />
            ) : (
              <ul className="grid gap-4 lg:grid-cols-2">
                {visible.map((p) => (
                  <li key={p.id}>
                    <Card className="h-full">
                      <CardContent className="flex h-full flex-col gap-4">
                        <div className="flex items-start gap-3">
                          <span
                            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-soon-soft text-soon-ink"
                            aria-hidden="true"
                          >
                            <Building2 className="size-5" />
                          </span>
                          <div className="min-w-0">
                            <h2 className="truncate font-heading text-lg font-bold">{p.organization_name}</h2>
                            <p className="text-sm text-muted-foreground">{p.organization_type ?? "Jenis tidak diisi"}</p>
                          </div>
                        </div>

                        <dl className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-start gap-2">
                            <dt className="sr-only">Alamat</dt>
                            <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                            <dd>{p.address ?? "Alamat tidak diisi"}</dd>
                          </div>
                          <div className="flex items-start gap-2">
                            <dt className="sr-only">Telepon</dt>
                            <Phone className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                            <dd>{p.phone || "Telepon tidak diisi"}</dd>
                          </div>
                          <div className="flex items-start gap-2">
                            <dt className="sr-only">Mendaftar</dt>
                            <Calendar className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                            <dd>Mendaftar {formatDate(p.created_at)}</dd>
                          </div>
                        </dl>

                        <div className="mt-auto pt-2">
                          <Button className="w-full" disabled={busy === p.id} onClick={() => setTarget(p)}>
                            {busy === p.id ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Check aria-hidden="true" />}
                            Verifikasi mitra
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={target !== null}
        onOpenChange={(open) => {
          if (!open) setTarget(null);
        }}
        title="Verifikasi mitra ini?"
        description={
          target
            ? `${target.organization_name} akan bisa mengklaim donasi segera setelah diverifikasi.`
            : undefined
        }
        confirmLabel="Verifikasi mitra"
        loading={busy !== null}
        onConfirm={verify}
      />
    </div>
  );
}