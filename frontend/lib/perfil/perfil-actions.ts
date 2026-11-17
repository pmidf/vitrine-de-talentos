"use server";

import { createClient } from "../supabase/server";
import { createAdminClient } from "../supabase/admin-client";
import { perfilSchema, type PerfilInput } from "../validations/perfil";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type PerfilCriado = {
  id: string;
  status: string;
  criado_em: string;
};

export type PerfilPublico = {
  id_perfil: string;
  nome_perfil: string;
  curso_perfil: string;
  cargo_perfil: string;
  linkedin_perfil: string | null;
  foto_perfil: string | null;
};

// ---------------------------------------------------------------------------
// criarPerfil
// ---------------------------------------------------------------------------

/**
 * Recebe os dados do formulário, valida e salva no banco como 'pendente'.
 * Usa o cliente anon — a RLS permite inserção pública.
 */
export async function criarPerfil(input: PerfilInput): Promise<PerfilCriado> {
  // 1. Valida os dados com o mesmo schema do formulário
  const resultado = perfilSchema.safeParse(input);

  if (!resultado.success) {
    const mensagens = resultado.error.issues
      .map((issue) => issue.message)
      .join(", ");
    throw new Error(mensagens);
  }

  const dados = resultado.data;

  // 2. Salva no banco
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tb_perfil")
    .insert({
      nome_perfil: dados.nome_perfil,
      curso_perfil: dados.curso_perfil,
      cargo_perfil: dados.cargo_perfil,
      linkedin_perfil: dados.linkedin_perfil || null,
      foto_perfil: dados.foto_perfil || null,
    })
    .select("id_perfil, status_perfil, data_criacao_perfil")
    .single();

  if (error || !data) {
    throw new Error(
      "Ocorreu um problema ao registrar seu perfil. Por favor, tente novamente mais tarde."
    );
  }

  return {
    id: data.id_perfil,
    status: data.status_perfil,
    criado_em: data.data_criacao_perfil,
  };
}

// ---------------------------------------------------------------------------
// buscarPerfisPublicos
// ---------------------------------------------------------------------------

/**
 * Retorna apenas os perfis com status 'aprovado' para a galeria pública.
 * Usa o cliente admin para contornar a RLS de leitura — a filtragem
 * por status é feita aqui na query, não delegada ao banco.
 */
export async function buscarPerfisPublicos(): Promise<PerfilPublico[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("tb_perfil")
    .select(
      "id_perfil, nome_perfil, curso_perfil, cargo_perfil, linkedin_perfil, foto_perfil"
    )
    .eq("status_perfil", "aprovado")
    .order("data_criacao_perfil", { ascending: false });

  if (error) {
    throw new Error("Não foi possível carregar os voluntários.");
  }

  return (data ?? []) as PerfilPublico[];
}
