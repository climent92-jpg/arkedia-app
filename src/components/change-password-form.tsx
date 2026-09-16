"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

// Canvia la contrasenya del compte connectat directament amb Supabase Auth
// (supabase.auth.updateUser): no cal cap Server Action perquè l'usuari
// només pot canviar la seva pròpia contrasenya, ja autenticat amb la seva
// sessió actual al navegador.
export function ChangePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function submit() {
    setError(null);

    if (password.trim().length < 6) {
      setError("La contrasenya ha de tenir com a mínim 6 caràcters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les dues contrasenyes no coincideixen.");
      return;
    }

    startTransition(async () => {
      try {
        const supabase = createClient();
        const { error: updateError } = await supabase.auth.updateUser({
          password: password.trim(),
        });

        if (updateError) {
          setError(updateError.message);
          return;
        }

        setDone(true);
        setPassword("");
        setConfirmPassword("");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Alguna cosa ha fallat en canviar la contrasenya. Torna-ho a provar."
        );
      }
    });
  }

  if (done) {
    return (
      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
          <CheckCircle2 className="size-10 text-emerald-600" />
          <p className="font-bold text-emerald-800">Contrasenya actualitzada!</p>
          <p className="text-sm text-emerald-700">
            La propera vegada que iniciïs sessió, fes servir la nova contrasenya.
          </p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => setDone(false)}>
            Tornar a canviar-la
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4 sm:p-5">
        <div className="flex items-center gap-2 text-arkedia-blue">
          <KeyRound className="size-5" />
          <p className="font-bold">Canviar contrasenya</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nova-contrasenya">Contrasenya nova</Label>
          <Input
            id="nova-contrasenya"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínim 6 caràcters"
            autoComplete="new-password"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirma-contrasenya">Confirma-la</Label>
          <Input
            id="confirma-contrasenya"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Torna-la a escriure"
            autoComplete="new-password"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        <Button onClick={submit} disabled={pending} className="mt-1">
          {pending ? "Desant..." : "Canviar contrasenya"}
        </Button>
      </CardContent>
    </Card>
  );
}
