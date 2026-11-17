import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "../supabase/server";
import { CONNECTION_ERROR, loginErrorMessage } from "./messages";

export const requireAdmin = cache(async () => {
  // A sessão pertence à requisição. O SDK consulta o relógio ao validar o token.
  // Fora do try para preservar a suspensão de pré-renderização do Next.js.
  await connection();
  // Manter redirect fora do try: o Next.js implementa redirecionamentos lançando erro.
  const destination = await checkAdmin();
  if (destination) redirect(destination);
});

/**
 * Retorna o id do administrador autenticado na sessão atual.
 * Lança um erro se não houver admin logado — use apenas em server actions,
 * nunca em Server Components (prefira requireAdmin para esses casos).
 */
export async function getAdminId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Acesso negado: nenhum administrador autenticado.");
  }

  const { data: admin, error: adminError } = await supabase
    .from("tb_admin")
    .select("id_admin")
    .eq("id_admin", user.id)
    .maybeSingle();

  if (adminError || !admin) {
    throw new Error("Acesso negado: usuário não é administrador.");
  }

  return admin.id_admin as string;
}

async function checkAdmin(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
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