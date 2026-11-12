"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChoiceChips } from "@/components/ui/choice-chips";
import { DonationCard } from "@/components/ui/donation-card";
import { FreshnessMeter } from "@/components/ui/freshness-meter";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Textarea } from "@/components/ui/textarea";
import { DonationImageUploader } from "@/components/ui/donation-image-uploader";
import { createClient } from "@/lib/supabase/client";
import { DONATION_CATEGORIES, DONATION_UNITS } from "@/lib/donation-options";

const donationSchema = z.object({
  food_name: z.string().min(2, "Nama makanan minimal 2 karakter"),
  category: z.string().min(1, "Pilih salah satu kategori"),
  quantity: z.string().refine(
    (val) => !isNaN(parseInt(val)) && parseInt(val) > 0,
    "Jumlah harus lebih dari 0"
  ),
  unit: z.string().min(1, "Satuan harus diisi"),
  expiry_time: z
    .string()
    .min(1, "Batas kelayakan harus diisi")
    .refine((val) => {
      const time = new Date(val).getTime();
      return !Number.isNaN(time) && time > Date.now();
    }, "Batas kelayakan harus di waktu yang akan datang"),
  pickup_address: z.string().min(5, "Alamat pengambilan minimal 5 karakter"),
  description: z.string().optional(),
});

type DonationFormData = z.infer<typeof donationSchema>;

// Cooked food is judged in hours, so the shortcuts are hours too.
const EXPIRY_PRESETS = [
  { label: "2 jam lagi", hours: 2 },
  { label: "4 jam lagi", hours: 4 },
  { label: "6 jam lagi", hours: 6 },
  { label: "12 jam lagi", hours: 12 },
];

/** Formats a Date the way <input type="datetime-local"> wants it, in the viewer's own time zone. */
function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const labelClass = "text-sm leading-none font-medium select-none";

