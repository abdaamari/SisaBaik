import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const supabase = await createClient();
  if (code && !url.searchParams.has("error")) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
        if (!profileError) {
          const profile = data as { role: string } | null;
          const destination = profile && ["provider", "partner", "admin"].includes(profile.role)
            ? `/${profile.role}/dashboard` : "/complete-profile";
          return NextResponse.redirect(new URL(destination, url.origin));
        }
      }
    }
  }
  return NextResponse.redirect(new URL("/login?oauth_error=1", url.origin));
}
