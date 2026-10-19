import { Suspense } from "react";
import { AppShell } from "@/components/ui/app-shell";
import { PageLoader } from "@/components/ui/page-loader";

// AppShell memakai usePathname() (client hook runtime) — bungkus dalam Suspense
// agar prerender bisa stream shell statis, lalu AppShell masuk di client.
export default function ProviderGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<PageLoader variant="dashboard" />}>
      <AppShell userRole="provider">{children}</AppShell>
    </Suspense>
  );
}
