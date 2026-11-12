"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { User, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Rating } from "@/components/ui/rating";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";

interface Review {
  id: string;
  partner_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles: {
    organization_name: string;
  } | null;
}

interface ReviewListProps {
  donationId: string;
  className?: string;
}

/** Tampilkan daftar ulasan untuk satu donasi. */
export function ReviewList({ donationId, className }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    let active = true;
    const fetchReviews = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("reviews")
          .select("*, profiles(organization_name)")
          .eq("donation_id", donationId)
          .order("created_at", { ascending: false });
        if (error) throw error;

        const formatted: Review[] = (data ?? []).map((r: any) => ({
          id: r.id,
          partner_id: r.partner_id,
          rating: r.rating,
          comment: r.comment,
          created_at: r.created_at,
          profiles: r.profiles?.[0] ?? r.profiles ?? null,
        }));
        setReviews(formatted);

        if (formatted.length > 0) {
          const avg =
            formatted.reduce((sum, r) => sum + r.rating, 0) / formatted.length;
          setAverageRating(Math.round(avg * 10) / 10);
        } else {
          setAverageRating(0);
        }
      } catch {
        toast.error("Gagal memuat ulasan");
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void fetchReviews();
    return () => {
      active = false;
    };
  }, [donationId, supabase]);

  if (isLoading) return null;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-lg font-extrabold leading-tight text-foreground">
            Ulasan Donasi
          </h3>
          <p className="text-sm text-muted-foreground">
            {reviews.length} ulasan •
            {averageRating > 0 ? `Rata-rata ${averageRating.toFixed(1)}` : "Belum ada rating"}
          </p>
        </div>
        {averageRating > 0 && (
          <Rating rating={averageRating} size="sm" showLabel />
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          Belum ada ulasan untuk donasi ini.
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <Card key={review.id} className="p-4">
              <CardContent>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <User className="size-4" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {review.profiles?.organization_name ?? "Mitra"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(review.created_at)}
                    </p>
                  </div>
                  <Rating rating={review.rating} size="sm" />
                </div>
                {review.comment && (
                  <p className="text-sm leading-relaxed text-foreground/90">
                    {review.comment}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
