import { createClient } from "@/lib/supabase/server";
import { getPrisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return json({ error: "Silakan masuk terlebih dahulu." }, 401);

    const { data: profile, error: profileError } = await supabase
      .from("profiles").select("role").eq("id", user.id).single();
    if (profileError) return json({ error: "Gagal memverifikasi akses." }, 503);
    if (!profile || (profile as { role: string }).role !== "admin") {
      return json({ error: "Akses hanya untuk admin." }, 403);
    }

    // Direct database access does not carry the user's Supabase RLS context.
    // Only execute these global aggregates after the server-side admin check.
    const db = getPrisma();
    const values = await Promise.all([
      db.profiles.count({ where: { role: "provider" } }),
      db.profiles.count({ where: { role: "partner" } }),
      db.profiles.count({ where: { role: "partner", is_verified: true } }),
      db.profiles.count({ where: { role: "partner", is_verified: false } }),
      db.donations.count(),
      db.donations.count({ where: { status: "available" } }),
      db.donations.count({ where: { status: "claimed" } }),
      db.donations.count({ where: { status: "delivered" } }),
      db.donations.count({ where: { status: "cancelled" } }),
      db.orders.count(),
      db.orders.count({ where: { status: "pending" } }),
      db.orders.count({ where: { status: "completed" } }),
    ]);
    const keys = [
      "totalProviders", "totalPartners", "verifiedPartners", "pendingPartners",
      "totalDonations", "availableDonations", "claimedDonations", "deliveredDonations",
      "cancelledDonations", "totalOrders", "pendingOrders", "completedOrders",
    ];
    return json(Object.fromEntries(keys.map((key, i) => [key, values[i]])));
  } catch {
    return json({ error: "Gagal memuat statistik admin." }, 500);
  }
}
