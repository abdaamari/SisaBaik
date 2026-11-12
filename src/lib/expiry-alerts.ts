"use client";

import { createClient } from "@/lib/supabase/client";
import { isExpiringSoon, needsExpiryNotification } from "@/lib/expiry";
import { toast } from "sonner";

/**
 * Mengecek donasi yang akan kadaluwarsa segera dan mengirim notifikasi
 * kepada provider maupun partner yang terkait.
 * Dipanggil saat dashboard dimuat agar notifikasi terkirim tepat waktu.
 */
export async function checkAndSendExpiryAlerts(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase: any = createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Ambil profil user untuk mengetahui role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile) return;

    const now = new Date().toISOString();
    const twentyFourHoursFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    if (profile.role === "provider") {
      // --- Provider: donasi mereka yang akan kadaluwarsa ---
      const { data: donations, error } = await supabase
        .from("donations")
        .select("id, food_name, expiry_time, expiry_notified_at")
        .eq("provider_id", user.id)
        .eq("status", "available")
        .gte("expiry_time", now)
        .lte("expiry_time", twentyFourHoursFromNow);

      if (error) throw error;

      for (const d of (donations ?? [])) {
        if (!needsExpiryNotification(d.expiry_time, d.expiry_notified_at)) continue;

        const hoursLeft = Math.round(
          (new Date(d.expiry_time).getTime() - Date.now()) / (1000 * 60 * 60)
        );

        await supabase.from("notifications").insert({
          user_id: user.id,
          type: "system",
          title: "Donasi segera kadaluwarsa",
          message: `"${d.food_name}" akan kadaluwarsa dalam ${hoursLeft} jam. Segera klaim atau ambil kembali.`,
          data: JSON.stringify({ donation_id: d.id, type: "expiry_warning" }),
        });

        // Tandai sudah diberi notifikasi
        await supabase
          .from("donations")
          .update({ expiry_notified_at: now })
          .eq("id", d.id);

        toast.warning(`"${d.food_name}" akan kadaluwarsa dalam ${hoursLeft} jam!`);
      }
    } else if (profile.role === "partner") {
      // --- Partner: order mereka yang donasi-nya akan kadaluwarsa ---
      const { data: orders, error } = await supabase
        .from("orders")
        .select(
          `id, status, claimed_at,
           donations!inner(id, food_name, expiry_time, expiry_notified_at, provider_id)`
        )
        .eq("partner_id", user.id)
        .in("status", ["pending", "in_transit"])
        .gte("donations.expiry_time", now)
        .lte("donations.expiry_time", twentyFourHoursFromNow);

      if (error) throw error;

      for (const o of (orders ?? [])) {
        const donation = (o as any).donations?.[0];
        if (!donation) continue;
        if (!needsExpiryNotification(donation.expiry_time, donation.expiry_notified_at)) continue;

        const hoursLeft = Math.round(
          (new Date(donation.expiry_time).getTime() - Date.now()) / (1000 * 60 * 60)
        );

        await supabase.from("notifications").insert({
          user_id: user.id,
          type: "system",
          title: "Donasi yang Anda klaim segera kadaluwarsa",
          message: `"${donation.food_name}" akan kadaluwarsa dalam ${hoursLeft} jam. Segera ambil sebelum tidak dapat dikonsumsi.`,
          data: JSON.stringify({ donation_id: donation.id, type: "expiry_warning" }),
        });

        // Tandai sudah diberi notifikasi
        await supabase
          .from("donations")
          .update({ expiry_notified_at: now })
          .eq("id", donation.id);

        toast.warning(`"${donation.food_name}" akan kadaluwarsa dalam ${hoursLeft} jam!`);
      }
    }
  } catch (err: unknown) {
    // Jangan tampilkan error toast untuk expiry alerts, ini fitur background
    console.error("Expiry alert check failed:", err);
  }
}
