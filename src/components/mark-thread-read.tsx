"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { markThreadRead } from "@/lib/nav-badges-actions";

// No renderitza res: només avisa el servidor, en obrir un fil de xat, que
// l'usuari ja n'ha llegit els missatges, i refresca el layout (via
// router.refresh()) perquè el comptador del menú baixi a l'instant en lloc
// d'esperar a la propera navegació.
export function MarkThreadRead({ threadId }: { threadId: string }) {
  const router = useRouter();
  useEffect(() => {
    markThreadRead(threadId).then(() => router.refresh());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);
  return null;
}
