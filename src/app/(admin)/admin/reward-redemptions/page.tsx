import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminRewardRedemptionsClient from "./client";

export default async function AdminRewardRedemptionsPage() {
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

  return <AdminRewardRedemptionsClient />;
}
