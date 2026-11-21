"use server";

import { createAdminClient } from "../supabase/admin-client";
import { createClient } from "../supabase/server";
import { getAdminId } from "../auth/require-admin";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type PerfilPendente = {
  id_perfil: string;
  nome_perfil: string;
  curso_perfil: string;
  cargo_perfil: string;
  linkedin_perfil: string | null;
  foto_perfil: string | null;
  tb_lgpd_perfil: {
    aceite_lgpd: boolean;
    aceite_imagem_lgpd: boolean;
  } | null;
};

// ---------------------------------------------------------------------------
// listarPendentes
// ---------------------------------------------------------------------------

/**
 * Retorna todos os perfis com status_perfil = 'pendente',
 * incluindo os dados de consentimento LGPD de cada um.
 * Apenas administradores autenticados podem chamar esta função.
 */
export async function listarPendentes(): Promise<PerfilPendente[]> {
  await getAdminId(); // barra quem não é admin antes de qualquer consulta

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("tb_perfil")
    .select(
      `id_perfil,
       nome_perfil,
       curso_perfil,
       cargo_perfil,
       linkedin_perfil,
       foto_perfil,
       tb_lgpd_perfil (
         aceite_lgpd,
         aceite_imagem_lgpd
       )`
    )
    .eq("status_perfil", "pendente")
    .order("data_criacao_perfil", { ascending: true });

  if (error) {
    throw new Error("Não foi possível carregar os perfis pendentes.");
  }

  return (data ?? []) as unknown as PerfilPendente[];
}

// ---------------------------------------------------------------------------
// Moderação: aprovar, rejeitar, suspender e remover
// ---------------------------------------------------------------------------

/**
 * Mensagens da função moderar_perfil que podem ser mostradas ao admin.
 * Qualquer outro erro vira uma mensagem genérica, para não expor o banco.
 */
const MENSAGENS_DO_BANCO = new Set([
  "Acesso negado: administrador inativo ou não autenticado.",
  "O motivo é obrigatório para esta ação.",
  "O motivo da rejeição é obrigatório.",
  "Este perfil não está pendente ou não existe.",
  "Este perfil não pode ser aprovado: falta o aceite da LGPD.",
  "Este perfil já foi removido e não pode ser moderado.",
  "Perfil não encontrado.",
]);

/**
 * Chama moderar_perfil com a sessão de quem está logado. O banco descobre
 * o admin pela sessão (auth.uid()), confere as regras, muda o status e
 * grava o histórico na mesma transação.
 */
async function moderar(
  idPerfil: string,
  novoStatus: "aprovado" | "rejeitado" | "suspenso" | "removido",
  motivo: string | null,
  erroPadrao: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("moderar_perfil", {
    p_id_perfil: idPerfil,
    p_novo_status: novoStatus,
    p_motivo: motivo,
  });

  if (error) {
    console.error("Falha ao moderar perfil:", error.code);
    throw new Error(
      MENSAGENS_DO_BANCO.has(error.message) ? error.message : erroPadrao,
    );
  }
}

/** Aprova um perfil pendente. As regras ficam no banco (moderar_perfil). */
export async function aprovarPerfil(idPerfil: string): Promise<void> {
  await moderar(idPerfil, "aprovado", null, "Não foi possível aprovar o perfil.");
}

/** Rejeita um perfil pendente. O motivo é obrigatório. */
export async function rejeitarPerfil(
  idPerfil: string,
  motivo: string,
): Promise<void> {
  if (!motivo?.trim()) {
    throw new Error("O motivo é obrigatório para esta ação.");
  }
  await moderar(idPerfil, "rejeitado", motivo.trim(), "Não foi possível rejeitar o perfil.");
}

/** Suspende um perfil (qualquer status, exceto removido). O motivo é obrigatório. */
export async function suspenderPerfil(
  idPerfil: string,
  motivo: string,
): Promise<void> {
  if (!motivo?.trim()) {
    throw new Error("O motivo é obrigatório para esta ação.");
  }
  await moderar(idPerfil, "suspenso", motivo.trim(), "Não foi possível suspender o perfil.");
}

/** Remove um perfil (qualquer status, exceto removido). O motivo é obrigatório. */
export async function removerPerfil(
  idPerfil: string,
  motivo: string,
): Promise<void> {
  if (!motivo?.trim()) {
    throw new Error("O motivo é obrigatório para esta ação.");
  }
  await moderar(idPerfil, "removido", motivo.trim(), "Não foi possível remover o perfil.");
}
