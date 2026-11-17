"use server";

import { createClient } from "../supabase/server";
import { perfilSchema, type PerfilInput } from "../validations/perfil";
import type { Voluntario } from "@/types/voluntarios";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type PerfilCriado = {
  id: string;
  status: string;
  criado_em: string;
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
 * Retorna só os perfis aprovados, com os 5 campos públicos, para a galeria.
 * Usa o cliente comum: o RLS do banco já entrega só os aprovados ao visitante.
 * O filtro de status abaixo é uma segunda camada de proteção.
 */


export async function buscarPerfisPublicos(): Promise<Voluntario[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tb_perfil")
    .select(
      "nome_perfil, curso_perfil, cargo_perfil, linkedin_perfil, foto_perfil"
    )
    .eq("status_perfil", "aprovado")
    .order("data_criacao_perfil", { ascending: false });

  if (error) {
    throw new Error("Não foi possível carregar os voluntários.");
  }

  return data ?? [];
}
