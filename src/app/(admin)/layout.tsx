import { AppShell } from "@/components/ui/app-shell";

export default function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell userRole="admin">{children}</AppShell>;
}
