import { AppShell } from "@/components/app-shell";

export default function FamiliaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell role="familia" userName="Família Ramírez Alegría">
      {children}
    </AppShell>
  );
}
