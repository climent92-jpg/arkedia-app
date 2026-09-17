"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { markAssignmentsFeedbackSeen } from "@/app/alumne/deures/actions";

// No renderitza res: només avisa el servidor, en obrir /alumne/deures, que
// l'alumne ja ha vist el feedback pendent, i refresca el layout (via
// router.refresh()) perquè el comptador del menú baixi a 0 a l'instant.
export function MarkFeedbackSeen() {
  const router = useRouter();
  useEffect(() => {
    markAssignmentsFeedbackSeen().then(() => router.refresh());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
