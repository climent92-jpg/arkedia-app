import { AppShell } from "@/components/app-shell";

export default function ProfessorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell role="professor" userName="Noelia Fernández">
      {children}
    </AppShell>
  );
}
