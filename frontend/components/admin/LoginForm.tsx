"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CONNECTION_ERROR, loginErrorMessage } from "@/lib/auth/messages";
import "@/app/admin/admin.css";

export default function LoginForm({ initialError = null }: { initialError?: string | null }) {
  const router = useRouter();
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const form = new FormData(event.currentTarget);
    submitting.current = true;
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: String(form.get("email")).trim(),
        password: String(form.get("senha")),
      });
      if (!authError) {
        router.replace("/admin/pendentes");
        router.refresh();
        return;
      }
      setError(loginErrorMessage(authError));
    } catch {
      setError(CONNECTION_ERROR);
    }
    submitting.current = false;
    setLoading(false);
  }

  return (
    <form onSubmit={signIn} className="admin-form" aria-busy={loading}>
      <fieldset disabled={loading} className="admin-fields">
        <label htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" autoComplete="username"
          autoCapitalize="none" spellCheck={false} required />
        <label htmlFor="senha">Senha</label>
        <input id="senha" name="senha" type="password" autoComplete="current-password" required />
        <button type="submit" className="admin-primary-button" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </fieldset>
      <div aria-live="polite" role="status" className="admin-sr-only">
        {loading ? "Entrando..." : ""}
      </div>
      {error && <p role="alert" className="admin-error">{error}</p>}
    </form>
  );
}
