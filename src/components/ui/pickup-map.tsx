"use client";

import { MapPin, Navigation } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

interface PickupMapProps {
  latitude: number | null;
  longitude: number | null;
  address: string;
}

export function PickupMap({ latitude, longitude, address }: PickupMapProps) {
  const hasCoordinates = typeof latitude === "number" && Number.isFinite(latitude)
    && Math.abs(latitude) <= 90 && typeof longitude === "number"
    && Number.isFinite(longitude) && Math.abs(longitude) <= 180;
  const destination = hasCoordinates ? `${latitude},${longitude}` : address.trim();
  if (!destination) return <p className="text-sm text-muted-foreground">Lokasi pengambilan belum tersedia.</p>;

  const mapUrl = hasCoordinates
    ? `https://www.openstreetmap.org/export/embed.html?${new URLSearchParams({
      bbox: `${Math.max(-180, longitude! - 0.008)},${Math.max(-90, latitude! - 0.008)},${Math.min(180, longitude! + 0.008)},${Math.min(90, latitude! + 0.008)}`,
      layer: "mapnik",
      marker: destination,
    })}` : null;

  return (
    <div className="space-y-3">
      {mapUrl ? (
        <iframe
          title={`Peta lokasi pengambilan: ${address || destination}`}
          src={mapUrl}
          loading="lazy"
          className="h-64 w-full rounded-xl border border-border"
        />
      ) : (
        <p className="text-sm text-muted-foreground">Titik peta belum disimpan. Cari alamat pengambilan melalui Google Maps.</p>
      )}
      <div className="flex flex-wrap gap-2">
        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`}
          target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline" })}>
          <MapPin aria-hidden="true" />Buka Google Maps
        </a>
        <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`}
          target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline" })}>
          <Navigation aria-hidden="true" />Petunjuk arah
        </a>
      </div>
    </div>
  );
}
