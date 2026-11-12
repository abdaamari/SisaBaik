"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Search, ShieldCheck, User, UserMinus, UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { PageLoader } from "@/components/ui/page-loader";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ChoiceChips } from "@/components/ui/choice-chips";
import { Pagination } from "@/components/ui/pagination";
import { formatDate } from "@/lib/format";

type UserRole = "provider" | "partner" | "admin";
type VerificationFilter = "all" | "verified" | "unverified";
type RoleFilter = "all" | "provider" | "partner" | "admin";

interface AdminUser {
  id: string;
  role: UserRole;
  organization_name: string;
  organization_type: string | null;
  phone: string | null;
  address: string | null;
  is_verified: boolean;
  created_at: string;
  email?: string;
}

const PAGE_SIZE = 10;

const ROLE_LABELS: Record<UserRole, string> = {
  provider: "Penyedia Makanan",
  partner: "Mitra Penyalur",
  admin: "Administrator",
};

const ROLE_COLORS: Record<UserRole, string> = {
  provider: "bg-fresh-soft text-fresh-ink",
  partner: "bg-soon-soft text-soon-ink",
  admin: "bg-primary text-primary-foreground",
};

export default function AdminUsersClient() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [verifiedFilter, setVerifiedFilter] = useState<VerificationFilter>("all");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionTarget, setActionTarget] = useState<AdminUser | null>(null);
  const [actionType, setActionType] = useState<"verify" | "unverify" | "change_role" | "delete">("verify");
  const supabase = createClient();

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error, count } = await supabase
        .from("profiles")
        .select("id, role, organization_name, organization_type, phone, address, is_verified, created_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      setTotalCount(count ?? 0);
      setUsers((data ?? []) as AdminUser[]);
    } catch {
      toast.error("Gagal memuat daftar pengguna");
    } finally {
      setIsLoading(false);
    }
  }, [supabase, page]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  // Reset ke halaman 1 saat filter atau pencarian berubah
  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, verifiedFilter]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesSearch =
        !term ||
        u.organization_name.toLowerCase().includes(term) ||
        (u.organization_type ?? "").toLowerCase().includes(term) ||
        (u.phone ?? "").toLowerCase().includes(term) ||
        (u.email ?? "").toLowerCase().includes(term);
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      const matchesVerification =
        verifiedFilter === "all" ||
        (verifiedFilter === "verified" && u.is_verified) ||
        (verifiedFilter === "unverified" && !u.is_verified);
      return matchesSearch && matchesRole && matchesVerification;
    });
  }, [users, search, roleFilter, verifiedFilter]);

  const counts = useMemo(() => {
    const result: Record<RoleFilter, number> = { all: totalCount, provider: 0, partner: 0, admin: 0 };
    for (const u of users) {
      if (u.role in result) result[u.role as RoleFilter] += 1;
    }
    return result;
  }, [users, totalCount]);

  const verifiedCounts = useMemo(() => {
    return {
      verified: users.filter((u) => u.is_verified).length,
      unverified: users.filter((u) => !u.is_verified).length,
    };
  }, [users]);

  const handleVerify = async (target: AdminUser) => {
    if (!target) return;
    setBusyId(target.id);
    try {
      const { error } = await supabase.rpc("verify_profile", {
        p_profile_id: target.id,
        p_verified: true,
      } as never);
      if (error) throw error;
      toast.success(`${target.organization_name} telah diverifikasi`);
      setUsers((prev) => prev.map((u) => (u.id === target.id ? { ...u, is_verified: true } : u)));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal memverifikasi");
    } finally {
      setBusyId(null);
    }
  };

  const handleUnverify = async (target: AdminUser) => {
    if (!target) return;
    setBusyId(target.id);
    try {
      const { error } = await supabase.rpc("verify_profile", {
        p_profile_id: target.id,
        p_verified: false,
      } as never);
      if (error) throw error;
      toast.success(`${target.organization_name} tidak lagi diverifikasi`);
      setUsers((prev) => prev.map((u) => (u.id === target.id ? { ...u, is_verified: false } : u)));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal mengubah verifikasi");
    } finally {
      setBusyId(null);
    }
  };

  const handleChangeRole = async (target: AdminUser, newRole: UserRole) => {
    if (!target) return;
    setBusyId(target.id);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("profiles")
        .update({ role: newRole })
        .eq("id", target.id);
      if (error) throw error;
      toast.success(`Role ${target.organization_name} diubah menjadi ${ROLE_LABELS[newRole]}`);
      setUsers((prev) => prev.map((u) => (u.id === target.id ? { ...u, role: newRole } : u)));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal mengubah role");
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) {
    return <PageLoader variant="list" label="Memuat daftar pengguna" />;
  }

  const roleOptions: { value: RoleFilter; label: string; count: number }[] = [
    { value: "all", label: "Semua", count: counts.all },
    { value: "provider", label: "Penyedia", count: counts.provider },
    { value: "partner", label: "Mitra", count: counts.partner },
    { value: "admin", label: "Admin", count: counts.admin },
  ];

  const verifiedOptions: { value: VerificationFilter; label: string; count: number }[] = [
    { value: "all", label: "Semua", count: totalCount },
    { value: "verified", label: "Terverifikasi", count: verifiedCounts.verified },
    { value: "unverified", label: "Belum Terverifikasi", count: verifiedCounts.unverified },
  ];

  if (totalCount === 0) {
    return (
      <EmptyState
        icon={<User className="size-6" />}
        title="Belum ada pengguna terdaftar"
        description="Belum ada akun yang terdaftar di platform SisaBaik."
        action={
          <Button variant="outline" onClick={() => void fetchUsers()}>
            Muat Ulang
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Pengguna"
        description="Kelola semua akun penyedia, mitra, dan admin di platform."
        action={
          <Button variant="outline" size="lg" onClick={() => void fetchUsers()}>
            Muat Ulang
          </Button>
        }
      />

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative sm:w-80">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              type="search"
              aria-label="Cari pengguna"
              placeholder="Cari nama, jenis, atau telepon"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <ChoiceChips
            label="Filter peran"
            value={roleFilter}
            onChange={setRoleFilter}
            options={roleOptions}
          />

          <ChoiceChips
            label="Filter verifikasi"
            value={verifiedFilter}
            onChange={setVerifiedFilter}
            options={verifiedOptions}
          />
        </div>

        <p className="text-sm text-muted-foreground" aria-live="polite">
          <span className="font-semibold text-foreground tabular-nums">{visible.length}</span> dari{" "}
          <span className="tabular-nums">{totalCount}</span> pengguna
        </p>

        {visible.length === 0 ? (
          <EmptyState
            icon={<Search className="size-6" />}
            title="Tidak ada yang cocok"
            description="Ubah kata kunci atau filter untuk melihat lebih banyak pengguna."
            action={
              <Button variant="outline" onClick={() => setSearch("")}>
                Hapus pencarian
              </Button>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="h-10 px-4 text-left text-xs font-medium text-muted-foreground uppercase">Nama Organisasi</th>
                    <th className="h-10 px-4 text-left text-xs font-medium text-muted-foreground uppercase">Peran</th>
                    <th className="h-10 px-4 text-left text-xs font-medium text-muted-foreground uppercase">Jenis</th>
                    <th className="h-10 px-4 text-left text-xs font-medium text-muted-foreground uppercase">Verifikasi</th>
                    <th className="h-10 px-4 text-left text-xs font-medium text-muted-foreground uppercase">Telepon</th>
                    <th className="h-10 px-4 text-left text-xs font-medium text-muted-foreground uppercase">Daftar</th>
                    <th className="h-10 px-4 text-right text-xs font-medium text-muted-foreground uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((u) => (
                    <tr key={u.id} className="border-b border-border hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{u.organization_name}</div>
                        <div className="text-xs text-muted-foreground">{u.id.slice(0, 8)}…</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-semibold", ROLE_COLORS[u.role])}>
                          <User className="size-3.5" aria-hidden="true" />
                          {ROLE_LABELS[u.role]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {u.organization_type ?? "Tidak diisi"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-semibold", u.is_verified ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                          {u.is_verified ? <ShieldCheck className="size-3.5" aria-hidden="true" /> : <UserMinus className="size-3.5" aria-hidden="true" />}
                          {u.is_verified ? "Terverifikasi" : "Belum"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {u.phone ?? "Tidak diisi"}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDate(u.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {u.role === "partner" ? (
                            u.is_verified ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setActionTarget(u);
                                  setActionType("unverify");
                                }}
                                disabled={busyId === u.id}
                              >
                                Batalkan Verifikasi
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => {
                                  setActionTarget(u);
                                  setActionType("verify");
                                }}
                                disabled={busyId === u.id}
                              >
                                Verifikasi
                              </Button>
                            )
                          ) : (
                            <Button size="sm" variant="ghost" onClick={() => {
                              setActionTarget(u);
                              setActionType("change_role");
                            }}>
                              Ubah Role
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Confirm Dialog */}
      {actionTarget && (
        <ConfirmDialog
          open={actionTarget !== null}
          onOpenChange={(open) => {
            if (!open) setActionTarget(null);
          }}
          title={
            actionType === "verify"
              ? `Verifikasi ${actionTarget.organization_name}?`
              : actionType === "unverify"
                ? `Batalkan verifikasi ${actionTarget.organization_name}?`
                : `Ubah role ${actionTarget.organization_name}?`
          }
          description={
            actionType === "verify"
              ? `${actionTarget.organization_name} akan bisa mengklaim donasi setelah diverifikasi.`
              : actionType === "unverify"
                ? `${actionTarget.organization_name} tidak lagi bisa mengklaim donasi.`
                : `Role baru akan berpengaruh pada akses ${actionTarget.organization_name} di platform.`
          }
          confirmLabel={
            actionType === "verify"
              ? "Verifikasi"
              : actionType === "unverify"
                ? "Batalkan Verifikasi"
                : "Ubah Role"
          }
          cancelLabel="Batal"
          tone={actionType === "unverify" ? "danger" : "default"}
          loading={busyId === actionTarget.id}
          onConfirm={() => {
            if (actionType === "verify") {
              void handleVerify(actionTarget!);
            } else if (actionType === "unverify") {
              void handleUnverify(actionTarget!);
            } else {
              // Role change - open a simple prompt or navigate
              toast.info("Gunakan tombol Ubah Role pada baris pengguna untuk mengubah role");
            }
            setActionTarget(null);
          }}
        />
      )}
    </div>
  );
}

function cn(...classes: (string | undefined | null | boolean)[]) {
  return classes.filter(Boolean).join(" ");
}
