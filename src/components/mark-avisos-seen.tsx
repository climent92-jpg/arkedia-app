"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { markAvisosSeen } from "@/lib/nav-badges-actions";

// No renderitza res: només avisa el servidor, en obrir la pàgina, que
// l'usuari ja ha vist els avisos actuals, i refresca el layout (via
// router.refresh()) perquè el comptador del menú baixi a 0 a l'instant en
// lloc d'esperar a la propera navegació.
export function MarkAvisosSeen() {
  const router = useRouter();
  useEffect(() => {
    markAvisosSeen().then(() => router.refresh());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
