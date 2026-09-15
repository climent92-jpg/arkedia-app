"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { UserRole } from "@/types";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const configured = isSupabaseConfigured();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!configured || loading) return;

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !data.user) {
      setError("Correu o contrasenya incorrectes.");
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
      setError(
        "El teu compte encara no té cap perfil assignat a l'escola. Contacta amb administració."
      );
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    const role = profile.role as UserRole;
    const next = searchParams.get("next");
    router.push(next && next.startsWith(`/${role}`) ? next : `/${role}`);
    router.refresh();
  }

  if (!configured) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <AlertTriangle className="size-5 shrink-0" />
        <div>
          <p className="font-bold">Supabase encara no està configurat</p>
          <p className="mt-1">
            Cal definir <code>NEXT_PUBLIC_SUPABASE_URL</code> i{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> a <code>.env.local</code> per
            poder iniciar sessió. Consulta el README del projecte.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Correu electrònic</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nom@exemple.com"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Contrasenya</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" className="mt-1 w-full" disabled={loading}>
        {loading && <Loader2 className="size-4 animate-spin" />}
        {loading ? "Entrant..." : "Entrar"}
      </Button>
    </form>
  );
}
