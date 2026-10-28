"use client";

import { useRef, useState } from "react";
import { navigateAfterAuth } from "@/lib/auth/navigation";
import { createClient } from "@/lib/supabase/client";
import "@/app/admin/admin.css";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const submitting = useRef(false);

  async function signOut() {
    if (submitting.current) return;
    submitting.current = true;
    setLoading(true);
    setError(false);
    try {
      const { error: authError } = await createClient().auth.signOut({ scope: "local" });
      if (authError) throw authError;
      navigateAfterAuth("/login");
      return;
    } catch {
      setError(true);
      setLoading(false);
      submitting.current = false;
    }
  }

  return (
    <div className="admin-logout">
      <button type="button" onClick={signOut} disabled={loading} aria-busy={loading}
        className="admin-secondary-button">{loading ? "Saindo..." : "Sair"}</button>
      {error && <p role="alert" className="admin-error">
        Não foi possível sair. Verifique sua conexão e tente novamente.
      </p>}
    </div>
  );
}
