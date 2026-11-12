"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RatingInput } from "@/components/ui/rating";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ReviewFormProps {
  donationId: string;
  providerId: string;
  onSuccess?: () => void;
  className?: string;
}

/** Form untuk partner memberikan rating dan ulasan setelah donasi disalurkan. */
export function ReviewForm({
  donationId,
  providerId,
  onSuccess,
  className,
}: ReviewFormProps) {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      toast.error("Pilih rating 1-5 bintang");
      return;
    }
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Anda harus login untuk memberi ulasan");
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("reviews").insert({
        donation_id: donationId,
        partner_id: user.id,
        provider_id: providerId,
        rating,
        comment: comment || null,
      });
      if (error) throw error;
      toast.success("Terima kasih atas ulasan Anda!");
      setRating(0);
      setComment("");
      onSuccess?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal mengirim ulasan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={cn("max-w-lg mx-auto", className)}>
      <CardHeader>
        <CardTitle>Beri Ulasan Donasi</CardTitle>
        <p className="text-sm text-muted-foreground">
          Bantu provider lain dengan berbagi pengalaman Anda.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Rating</label>
            <RatingInput value={rating} onChange={setRating} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Komentar (opsional)</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Bagaimana pengalaman Anda dengan donasi ini? Misalnya: Makanan masih segar, kemasan rapi, dll."
              rows={4}
              className="resize-none"
            />
          </div>
          <Button
            type="submit"
            disabled={!rating || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Mengirim..." : "Kirim Ulasan"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
