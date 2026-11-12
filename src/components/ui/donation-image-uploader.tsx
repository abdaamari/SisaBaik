"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, X, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_IMAGES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

export interface DonationImageUploaderProps {
  /** URLs foto yang sudah ada (dari database saat edit). */
  initialUrls?: string[];
  /** Callback saat daftar foto berubah (array of File untuk upload baru + URL untuk yang sudah ada). */
  onChange: (files: { file: File | null; url: string }[]) => void;
  className?: string;
}

export function DonationImageUploader({
  initialUrls = [],
  onChange,
  className,
}: DonationImageUploaderProps) {
  const [files, setFiles] = useState<{ file: File | null; url: string }[]>(
    initialUrls.map((url) => ({ file: null, url }))
  );
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Membersihkan stream saat komponen unmount atau kamera ditutup
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setVideoSrc(null);
    };
  }, []);

  useEffect(() => {
    if (!isCameraOpen && streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setVideoSrc(null);
    }
  }, [isCameraOpen]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setVideoSrc("ready");
      }
    } catch (err) {
      setCameraError(
        "Tidak dapat mengakses kamera. Pastikan izin kamera sudah diberikan atau gunakan unggah foto."
      );
      console.error("Camera access error:", err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setVideoSrc(null);
    setIsCameraOpen(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !streamRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `donasi-${Date.now()}.jpg`, { type: "image/jpeg" });
        const url = URL.createObjectURL(blob);
        setFiles((prev) => {
          if (prev.length >= MAX_IMAGES) return prev;
          const next = [...prev, { file, url }];
          onChange(next);
          return next;
        });
        stopCamera();
      },
      "image/jpeg",
      0.9
    );
  }, [onChange, stopCamera]);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files || []);
      setFiles((prev) => {
        let next = [...prev];
        for (const file of selected) {
          if (next.length >= MAX_IMAGES) break;
          if (!ACCEPTED_TYPES.includes(file.type)) {
            toast.error(`Tipe file tidak didukung: ${file.name}`);
            continue;
          }
          if (file.size > MAX_FILE_SIZE) {
            toast.error(`File terlalu besar (maks 5 MB): ${file.name}`);
            continue;
          }
          next = [...next, { file, url: URL.createObjectURL(file) }];
        }
        onChange(next);
        return next;
      });
      e.target.value = ""; // reset agar file yang sama bisa dipilih lagi
    },
    [onChange]
  );

  const removeImage = useCallback(
    (index: number) => {
      setFiles((prev) => {
        const removed = prev[index];
        if (removed.file) {
          URL.revokeObjectURL(removed.url);
        }
        const next = prev.filter((_, i) => i !== index);
        onChange(next);
        return next;
      });
    },
    [onChange]
  );

  const openCamera = useCallback(() => {
    if (files.length >= MAX_IMAGES) {
      toast.error(`Maksimal ${MAX_IMAGES} foto per donasi`);
      return;
    }
    setIsCameraOpen(true);
    startCamera();
  }, [files.length, startCamera]);

  const isFull = files.length >= MAX_IMAGES;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap gap-2">
        {/* Tombol unggah dari file */}
        <label
          className={cn(
            "flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 text-sm text-muted-foreground hover:border-primary hover:text-primary hover:bg-muted/50 transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none",
            isFull ? "opacity-50 pointer-events-none" : ""
          )}
        >
          <input
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            multiple
            onChange={handleFileInput}
            className="sr-only"
            disabled={isFull}
          />
          <Upload className="size-5 mb-1" aria-hidden="true" />
          Unggah foto
        </label>

        {/* Tombol ambil foto dari kamera */}
        {!isFull && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openCamera}
            disabled={cameraError !== null || isCameraOpen}
            className="flex items-center gap-2"
          >
            <Camera className="size-4" aria-hidden="true" />
            {cameraError ? "Kamera tidak tersedia" : "Ambil foto"}
          </Button>
        )}

        {isFull && (
          <span className="text-xs text-muted-foreground mt-1">
            Maksimal {MAX_IMAGES} foto tercapai
          </span>
        )}
      </div>

      {/* Pratinjau foto */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {files.map((item, index) => (
          <div
            key={index}
            className="relative aspect-square rounded-xl overflow-hidden border border-border bg-muted"
          >
            <img src={item.url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-1 right-1 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              aria-label="Hapus foto"
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>

      {/* Modal kamera */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="relative w-full max-w-md aspect-video rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
              muted
            />
            {cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-6 text-center">
                <p className="mb-4">{cameraError}</p>
                <Button variant="outline" onClick={stopCamera} className="w-auto">
                  Tutup
                </Button>
              </div>
            )}
          </div>
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <Button variant="outline" onClick={stopCamera}>
              Batal
            </Button>
            <Button onClick={capturePhoto} disabled={Boolean(!videoSrc || cameraError)}>
              Ambil foto
            </Button>
          </div>
          <p className="mt-2 text-xs text-white/70 text-center">
            Arahkan kamera ke makanan, lalu tepat "Ambil foto"
          </p>
        </div>
      )}
    </div>
  );
}
