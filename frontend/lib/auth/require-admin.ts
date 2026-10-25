import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "../supabase/server";
import { CONNECTION_ERROR, loginErrorMessage } from "./messages";

export const requireAdmin = cache(async () => {
  // Manter redirect fora do try: o Next.js implementa redirecionamentos lançando erro.
  const destination = await checkAdmin();
  if (destination) redirect(destination);
});

async function checkAdmin(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      return loginErrorMessage(error) === CONNECTION_ERROR
        ? "/login?erro=conexao"
        : "/login";
    }
    if (!user) return "/login";

    const { data: admin, error: adminError } = await supabase
      .from("tb_admin")
      .select("status_admin")
      .eq("id_admin", user.id)
      .maybeSingle();

    if (adminError) return "/login?erro=conexao";
    if (!admin?.status_admin) return "/login?erro=credenciais";
    return null;
  } catch {
    return "/login?erro=conexao";
  }
}
