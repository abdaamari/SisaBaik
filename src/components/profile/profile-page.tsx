"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, CalendarDays, ImagePlus, Mail, MapPin, PencilLine, Phone, ShieldCheck, Trash2, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { OptimizedImage } from "@/components/ui/image";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/format";

const profileSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username minimal 3 karakter")
    .max(24, "Username maksimal 24 karakter")
    .regex(/^[a-z0-9_]+$/, "Gunakan hanya huruf kecil, angka, dan underscore"),
  full_name: z.string().trim().max(100, "Nama maksimal 100 karakter"),
  organization_name: z.string().trim().min(2, "Nama organisasi minimal 2 karakter").max(120, "Nama organisasi maksimal 120 karakter"),
  organization_type: z.string().trim().max(80, "Jenis organisasi maksimal 80 karakter"),
  phone: z.string().trim().max(40, "Nomor telepon maksimal 40 karakter"),
  address: z.string().trim().max(300, "Alamat maksimal 300 karakter"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type ProfileRole = "provider" | "partner" | "admin";

interface ProfileData {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: ProfileRole;
  organization_name: string;
  organization_type: string | null;
  phone: string | null;
  address: string | null;
  is_verified: boolean;
  created_at: string;
  email: string;
}

const ROLE_LABEL: Record<ProfileRole, string> = {
  provider: "Penyedia makanan",
  partner: "Mitra penyalur",
  admin: "Administrator",
};

function ProfileLoading() {
  return (
    <div className="space-y-6" aria-label="Memuat profil" role="status">
      <div className="space-y-3">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-72 max-w-full" />
      </div>
      <Card>
        <CardContent className="space-y-8 p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <Skeleton className="size-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-56 max-w-[60vw]" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {Array.from({ length: 6 }, (_, index) => (
              <div className="space-y-2" key={index}>
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-40 max-w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ProfilePage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarToken, setAvatarToken] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: "",
      full_name: "",
      organization_name: "",
      organization_type: "",
      phone: "",
      address: "",
    },
  });

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        router.replace("/login");
        return;
      }

      // Use the authenticated user's ID only; never accept an ID from the URL or form.
      // The local placeholder Supabase types do not infer this select reliably.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("id, username, full_name, avatar_url, role, organization_name, organization_type, phone, address, is_verified, created_at")
        .eq("id", user.id)
        .single();

      if (error || !data) throw error ?? new Error("Profil akun tidak ditemukan");

      const loaded: ProfileData = {
        ...data,
        role: data.role as ProfileRole,
        email: user.email ?? "",
      };
      setProfile(loaded);
      form.reset({
        username: loaded.username ?? "",
        full_name: loaded.full_name ?? "",
        organization_name: loaded.organization_name,
        organization_type: loaded.organization_type ?? "",
        phone: loaded.phone ?? "",
        address: loaded.address ?? "",
      });
    } catch (error) {
      console.error("Profile load error:", error);
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "object" && error !== null && "message" in error
            ? String(error.message)
            : "";
      setLoadError(
        message.includes("avatar_url")
          ? "Kolom foto profil belum tersedia di database. Jalankan migration 012_add_profile_identity.sql di Supabase."
          : "Terjadi kendala saat mengambil profil. Periksa koneksi dan coba lagi.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [form, router, supabase]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      if (active) void loadProfile();
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [loadProfile]);

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const beginEditing = () => {
    if (!profile) return;
    setAvatarFile(null);
    setAvatarToken(null);
    setAvatarPreview(null);
    setRemoveAvatar(false);
    form.reset({
      username: profile.username ?? "",
      full_name: profile.full_name ?? "",
      organization_name: profile.organization_name,
      organization_type: profile.organization_type ?? "",
      phone: profile.phone ?? "",
      address: profile.address ?? "",
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    if (profile) {
      form.reset({
        username: profile.username ?? "",
        full_name: profile.full_name ?? "",
        organization_name: profile.organization_name,
        organization_type: profile.organization_type ?? "",
        phone: profile.phone ?? "",
        address: profile.address ?? "",
      });
    }
    setAvatarFile(null);
    setAvatarToken(null);
    setAvatarPreview(null);
    setRemoveAvatar(false);
    setIsEditing(false);
  };

  const chooseAvatar = () => {
    if (!isEditing) beginEditing();
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!acceptedTypes.includes(file.type)) {
      toast.error("Foto harus berformat JPEG, PNG, atau WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran foto maksimal 5 MB.");
      return;
    }

    setAvatarFile(file);
    setAvatarToken(crypto.randomUUID());
    setAvatarPreview(URL.createObjectURL(file));
    setRemoveAvatar(false);
  };

  const removeStoragePhoto = async (url: string, userId: string) => {
    try {
      const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET_IMAGES ?? "donation-images";
      const pathname = new URL(url).pathname;
      const marker = `/storage/v1/object/public/${bucket}/`;
      if (!pathname.startsWith(marker)) return;

      const storagePath = decodeURIComponent(pathname.slice(marker.length));
      if (!storagePath.startsWith(`${userId}/profiles/`)) return;
      await supabase.storage.from(bucket).remove([storagePath]);
    } catch {
      // The profile URL was saved already; an orphaned old photo must not undo it.
    }
  };

  const onSubmit = async (values: ProfileFormValues) => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        router.replace("/login");
        return;
      }

      const username = values.username.trim().toLowerCase();
      const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET_IMAGES ?? "donation-images";
      let uploadedPath: string | null = null;
      let avatarUrl = profile?.avatar_url ?? null;

      if (avatarFile) {
        if (!avatarToken) throw new Error("Pilih ulang foto profil lalu coba lagi.");
        const extension = avatarFile.type === "image/png" ? "png" : avatarFile.type === "image/webp" ? "webp" : "jpg";
        uploadedPath = `${user.id}/profiles/avatar-${avatarToken}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(uploadedPath, avatarFile, {
            cacheControl: "3600",
            contentType: avatarFile.type,
            upsert: false,
          });

        if (uploadError) throw new Error("Foto profil gagal diunggah. Coba lagi.");
        avatarUrl = supabase.storage.from(bucket).getPublicUrl(uploadedPath).data.publicUrl;
      } else if (removeAvatar) {
        avatarUrl = null;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("profiles")
        .update({
          username,
          full_name: values.full_name.trim() || null,
          avatar_url: avatarUrl,
          organization_name: values.organization_name.trim(),
          organization_type: values.organization_type.trim() || null,
          phone: values.phone.trim() || null,
          address: values.address.trim() || null,
        })
        .eq("id", user.id)
        .select("id, username, full_name, avatar_url, role, organization_name, organization_type, phone, address, is_verified, created_at")
        .single();

      if (error) {
        if (uploadedPath) await supabase.storage.from(bucket).remove([uploadedPath]);
        if (error.code === "23505") {
          form.setError("username", { message: "Username ini sudah digunakan. Coba username lain." });
          return;
        }
        if (error.code === "23514") {
          form.setError("username", { message: "Format username tidak valid. Gunakan huruf kecil, angka, dan underscore." });
          return;
        }
        throw error;
      }

      if (!data) throw new Error("Perubahan profil tidak tersimpan. Silakan coba lagi.");

      const oldAvatarUrl = profile?.avatar_url;
      setProfile({ ...data, role: data.role as ProfileRole, email: user.email ?? "" });
      if (removeAvatar && oldAvatarUrl) await removeStoragePhoto(oldAvatarUrl, user.id);
      if (avatarFile && oldAvatarUrl && oldAvatarUrl !== avatarUrl) {
        await removeStoragePhoto(oldAvatarUrl, user.id);
      }
      setAvatarFile(null);
      setAvatarToken(null);
      setAvatarPreview(null);
      setRemoveAvatar(false);
      setIsEditing(false);
      toast.success("Profil berhasil diperbarui.");
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Profil belum dapat disimpan. Periksa koneksi lalu coba lagi.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <ProfileLoading />;

  if (loadError || !profile) {
    return (
      <div className="space-y-6">
        <PageHeader title="Profil Saya" description="Informasi akun dan organisasi Anda." />
        <EmptyState
          icon={<UserRound className="size-6" />}
          title="Profil belum bisa dimuat"
          description={loadError ?? "Periksa sesi login, lalu coba muat ulang profil Anda."}
          action={<Button variant="outline" onClick={() => void loadProfile()}>Coba lagi</Button>}
        />
      </div>
    );
  }

  const fullName = profile.full_name?.trim() || "Belum diisi";
  const displayedAvatar = avatarPreview ?? (removeAvatar ? null : profile.avatar_url);
  const initials = (profile.full_name || profile.organization_name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profil Saya"
        description="Kelola identitas akun dan informasi organisasi Anda."
        action={(
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="lg" onClick={chooseAvatar} disabled={isSaving}>
              <ImagePlus aria-hidden="true" />
              {profile.avatar_url ? "Ubah Foto" : "Tambah Foto"}
            </Button>
            {!isEditing && (
              <Button size="lg" onClick={beginEditing}>
                <PencilLine aria-hidden="true" />
                Edit Profil
              </Button>
            )}
          </div>
        )}
      />

      <Card>
        <CardContent className="space-y-8 p-6 sm:p-8">
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            aria-label="Pilih foto profil"
            disabled={isSaving}
            onChange={handleAvatarChange}
          />
          <div className="flex flex-col gap-5 border-b border-border pb-7 sm:flex-row sm:items-center">
            <div className="group/avatar relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-xl font-bold text-primary-foreground ring-4 ring-primary/10">
              {displayedAvatar ? (
                <OptimizedImage
                  src={displayedAvatar}
                  alt={`Foto profil ${profile.full_name || profile.organization_name}`}
                  fill
                  className="rounded-full object-cover"
                />
              ) : (
                initials || <UserRound className="size-7" aria-hidden="true" />
              )}
              <button
                type="button"
                onClick={chooseAvatar}
                disabled={isSaving}
                aria-label="Unggah foto profil dari perangkat"
                title="Unggah foto dari perangkat"
                className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-foreground/65 text-background opacity-0 transition-opacity duration-200 group-hover/avatar:opacity-100 group-focus-within/avatar:opacity-100 focus-visible:opacity-100 disabled:cursor-not-allowed max-sm:opacity-100"
              >
                <ImagePlus className="size-5" aria-hidden="true" />
                <span className="text-[9px] font-semibold leading-none">Unggah</span>
              </button>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
                {profile.full_name?.trim() || profile.organization_name}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {profile.username ? `@${profile.username}` : "Username belum diatur"}
                <span className="mx-2" aria-hidden="true">·</span>
                {ROLE_LABEL[profile.role]}
              </p>
              {isEditing && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {displayedAvatar && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setAvatarFile(null);
                        setAvatarToken(null);
                        setAvatarPreview(null);
                        setRemoveAvatar(true);
                      }}
                      disabled={isSaving}
                    >
                      <Trash2 aria-hidden="true" />
                      Hapus foto
                    </Button>
                  )}
                  <span className="w-full text-xs text-muted-foreground">
                    JPEG, PNG, atau WebP · maksimal 5 MB
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-2 text-sm font-medium text-foreground">
              <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
              {profile.role === "partner"
                ? profile.is_verified ? "Terverifikasi" : "Belum terverifikasi"
                : "Verifikasi tidak diperlukan"}
            </div>
          </div>

          {isEditing ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
                <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama lengkap</FormLabel>
                        <FormControl>
                          <Input autoComplete="name" placeholder="Nama lengkap Anda" disabled={isSaving} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input
                            autoComplete="username"
                            autoCapitalize="none"
                            spellCheck={false}
                            maxLength={24}
                            placeholder="contoh: dapur_baik"
                            disabled={isSaving}
                            {...field}
                            onChange={(event) => field.onChange(event.target.value.toLowerCase().replace(/\s/g, ""))}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">3–24 karakter: huruf kecil, angka, dan underscore.</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" value={profile.email} disabled readOnly />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Email tidak dapat diubah dari halaman profil.</p>
                  </FormItem>

                  <FormItem>
                    <FormLabel>Peran</FormLabel>
                    <FormControl>
                      <Input value={ROLE_LABEL[profile.role]} disabled readOnly />
                    </FormControl>
                  </FormItem>

                  <FormField
                    control={form.control}
                    name="organization_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama organisasi</FormLabel>
                        <FormControl>
                          <Input autoComplete="organization" disabled={isSaving} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="organization_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jenis organisasi</FormLabel>
                        <FormControl>
                          <Input placeholder="Contoh: Restoran, LSM" disabled={isSaving} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nomor telepon</FormLabel>
                        <FormControl>
                          <Input type="tel" autoComplete="tel" placeholder="+62 812 3456 7890" disabled={isSaving} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Alamat organisasi</FormLabel>
                        <FormControl>
                          <Input autoComplete="street-address" placeholder="Alamat organisasi" disabled={isSaving} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" size="lg" onClick={cancelEditing} disabled={isSaving}>
                    <X aria-hidden="true" />
                    Batal
                  </Button>
                  <Button type="submit" size="lg" disabled={isSaving}>
                    {isSaving && <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />}
                    {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <dl className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
              <ProfileDetail icon={UserRound} label="Nama lengkap" value={fullName} />
              <ProfileDetail icon={UserRound} label="Username" value={profile.username ? `@${profile.username}` : "Belum diatur"} />
              <ProfileDetail icon={Mail} label="Email" value={profile.email || "Tidak tersedia"} />
              <ProfileDetail icon={ShieldCheck} label="Peran" value={ROLE_LABEL[profile.role]} />
              <ProfileDetail
                icon={Building2}
                label="Nama organisasi"
                value={profile.organization_name || "Belum diisi"}
              />
              <ProfileDetail
                icon={Building2}
                label="Jenis organisasi"
                value={profile.organization_type || "Belum diisi"}
              />
              <ProfileDetail icon={Phone} label="Nomor telepon" value={profile.phone || "Belum diisi"} />
              <ProfileDetail icon={MapPin} label="Alamat organisasi" value={profile.address || "Belum diisi"} />
              <ProfileDetail
                icon={ShieldCheck}
                label="Status verifikasi"
                value={profile.role === "partner" ? (profile.is_verified ? "Terverifikasi" : "Belum terverifikasi") : "Verifikasi tidak diperlukan"}
              />
              <ProfileDetail icon={CalendarDays} label="Tanggal akun dibuat" value={formatDate(profile.created_at)} />
            </dl>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileDetail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
        <dd className="mt-1 break-words text-sm font-medium text-foreground">{value}</dd>
      </div>
    </div>
  );
}
