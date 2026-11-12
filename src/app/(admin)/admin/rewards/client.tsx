"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Plus, Gift, Trash2, Edit3, ShieldCheck, Loader2, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { PageLoader } from "@/components/ui/page-loader";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ChoiceChips } from "@/components/ui/choice-chips";
import { formatDateTime } from "@/lib/format";

interface Reward {
  id: string;
  name: string;
  description: string | null;
  points_cost: number;
  stock: number;
  is_active: boolean;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export default function AdminRewardsClient() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formReward, setFormReward] = useState<Reward | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPointsCost, setFormPointsCost] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [formImageUrl, setFormImageUrl] = useState<string | null>(null);
  const [formImageLoading, setFormImageLoading] = useState(false);
  const supabase = createClient();

  const bucketName = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET_IMAGES ?? "donation-images";

  const fetchRewards = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("rewards")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setRewards((data ?? []) as Reward[]);
    } catch {
      toast.error("Gagal memuat daftar hadiah");
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void fetchRewards();
  }, [fetchRewards]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rewards.filter((r) => {
      const matchesSearch =
        !term ||
        r.name.toLowerCase().includes(term) ||
        (r.description ?? "").toLowerCase().includes(term);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && r.is_active) ||
        (statusFilter === "inactive" && !r.is_active);
      return matchesSearch && matchesStatus;
    });
  }, [rewards, search, statusFilter]);

  const counts = useMemo(() => {
    return {
      all: rewards.length,
      active: rewards.filter((r) => r.is_active).length,
      inactive: rewards.filter((r) => !r.is_active).length,
    };
  }, [rewards]);

  const openCreateForm = () => {
    setFormMode("create");
    setFormReward(null);
    setFormName("");
    setFormDescription("");
    setFormPointsCost("");
    setFormStock("");
    setFormImageFile(null);
    setFormImageUrl(null);
    setFormOpen(true);
  };

  const openEditForm = (reward: Reward) => {
    setFormMode("edit");
    setFormReward(reward);
    setFormName(reward.name);
    setFormDescription(reward.description ?? "");
    setFormPointsCost(String(reward.points_cost));
    setFormStock(String(reward.stock));
    setFormImageFile(null);
    setFormImageUrl(reward.image_url);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setFormReward(null);
    setFormImageFile(null);
    setFormImageUrl(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Gambar maksimal 5 MB");
      return;
    }
    setFormImageFile(file);
    setFormImageUrl(URL.createObjectURL(file));
  };

  const removeImage = () => {
    if (formImageUrl) {
      URL.revokeObjectURL(formImageUrl);
    }
    setFormImageFile(null);
    setFormImageUrl(null);
  };

  const uploadImage = async (rewardId: string): Promise<string | null> => {
    if (!formImageFile) return formImageUrl ?? null;
    const fileName = `rewards/${rewardId}/${Date.now()}-${formImageFile.name.replace(/\s+/g, "_")}`;
    const { error: uploadError } = await supabase.storage.from(bucketName).upload(fileName, formImageFile, {
      cacheControl: "3600",
      upsert: false,
    });
    if (uploadError) throw uploadError;
    const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const handleSave = async () => {
    const name = formName.trim();
    const description = formDescription.trim() || null;
    const pointsCost = parseInt(formPointsCost, 10);
    const stock = parseInt(formStock, 10);

    if (!name) {
      toast.error("Nama hadiah harus diisi");
      return;
    }
    if (isNaN(pointsCost) || pointsCost <= 0) {
      toast.error("Biaya poin harus lebih dari 0");
      return;
    }
    if (isNaN(stock) || stock < 0) {
      toast.error("Stok tidak boleh negatif");
      return;
    }

    try {
      if (formMode === "create") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: created, error } = await (supabase as any)
          .from("rewards")
          .insert({
            name,
            description,
            points_cost: pointsCost,
            stock,
            is_active: true,
          })
          .select()
          .single();
        if (error) throw error;

        // Upload image if provided
        if (formImageFile) {
          const imageUrl = await uploadImage(created.id);
          if (imageUrl) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any)
              .from("rewards")
              .update({ image_url: imageUrl })
              .eq("id", created.id);
          }
        }

        toast.success("Hadiah berhasil ditambahkan");
      } else {
        if (!formReward) return;
        let imageUrl = formReward.image_url;
        if (formImageFile) {
          imageUrl = await uploadImage(formReward.id);
        } else if (formImageUrl === null && formReward.image_url) {
          // User removed image in edit mode
          imageUrl = null;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any)
          .from("rewards")
          .update({ name, description, points_cost: pointsCost, stock, image_url: imageUrl })
          .eq("id", formReward.id);
        if (error) throw error;
        toast.success("Hadiah berhasil diperbarui");
      }
      closeForm();
      void fetchRewards();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan hadiah");
    }
  };

  const handleToggleActive = async (reward: Reward) => {
    setBusyId(reward.id);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("rewards")
        .update({ is_active: !reward.is_active })
        .eq("id", reward.id);
      if (error) throw error;
      toast.success(
        `Hadiah "${reward.name}" ${!reward.is_active ? "diaktifkan" : "dinonaktifkan"}`,
      );
      void fetchRewards();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal mengubah status");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (reward: Reward) => {
    setBusyId(reward.id);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("rewards").delete().eq("id", reward.id);
      if (error) throw error;
      toast.success("Hadiah berhasil dihapus");
      void fetchRewards();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus hadiah");
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) {
    return <PageLoader variant="list" label="Memuat daftar hadiah" />;
  }

  return (
    <div className="space-y-6">
      {rewards.length === 0 ? (
        <EmptyState
          icon={<Gift className="size-6" />}
          title="Belum ada hadiah"
          description="Tambahkan hadiah pertama yang dapat ditukarkan oleh para penyedia."
          action={
            <Button variant="outline" onClick={openCreateForm}>
              Tambah Hadiah
            </Button>
          }
        />
      ) : (
        <div>
          <PageHeader
            title="Kelola Hadiah"
            description="Kelola katalog hadiah yang dapat ditukarkan dengan poin oleh para penyedia."
            action={
              <Button variant="default" onClick={openCreateForm}>
                <Plus aria-hidden="true" />
                Tambah Hadiah
              </Button>
            }
          />

          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative sm:w-80">
                <ShieldCheck className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  type="search"
                  aria-label="Cari hadiah"
                  placeholder="Cari nama atau deskripsi hadiah"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <ChoiceChips
                label="Filter status"
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: "all", label: "Semua", count: counts.all },
                  { value: "active", label: "Aktif", count: counts.active },
                  { value: "inactive", label: "Nonaktif", count: counts.inactive },
                ]}
              />
            </div>

            <p className="text-sm text-muted-foreground" aria-live="polite">
              <span className="font-semibold text-foreground tabular-nums">{visible.length}</span> dari{" "}
              <span className="tabular-nums">{rewards.length}</span> hadiah
            </p>

            {visible.length === 0 ? (
              <EmptyState
                icon={<ShieldCheck className="size-6" />}
                title="Tidak ada yang cocok"
                description="Ubah kata kunci atau filter untuk melihat lebih banyak hadiah."
                action={
                  <Button variant="outline" onClick={() => setSearch("")}>
                    Hapus pencarian
                  </Button>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="h-10 px-4 text-left text-xs font-medium text-muted-foreground uppercase">Foto</th>
                      <th className="h-10 px-4 text-left text-xs font-medium text-muted-foreground uppercase">Nama Hadiah</th>
                      <th className="h-10 px-4 text-left text-xs font-medium text-muted-foreground uppercase">Deskripsi</th>
                      <th className="h-10 px-4 text-right text-xs font-medium text-muted-foreground uppercase">Biaya Poin</th>
                      <th className="h-10 px-4 text-right text-xs font-medium text-muted-foreground uppercase">Stok</th>
                      <th className="h-10 px-4 text-center text-xs font-medium text-muted-foreground uppercase">Status</th>
                      <th className="h-10 px-4 text-right text-xs font-medium text-muted-foreground uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((r) => (
                      <tr key={r.id} className="border-b border-border hover:bg-muted/50">
                        <td className="px-4 py-3">
                          {r.image_url ? (
                            <img
                              src={r.image_url}
                              alt={r.name}
                              className="h-10 w-10 rounded-lg object-cover border border-border"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                              <Image className="size-4 text-muted-foreground" aria-hidden="true" />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">{r.name}</div>
                          <div className="text-xs text-muted-foreground">{r.id.slice(0, 8)}…</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {r.description ?? "-"}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-muted-foreground tabular-nums">
                          {r.points_cost}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-muted-foreground tabular-nums">
                          {r.stock}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn(
                            "inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-semibold",
                            r.is_active ? "bg-fresh-soft text-fresh-ink" : "bg-muted text-muted-foreground",
                          )}>
                            {r.is_active ? <ShieldCheck className="size-3.5" aria-hidden="true" /> : <Gift className="size-3.5" aria-hidden="true" />}
                            {r.is_active ? "Aktif" : "Nonaktif"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditForm(r)}
                              disabled={busyId === r.id}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(r)}
                              disabled={busyId === r.id}
                            >
                              Hapus
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleToggleActive(r)}
                              disabled={busyId === r.id}
                            >
                              {r.is_active ? "Nonaktifkan" : "Aktifkan"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form Create/Edit */}
      {formOpen && (
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle>{formMode === "create" ? "Tambah Hadiah Baru" : "Edit Hadiah"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Foto Hadiah</label>
              <div className="flex flex-col items-center gap-2">
                <label
                  className={cn(
                    "flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 text-sm text-muted-foreground hover:border-primary hover:text-primary hover:bg-muted/50 transition-colors cursor-pointer",
                    formImageLoading ? "opacity-50 pointer-events-none" : "",
                  )}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="sr-only"
                    disabled={formImageLoading}
                  />
                  <Image className="size-5 mb-1" aria-hidden="true" />
                  {formImageFile ? "Ganti foto" : "Upload foto hadiah"}
                </label>
                {formImageUrl && (
                  <div className="relative">
                    <img
                      src={formImageUrl}
                      alt="Pratinjau"
                      className="h-24 w-24 rounded-xl object-cover border border-border"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                      aria-label="Hapus foto"
                    >
                      <span className="size-3">×</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Nama Hadiah</label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Contoh: Voucher Makanan Gratis"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Deskripsi</label>
              <Input
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Contoh: Voucher diskon untuk makan di restoran partner"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Biaya Poin</label>
                <Input
                  type="number"
                  value={formPointsCost}
                  onChange={(e) => setFormPointsCost(e.target.value)}
                  placeholder="Contoh: 50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Stok</label>
                <Input
                  type="number"
                  value={formStock}
                  onChange={(e) => setFormStock(e.target.value)}
                  placeholder="Contoh: 10"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={closeForm}>
                Batal
              </Button>
              <Button onClick={handleSave} disabled={formImageLoading || busyId !== null}>
                {formMode === "create" ? "Buat Hadiah" : "Simpan Perubahan"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirm Dialog */}
      {busyId && (
        <ConfirmDialog
          open={!!busyId}
          onOpenChange={(open) => {
            if (!open) setBusyId(null);
          }}
          title="Hapus hadiah ini?"
          description="Hadiah yang dihapus tidak dapat dipulihkan."
          confirmLabel="Hapus"
          cancelLabel="Batal"
          tone="danger"
          loading={busyId !== null}
          onConfirm={() => {
            const reward = rewards.find((r) => r.id === busyId);
            if (reward) {
              void handleDelete(reward);
            }
            setBusyId(null);
          }}
        />
      )}
    </div>
  );
}

function cn(...classes: (string | undefined | null | boolean)[]) {
  return classes.filter(Boolean).join(" ");
}
