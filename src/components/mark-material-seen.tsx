"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { markMaterialSeen } from "@/lib/nav-badges-actions";

// No renderitza res: només avisa el servidor, en obrir la pàgina, que
// l'usuari ja ha vist el material actual, i refresca el layout (via
// router.refresh()) perquè el comptador del menú baixi a 0 a l'instant en
// lloc d'esperar a la propera navegació.
export function MarkMaterialSeen() {
  const router = useRouter();
  useEffect(() => {
    markMaterialSeen().then(() => router.refresh());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
