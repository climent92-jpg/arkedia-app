import { AppShell } from "@/components/app-shell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell role="admin" userName="Direcció ARK#ÈDIA">
      {children}
    </AppShell>
  );
}
