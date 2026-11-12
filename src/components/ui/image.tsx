"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  blurDataURL?: string;
  fill?: boolean;
  style?: React.CSSProperties;
}

/**
 * Optimized image component with blur placeholder and lazy loading.
 * Wraps next/image with sensible defaults for donation and reward photos.
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  blurDataURL,
  fill = false,
  style,
}: OptimizedImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      {...(!fill && { width, height })}
      className={cn(
        "rounded-xl object-cover",
        fill ? "absolute inset-0 w-full h-full" : "",
        className,
      )}
      priority={priority}
      blurDataURL={blurDataURL}
      fill={fill}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      style={style}
    />
  );
}

/**
 * Placeholder image for donations without a photo.
 * Uses a clean geometric SVG instead of a blank space.
 */
export function DonationPlaceholder({
  className = "w-full h-48",
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex size-full items-center justify-center rounded-xl border border-border bg-muted",
        className,
      )}
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-muted-foreground/50"
      >
        <path
          d="M16 4C11.58 4 8 7.58 8 12V20C8 24.42 11.58 28 16 28H20C24.42 28 28 24.42 28 20V12C28 7.58 24.42 4 20 4H16ZM16 6C12.69 6 10 8.69 10 12V20C10 23.31 12.69 26 16 26H20C23.31 26 26 23.31 26 20V12C26 8.69 23.31 6 20 6H16ZM16 14C17.11 14 18 13.11 18 12C18 10.89 17.11 10 16 10C14.89 10 14 10.89 14 12C14 13.11 14.89 14 16 14Z"
          className="text-muted-foreground/30"
        />
      </svg>
      <span className="mt-2 text-xs text-muted-foreground/60 font-medium">
        Tidak ada foto
      </span>
    </div>
  );
}
