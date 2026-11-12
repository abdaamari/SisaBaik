import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminOrdersClient from "./client";

// Halaman admin harus dirender pada saat request (bukan saat build)
// karena memeriksa autentikasi dan cookies pengguna.
export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = (await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()) as { data: { role: string } | null; error: Error | null };

  if (profileError || !profile || profile.role !== "admin") {
    redirect("/");
  }

  return <AdminOrdersClient />;
}
