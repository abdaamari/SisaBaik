import { AppShell } from "@/components/ui/app-shell";

export default function ProviderGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell userRole="provider">{children}</AppShell>;
}
