import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { LoginForm } from "@/components/login-form";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/supabase/auth";
import { ROLE_HOME } from "@/lib/nav-config";

// Depèn de la cookie de sessió de cada petició (per redirigir l'usuari ja
// autenticat al seu portal): no es pot prerenderitzar estàticament.
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const profile = await getCurrentProfile();
  if (profile) redirect(ROLE_HOME[profile.role]);

  return (
    <div className="flex min-h-dvh flex-col bg-arkedia-blue">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-10">
        <div className="flex flex-1 flex-col items-center justify-center gap-8 text-white">
          <Logo size="lg" className="items-center text-white [&_span]:text-white" />

          <Card className="w-full border-none">
            <CardContent className="flex flex-col gap-4 p-5 sm:p-6">
              <div>
                <h1 className="text-lg font-bold">Benvinguts/des!</h1>
                <p className="text-sm text-muted">
                  Inicia sessió per accedir al teu portal.
                </p>
              </div>

              <Suspense fallback={null}>
                <LoginForm />
              </Suspense>
            </CardContent>
          </Card>
        </div>

        <p className="pt-6 text-center text-xs text-white/70">
          © {new Date().getFullYear()} ARK#ÈDIA Escola de Música
        </p>
      </div>
    </div>
  );
}
