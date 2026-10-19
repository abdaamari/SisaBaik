import { AppShell } from "@/components/ui/app-shell";

export default function PartnerGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell userRole="partner">{children}</AppShell>;
}
