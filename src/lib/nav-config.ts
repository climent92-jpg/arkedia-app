import {
  CalendarDays,
  CheckSquare,
  FolderOpen,
  LayoutDashboard,
  MessageCircle,
  Megaphone,
  UploadCloud,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const navByRole: Record<UserRole, NavItem[]> = {
  familia: [
    { href: "/familia", label: "Horari", icon: CalendarDays },
    { href: "/familia/deures", label: "Deures", icon: CheckSquare },
    { href: "/familia/material", label: "Material", icon: FolderOpen },
    { href: "/familia/xat", label: "Xat", icon: MessageCircle },
  ],
  professor: [
    { href: "/professor", label: "Agenda", icon: CalendarDays },
    { href: "/professor/alumnes", label: "Alumnes", icon: Users },
    { href: "/professor/deures", label: "Deures", icon: CheckSquare },
    { href: "/professor/material", label: "Material", icon: FolderOpen },
    { href: "/professor/xat", label: "Xat", icon: MessageCircle },
  ],
  admin: [
    { href: "/admin", label: "Panell", icon: LayoutDashboard },
    { href: "/admin/importador", label: "Importador", icon: UploadCloud },
    { href: "/admin/usuaris", label: "Usuaris", icon: Users },
    { href: "/admin/avisos", label: "Avisos", icon: Megaphone },
  ],
};

export const roleLabel: Record<UserRole, string> = {
  familia: "Família",
  professor: "Professor/a",
  admin: "Administració",
};
