import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { pathname } = request.nextUrl;

  // Validate session with Auth server (not just cookie)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const publicRoutes = ["/", "/login", "/register"];

  // Public routes: show the page as‑is (no automatic redirect).
  // The login page itself now handles post‑login navigation based on role.
  if (publicRoutes.includes(pathname)) {
    // Simply continue to render the requested public component.
    return supabaseResponse;
  }


  // Protected routes: require auth
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Fetch profile for RBAC
  const { data: profileData, error: profileError } = (await supabase
    .from("profiles")
    .select("role, is_verified")
    .eq("id", user.id)
    .single()) as {
    data: { role: "provider" | "partner" | "admin"; is_verified: boolean } | null;
    error: Error | null;
  };

  if (profileError || !profileData) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { role } = profileData;

  // Role-based route protection — server-side, not UI only
  if (pathname.startsWith("/provider/") && role !== "provider") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname.startsWith("/partner/") && role !== "partner") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname.startsWith("/admin/") && role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Unverified partners: middleware allows browsing, claim is blocked at DB via RPC.
  // No dead-code check for "/[id]" — protection is in RLS + claim_donation() SECURITY DEFINER.

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
