"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingProps {
  rating: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const SIZE_CLASSES: Record<string, string> = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-5",
};

/** Tampilkan bintang rating (1-5) sebagai visual statis. */
export function Rating({ rating, size = "md", showLabel = false, className }: RatingProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = 5 - Math.ceil(rating);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[...Array(fullStars)].map((_, i) => (
        <Star key={i} className={cn(SIZE_CLASSES[size], "fill-primary text-primary")} aria-hidden="true" />
      ))}
      {hasHalfStar && (
        <svg
          width={SIZE_CLASSES[size] === "size-3.5" ? 14 : SIZE_CLASSES[size] === "size-4" ? 16 : 20}
          height={SIZE_CLASSES[size] === "size-3.5" ? 14 : SIZE_CLASSES[size] === "size-4" ? 16 : 20}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={cn(SIZE_CLASSES[size], "text-primary")}
        >
          <path
            d="M12 17.27L18.18 21.16L15.23 15.79L19.18 11.49L16.34 9.22L12 11.39L7.66 9.22L4.82 11.49L8.77 15.79L5.82 21.16L12 17.27Z"
            fill="currentColor"
            className="fill-primary text-primary"
          />
        </svg>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={i} className={cn(SIZE_CLASSES[size], "fill-muted text-muted-foreground")} aria-hidden="true" />
      ))}
      {showLabel && (
        <span className="ml-1 text-xs font-medium text-muted-foreground">{rating.toFixed(1)}</span>
      )}
    </div>
  );
}

/** Input rating interaktif: klik bintang untuk memilih nilai 1-5. */
interface RatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
}

export function RatingInput({
  value,
  onChange,
  size = "md",
  disabled = false,
  className,
}: RatingInputProps) {
  const SIZE_CLASSES_INPUT: Record<string, string> = {
    sm: "size-6",
    md: "size-8",
    lg: "size-10",
  };

  return (
    <div
      className={cn("flex items-center gap-1 flex-row-reverse", className)}
      role="radiogroup"
      aria-label="Rating"
    >
      {[5, 4, 3, 2, 1].map((star) => (
        <button
          key={star}
          type="button"
          aria-checked={value >= star}
          disabled={disabled}
          onClick={() => onChange(star)}
          className={cn(
            "flex items-center justify-center transition-colors duration-200",
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:text-primary",
            star <= value ? "text-primary" : "text-muted-foreground",
          )}
        >
          <Star className={cn(SIZE_CLASSES_INPUT[size], "fill-current")} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
