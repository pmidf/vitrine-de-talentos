import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "../supabase/server";
import { CONNECTION_ERROR, loginErrorMessage } from "./messages";

/** Resultado da verificação de administrador da sessão atual. */
type SessaoAdmin =
  | { situacao: "admin"; idAdmin: string }
  | { situacao: "sem-sessao" }
  | { situacao: "nao-admin" }
  | { situacao: "erro-conexao" };

/**
 * Consulta quem está logado e se é administrador ativo, uma única vez por
 * requisição (SCRUM-147). A página, o layout e as funções de listar chamam
 * requireAdmin e getAdminId na mesma requisição: com o cache, as duas idas
 * ao Supabase (sessão + tb_admin) acontecem só na primeira chamada.
 * O cache do React vale só para a requisição atual: nada é compartilhado
 * entre usuários ou entre cliques.
 */
const consultarSessaoAdmin = cache(async (): Promise<SessaoAdmin> => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) {
      return loginErrorMessage(error) === CONNECTION_ERROR
        ? { situacao: "erro-conexao" }
        : { situacao: "sem-sessao" };
    }
    if (!user) return { situacao: "sem-sessao" };

    const { data: admin, error: adminError } = await supabase
      .from("tb_admin")
      .select("id_admin, status_admin")
      .eq("id_admin", user.id)
      .maybeSingle();

    if (adminError) return { situacao: "erro-conexao" };
    // Admin desativado (status_admin = false) também é barrado
    if (!admin?.status_admin) return { situacao: "nao-admin" };
    return { situacao: "admin", idAdmin: admin.id_admin as string };
  } catch {
    return { situacao: "erro-conexao" };
  }
});

const DESTINO_SEM_ACESSO: Record<Exclude<SessaoAdmin["situacao"], "admin">, string> = {
  "sem-sessao": "/login",
  "nao-admin": "/login?erro=credenciais",
  "erro-conexao": "/login?erro=conexao",
};

export const requireAdmin = cache(async () => {
  // A sessão pertence à requisição. O SDK consulta o relógio ao validar o token.
  // Fora do try para preservar a suspensão de pré-renderização do Next.js.
  await connection();
  // Manter redirect fora do try: o Next.js implementa redirecionamentos lançando erro.
  const sessao = await consultarSessaoAdmin();
  if (sessao.situacao !== "admin") redirect(DESTINO_SEM_ACESSO[sessao.situacao]);
});

/**
 * Retorna o id do administrador autenticado na sessão atual.
 * Lança um erro se não houver admin logado — use apenas em server actions,
 * nunca em Server Components (prefira requireAdmin para esses casos).
 */
export async function getAdminId(): Promise<string> {
  const sessao = await consultarSessaoAdmin();
  if (sessao.situacao === "admin") return sessao.idAdmin;
  if (sessao.situacao === "nao-admin") {
    throw new Error("Acesso negado: usuário não é administrador ativo.");
  }
  throw new Error("Acesso negado: nenhum administrador autenticado.");
}
