import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminVerificationClient from "./client";

/**
 * Server Component: memastikan hanya user dengan role 'admin' yang bisa
 * mengakses halaman verifikasi mitra. Jika bukan admin, redirect ke '/'.
 */
export default async function AdminVerificationPage() {
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

  return <AdminVerificationClient />;
}

