"use server";

import { createClient } from "../supabase/server";
import { perfilSchema, type PerfilInput } from "../validations/perfil";
import type { Voluntario } from "@/types/voluntarios";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type PerfilCriado = {
  id: string;
};

// ---------------------------------------------------------------------------
// criarPerfil
// ---------------------------------------------------------------------------

/**
 * Recebe os dados do formulário, valida e envia ao banco pela função enviar_perfil.
 * A função grava o perfil como 'pendente' e o consentimento LGPD de uma vez só.
 * O visitante (anon) não tem permissão de gravar direto na tb_perfil.
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

  // 2. Envia ao banco só os campos previstos, um a um
  const supabase = await createClient();

  const { data: idPerfil, error } = await supabase.rpc("enviar_perfil", {
    p_nome_perfil: dados.nome_perfil,
    p_curso_perfil: dados.curso_perfil,
    p_cargo_perfil: dados.cargo_perfil,
    p_linkedin_perfil: dados.linkedin_perfil || null,
    p_foto_perfil: dados.foto_perfil || null,
    p_aceite_lgpd: dados.aceite_lgpd,
    p_aceite_imagem_lgpd: dados.aceite_imagem_lgpd ?? false,
  });

  if (error || !idPerfil) {
    // Só o código do erro: nunca nome, curso ou outro dado pessoal
    console.error("Falha ao enviar perfil:", error?.code ?? "sem id");
    throw new Error(
      "Ocorreu um problema ao registrar seu perfil. Por favor, tente novamente mais tarde."
    );
  }

  return { id: idPerfil };
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