export default function NewDonationPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [imageItems, setImageItems] = useState<{ file: File | null; url: string }[]>([]);
  const [location, setLocation] = useState<{ latitude: number | null; longitude: number | null }>({
    latitude: null,
    longitude: null,
  });
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const form = useForm<DonationFormData>({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      food_name: "",
      category: "",
      quantity: "",
      unit: "porsi",
      expiry_time: "",
      pickup_address: "",
      description: "",
    },
  });

  const values = useWatch({ control: form.control });
  const parsedExpiry = values.expiry_time ? new Date(values.expiry_time) : null;
  const previewExpiry =
    parsedExpiry && !Number.isNaN(parsedExpiry.getTime()) ? parsedExpiry.toISOString() : "";

  const handleImageChange = useCallback((items: { file: File | null; url: string }[]) => {
    setImageItems(items);
  }, []);

  const handleGetLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Browser Anda tidak mendukung fitur lokasi");
      return;
    }
    setIsFetchingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      toast.success("Lokasi berhasil diambil");
    } catch {
      toast.error("Gagal mengambil lokasi. Pastikan izin kamera/lokasi aktif atau isi alamat secara manual.");
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const handleClearLocation = () => {
    setLocation({ latitude: null, longitude: null });
  };

  const onSubmit = async (data: DonationFormData) => {
    setIsLoading(true);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        toast.error("Anda harus login terlebih dahulu");
        return;
      }

      // 1. Unggah foto baru ke Supabase Storage (hanya item yang memiliki File)
      let primaryImageUrl: string | null = null;

      const bucketName = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET_IMAGES ?? "donation-images";

      const newFiles = imageItems.filter((item) => item.file);
      if (newFiles.length > 0) {
        const uploadPromises = newFiles.map(async (item, index) => {
          const file = item.file!;
          const fileName = `${user.id}/${Date.now()}-${index}-${file.name.replace(/\s+/g, "_")}`;

          const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(fileName, file, {
              cacheControl: "3600",
              upsert: false,
            });

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName);

          return urlData.publicUrl;
        });

        const uploadedUrls = await Promise.all(uploadPromises);
        primaryImageUrl = uploadedUrls[0] ?? null;
      }

      // 2. Simpan donasi ke database
      const { error } = await supabase
        .from("donations")
        .insert({
          provider_id: user.id,
          food_name: data.food_name,
          category: data.category,
          quantity: parseInt(data.quantity),
          unit: data.unit,
          // The input has no time zone. Converting here pins it to the moment the person meant,
          // instead of letting the server read "18:00" as 18:00 UTC.
          expiry_time: new Date(data.expiry_time).toISOString(),
          pickup_address: data.pickup_address,
          description: data.description || null,
          image_url: primaryImageUrl,
          latitude: location.latitude,
          longitude: location.longitude,
          status: "available",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);

      if (error) throw error;

      // 3. Kirim notifikasi ke semua partner terverifikasi
      try {
        const { data: partners } = await supabase
          .from("profiles")
          .select("id")
          .eq("role", "partner")
          .eq("is_verified", true);

        if (partners && partners.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).from("notifications").insert(
            partners.map((p: any) => ({
              user_id: p.id,
              type: "new_donation",
              title: "Donasi baru tersedia",
              message: `${data.food_name} (${data.category}) telah ditambahkan oleh penyedia.`,
              data: JSON.stringify({ donation_type: "new_donation" }),
            }))
          );
        }
      } catch {
        // Gagal kirim notifikasi tidak boleh gagalkan donasi
      }

      // 4. Beri poin reward kepada penyedia (10 poin per donasi)
      try {
        const POINTS_PER_DONATION = 10;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: pointsError } = await (supabase as any).rpc("add_points", {
          p_user_id: user.id,
          p_amount: POINTS_PER_DONATION,
          p_description: `Donasi "${data.food_name}"`,
        });
        if (pointsError) {
          // Gagal beri poin tidak boleh gagalkan donasi
          console.error("Add points error:", pointsError);
        }
      } catch {
        // Abaikan error poin
      }

      toast.success("Donasi berhasil dibuat +10 poin!");
      router.push("/provider/donations");
      // Force reload agar data terbaru muncul
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || "Gagal membuat donasi");
      } else {
        toast.error("Gagal membuat donasi");
      }
      console.error("Create donation error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Buat donasi"
        description="Catat makanan yang tersisa. Tambahkan foto agar mitra bisa melihat kondisi donasi sebelum mengklaimnya."
        backHref="/provider/donations"
        backLabel="Semua donasi"
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <Card>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
                <FormField
                  control={form.control}
                  name="food_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama makanan</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Nasi goreng spesial" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <span className={labelClass}>Kategori</span>
                      <ChoiceChips
                        label="Kategori"
                        value={field.value}
                        onChange={field.onChange}
                        options={DONATION_CATEGORIES.map((category) => ({ value: category, label: category }))}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-6 sm:grid-cols-[10rem_minmax(0,1fr)]">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jumlah</FormLabel>
                        <FormControl>
                          <Input type="number" inputMode="numeric" min={1} placeholder="50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <span className={labelClass}>Satuan</span>
                        <ChoiceChips
                          label="Satuan"
                          value={field.value}
                          onChange={field.onChange}
                          options={DONATION_UNITS.map((unit) => ({ value: unit, label: unit }))}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="expiry_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batas kelayakan</FormLabel>
                      <FormDescription>Sampai kapan makanan ini masih aman dikonsumsi?</FormDescription>
                      <div className="flex flex-wrap gap-2">
                        {EXPIRY_PRESETS.map((preset) => (
                          <Button
                            key={preset.hours}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              form.setValue(
                                "expiry_time",
                                toLocalInputValue(new Date(Date.now() + preset.hours * 60 * 60 * 1000)),
                                { shouldValidate: true, shouldDirty: true }
                              )
                            }
                          >
                            {preset.label}
                          </Button>
                        ))}
                      </div>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      {previewExpiry && (
                        <div className="rounded-xl bg-muted px-4 py-3">
                          <FreshnessMeter expiryTime={previewExpiry} />
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pickup_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alamat pengambilan</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Jl. Contoh No. 123, Kota, Provinsi"
                          className="min-h-20 resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Kondisi makanan <span className="font-normal text-muted-foreground">(opsional)</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Contoh: Masih hangat, dikemas dalam kotak sekali pakai"
                          className="min-h-24 resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Lokasi pengambilan: opsional, bisa diambil dari browser atau diisi manual */}
                <div className="space-y-2">
                  <FormLabel>Lokasi pengambilan</FormLabel>
                  <FormDescription>
                    Ambil lokasi otomatis dari browser atau isi secara manual. Mitra akan melihat lokasi ini di peta
                    saat meninjau donasi Anda. (Opsional)
                  </FormDescription>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <label className="text-sm font-medium text-foreground">Latitude</label>
                      <Input
                        type="number"
                        step="any"
                        placeholder="Contoh: -6.2088"
                        value={String(location.latitude ?? "")}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLocation({ ...location, latitude: val === "" ? null : parseFloat(val) });
                        }}
                        disabled={isFetchingLocation}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-sm font-medium text-foreground">Longitude</label>
                      <Input
                        type="number"
                        step="any"
                        placeholder="Contoh: 106.8456"
                        value={String(location.longitude ?? "")}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLocation({ ...location, longitude: val === "" ? null : parseFloat(val) });
                        }}
                        disabled={isFetchingLocation}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGetLocation}
                      disabled={isFetchingLocation}
                      className="w-full sm:w-auto"
                    >
                      {isFetchingLocation ? <Loader2 className="animate-spin size-4" aria-hidden="true" /> : null}
                      {isFetchingLocation ? "Mengambil..." : "Ambil lokasi saya"}
                    </Button>
                    {location.latitude !== null && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleClearLocation}
                        className="w-full sm:w-auto"
                      >
                        Hapus
                      </Button>
                    )}
                  </div>
                  {location.latitude !== null && location.longitude !== null && (
                    <p className="text-xs text-muted-foreground">
                      Lokasi disimpan: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                    </p>
                  )}
                </div>

                {/* Foto donasi: unggah dari galeri atau ambil lewat kamera real-time */}
                <div className="space-y-2">
                  <FormLabel>Foto donasi</FormLabel>
                  <FormDescription>
                    Ambil foto langsung dari kamera atau unggah dari galeri. Mitra akan melihat foto ini saat
                    meninjau donasi Anda.
                  </FormDescription>
                  <DonationImageUploader onChange={handleImageChange} />
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
                  <Link href="/provider/donations" className={buttonVariants({ variant: "outline", size: "lg" })}>
                    Batal
                  </Link>
                  <Button type="submit" size="lg" disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Save aria-hidden="true" />}
                    {isLoading ? "Menyimpan..." : "Buat donasi"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* A live preview of the card partners will see. Decorative: nothing in it can be clicked. */}
        <aside className="hidden lg:sticky lg:top-8 lg:block" aria-label="Pratinjau untuk mitra">
          <p className="mb-3 text-sm font-semibold text-muted-foreground">Begini tampilannya untuk mitra</p>
          <div inert aria-hidden="true" className="pointer-events-none select-none">
            {imageItems.length > 0 && (
              <div className="mb-4">
                <img
                  src={imageItems[0].url}
                  alt="Pratinjau foto donasi"
                  className="w-full h-32 object-cover rounded-xl border border-border"
                />
              </div>
            )}
            <DonationCard
              href="#"
              foodName={values.food_name || "Nama makanan"}
              category={values.category || "Kategori"}
              quantity={Number(values.quantity) || 0}
              unit={values.unit || "porsi"}
              providerName="Organisasi Anda"
              expiryTime={previewExpiry}
              address={values.pickup_address || undefined}
              description={values.description || undefined}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
