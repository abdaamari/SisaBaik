"use client";

import { Suspense, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Building2, Calendar, Clock, Hash, Loader2, MapPin, Package, Tag } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { FreshnessMeter } from "@/components/ui/freshness-meter";
import { InfoItem } from "@/components/ui/info-item";
import { Notice } from "@/components/ui/notice";
import { OptimizedImage } from "@/components/ui/image";
import { PageHeader } from "@/components/ui/page-header";
import { PageLoader } from "@/components/ui/page-loader";
import { Rating } from "@/components/ui/rating";
import { ReviewForm } from "@/components/ui/review-form";
import { ReviewList } from "@/components/ui/review-list";
import { StatusBadge } from "@/components/ui/status-badge";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { formatDateTime, getProviderName, type ProfileRef } from "@/lib/format";

// Import Leaflet CSS (diperlukan untuk tampilan peta)
import "leaflet/dist/leaflet.css";

interface PartnerDonationDetail {
  id: string;
  provider_id: string;
  food_name: string;
  category: string;
  quantity: number;
  unit: string;
  status: string;
  expiry_time: string;
  pickup_address: string;
  description: string | null;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  profiles: ProfileRef;
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [hasCompletedOrder, setHasCompletedOrder] = useState<boolean | null>(null);
  const mapRef = useRef<any>(null);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setNotFound(false);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setCurrentUserId(user.id);
      const { data: profile } = await supabase.from("profiles").select("is_verified").eq("id", user.id).single() as { data: { is_verified: boolean } | null };
      setIsVerified(profile ? !!profile.is_verified : false);
      const { data, error } = await supabase.from("donations").select("id, provider_id, food_name, category, quantity, unit, status, expiry_time, pickup_address, description, image_url, latitude, longitude, created_at, profiles!donations_provider_id_fkey(organization_name)").eq("id", id).single();
      if (error || !data) { setNotFound(true); return; }
      const row = data as unknown as PartnerDonationDetail;
      if (row.status !== "available" || new Date(row.expiry_time) <= new Date()) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: order } = await (supabase as any).from("orders").select("id, status").eq("donation_id", id).eq("partner_id", user.id).maybeSingle();
        if (!order) { setNotFound(true); return; }
        setHasCompletedOrder(order.status === "completed");
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

  // Invalidate ukuran peta Leaflet setelah dimuat agar marker tampil dengan benar
  useEffect(() => {
    if (mapRef.current && donation?.latitude !== null && donation?.longitude !== null) {
      mapRef.current.invalidateSize();
    }
  }, [donation?.latitude, donation?.longitude]);

  const handleClaim = async () => {
    if (!donation || !isVerified) return;
    setClaiming(true);
    try {
      const { data, error } = await (supabase as unknown as { rpc: (n: string, a: Record<string, string>) => Promise<{ data: { success: boolean; error?: string }; error: unknown }> }).rpc("claim_donation", { p_donation_id: donation.id }) as { data: { success: boolean; error?: string } | null; error: unknown };
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error ?? "Gagal mengklaim");

      // Kirim notifikasi ke provider pemilik donasi
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).from("notifications").insert({
            user_id: donation.provider_id,
            type: "donation_claimed",
            title: "Donasi Anda diklaim",
            message: `"${donation.food_name}" telah diklaim oleh mitra. Silakan hubungi mitra untuk penjemputan.`,
            data: JSON.stringify({ donation_id: donation.id, claimed_by: user.id }),
          });
        } catch {
          // Gagal kirim notifikasi tidak boleh gagalkan klaim
        }
      }

      toast.success("Donasi berhasil diklaim!");
      setConfirmOpen(false);
      router.push("/partner/orders");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengklaim donasi";
      toast.error(msg);
    } finally { setClaiming(false); }
  };

  if (isLoading) return <PageLoader variant="detail" label="Memuat detail donasi" />;

  if (notFound || !donation) {
    return (
      <div>
        <PageHeader title="Donasi tidak tersedia" backHref="/partner/donations" backLabel="Donasi tersedia" />
        <EmptyState
          icon={<Package className="size-6" />}
          title="Donasi tidak tersedia"
          description="Donasi ini tidak ditemukan, sudah kedaluwarsa, atau sudah diklaim mitra lain."
          action={
            <Link href="/partner/donations" className={buttonVariants()}>
              Lihat donasi tersedia
            </Link>
          }
        />
      </div>
    );
  }

  const providerName = getProviderName(donation.profiles);
  const canClaim = donation.status === "available" && new Date(donation.expiry_time) > new Date();

  return (
    <div>
      <PageHeader
        title={donation.food_name}
        description={`${donation.category}, dari ${providerName}`}
        backHref="/partner/donations"
        backLabel="Donasi tersedia"
        action={<StatusBadge status={donation.status} />}
      />

      <div className="space-y-6">
        {isVerified === false && (
          <Notice title="Akun Anda belum diverifikasi">
            Anda bisa melihat detail, tetapi klaim aktif setelah admin menyetujui akun Anda.
          </Notice>
        )}

        <Card>
          <CardContent className="space-y-8">
            {donation.image_url && (
              <section aria-label="Foto donasi">
                <p className="mb-2 text-sm font-semibold text-muted-foreground">Foto donasi</p>
                <OptimizedImage
                  src={donation.image_url}
                  alt={donation.food_name}
                  width={600}
                  height={400}
                  className="w-full h-48 object-cover rounded-xl border border-border bg-muted"
                />
              </section>
            )}

            {(donation.latitude !== null && donation.latitude !== undefined && donation.longitude !== null && donation.longitude !== undefined) && (
              <section aria-label="Lokasi donasi">
                <p className="mb-2 text-sm font-semibold text-muted-foreground">Lokasi pengambilan</p>
                <MapContainer
                  center={[donation.latitude!, donation.longitude!]}
                  zoom={15}
                  ref={mapRef}
                  className="w-full h-64 rounded-xl border border-border"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[donation.latitude!, donation.longitude!]}>
                    <Popup>
                      <span className="font-medium">{donation.food_name}</span>
                      <p className="text-xs text-muted-foreground mt-1">
                        {donation.pickup_address}
                      </p>
                    </Popup>
                  </Marker>
                </MapContainer>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const url = `https://www.google.com/maps/search/?api=1&query=${donation.latitude},${donation.longitude}`;
                      window.open(url, "_blank");
                    }}
                  >
                    <MapPin className="mr-2 size-4" aria-hidden="true" />
                    Buka di Google Maps
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const url = `https://www.google.com/maps/dir/?api=1&destination=${donation.latitude},${donation.longitude}&travelmode=driving`;
                      window.open(url, "_blank");
                    }}
                  >
                    Arahkan rute
                  </Button>
                </div>
              </section>
            )}

            {donation.status === "available" && (
              <section aria-label="Sisa waktu">
                <p className="mb-2 text-sm font-semibold text-muted-foreground">Sisa waktu layak konsumsi</p>
                <FreshnessMeter expiryTime={donation.expiry_time} clock size="lg" />
              </section>
            )}

            <dl className="grid gap-6 sm:grid-cols-2">
              <InfoItem icon={Building2} label="Penyedia">
                {providerName}
              </InfoItem>
              <InfoItem icon={Tag} label="Kategori">
                {donation.category}
              </InfoItem>
              <InfoItem icon={Hash} label="Jumlah">
                <span className="tabular-nums">
                  {donation.quantity} {donation.unit}
                </span>
              </InfoItem>
              <InfoItem icon={Clock} label="Batas kelayakan">
                {formatDateTime(donation.expiry_time)}
              </InfoItem>
              <InfoItem icon={MapPin} label="Alamat pengambilan" className="sm:col-span-2">
                <span className="whitespace-pre-wrap">{donation.pickup_address}</span>
              </InfoItem>
              <InfoItem icon={Calendar} label="Dicatat">
                {formatDateTime(donation.created_at)}
              </InfoItem>
            </dl>

            {donation.description && (
              <section aria-label="Deskripsi kondisi" className="rounded-xl bg-muted p-4">
                <p className="text-xs font-semibold text-muted-foreground">Kondisi makanan</p>
                <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap text-foreground">{donation.description}</p>
              </section>
            )}

            {donation.status !== "available" && (
              <section aria-label="Ulasan donasi">
                <ReviewList donationId={donation.id} />
                {currentUserId && hasCompletedOrder && (
                  <ReviewForm
                    donationId={donation.id}
                    providerId={donation.provider_id}
                    onSuccess={() => void fetchDetail()}
                  />
                )}
              </section>
            )}

            <div className="flex flex-wrap items-center gap-3 border-t border-border pt-6">
              {canClaim ? (
                <Button size="lg" onClick={() => setConfirmOpen(true)} disabled={isVerified === false || claiming}>
                  {claiming && <Loader2 className="animate-spin" aria-hidden="true" />}
                  Klaim donasi
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">Klaim hanya untuk donasi yang masih tersedia dan belum kedaluwarsa.</p>
              )}
              <Link href="/partner/donations" className={buttonVariants({ variant: "outline", size: "lg", className: "sm:ml-auto" })}>
                Kembali ke daftar
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Klaim donasi ini?"
        description={`Anda akan bertanggung jawab menjemput "${donation.food_name}" dari ${providerName}.`}
        confirmLabel="Klaim donasi"
        loading={claiming}
        onConfirm={handleClaim}
      />
    </div>
  );
}

export default function PartnerDonationDetailPage() {
  return (
    <Suspense fallback={<PageLoader variant="detail" label="Memuat detail donasi" />}>
      <PartnerDonationDetailInner />
    </Suspense>
  );
}
