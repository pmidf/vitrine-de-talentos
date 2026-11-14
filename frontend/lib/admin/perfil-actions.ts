"use server";

import { createAdminClient } from "../supabase/admin-client";
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
// aprovarPerfil
// ---------------------------------------------------------------------------

/**
 * Aprova um perfil pendente.
 *
 * Regras:
 * - O perfil precisa estar com status_perfil = 'pendente'.
 * - O consentimento aceite_lgpd precisa ser verdadeiro.
 * - Registra a ação em tb_log_perfil.
 */
export async function aprovarPerfil(idPerfil: string): Promise<void> {
  const idAdmin = await getAdminId();
  const supabase = createAdminClient();

  // 1. Verifica consentimento LGPD antes de qualquer alteração
  const { data: lgpd, error: lgpdError } = await supabase
    .from("tb_lgpd_perfil")
    .select("aceite_lgpd")
    .eq("fk_id_perfil", idPerfil)
    .maybeSingle();

  if (lgpdError) {
    throw new Error("Não foi possível verificar o consentimento LGPD.");
  }

  if (!lgpd?.aceite_lgpd) {
    throw new Error(
      "Este perfil não pode ser aprovado: consentimento LGPD não registrado."
    );
  }

  // 2. Atualiza o status — só funciona se o perfil estiver pendente
  const { data, error: updateError } = await supabase
    .from("tb_perfil")
    .update({ status_perfil: "aprovado" })
    .eq("id_perfil", idPerfil)
    .eq("status_perfil", "pendente") // filtro de segurança: só pendente vira aprovado
    .select("id_perfil");

  if (updateError) {
    throw new Error("Não foi possível aprovar o perfil.");
  }

  if (!data?.length) {
    throw new Error(
      "Este perfil não pode ser aprovado: ele não está pendente ou não existe."
    );
  }

  // 3. Grava o log da ação
  const { error: logError } = await supabase.from("tb_log_perfil").insert({
    fk_id_perfil: idPerfil,
    fk_id_admin: idAdmin,
    data_atualizacao_perfil: new Date().toISOString(),
  });

  if (logError) {
    // O perfil já foi aprovado — o log não pode reverter isso.
    // Lançamos o erro para que o chamador saiba registrar manualmente se necessário.
    throw new Error(
      "Perfil aprovado, mas o log não pôde ser gravado. Informe a administradora."
    );
  }
}

// ---------------------------------------------------------------------------
// rejeitarPerfil
// ---------------------------------------------------------------------------

/**
 * Rejeita um perfil pendente.
 *
 * Regras:
 * - O perfil precisa estar com status_perfil = 'pendente'.
 * - O motivo é obrigatório e não pode ser vazio.
 * - Registra a ação em tb_log_perfil com o motivo.
 */
export async function rejeitarPerfil(
  idPerfil: string,
  motivo: string
): Promise<void> {
  const idAdmin = await getAdminId();

  if (!motivo?.trim()) {
    throw new Error("O motivo da rejeição é obrigatório.");
  }

  const supabase = createAdminClient();

  // 1. Atualiza o status — só funciona se o perfil estiver pendente
  const { data, error: updateError } = await supabase
    .from("tb_perfil")
    .update({ status_perfil: "rejeitado" })
    .eq("id_perfil", idPerfil)
    .eq("status_perfil", "pendente") // filtro de segurança: só pendente vira rejeitado
    .select("id_perfil");

  if (updateError) {
    throw new Error("Não foi possível rejeitar o perfil.");
  }

  if (!data?.length) {
    throw new Error(
      "Este perfil não pode ser rejeitado: ele não está pendente ou não existe."
    );
  }

  // 2. Grava o log da ação com o motivo
  const { error: logError } = await supabase.from("tb_log_perfil").insert({
    fk_id_perfil: idPerfil,
    fk_id_admin: idAdmin,
    data_atualizacao_perfil: new Date().toISOString(),
    motivo_rejeicao_perfil: motivo.trim(),
  });

  if (logError) {
    throw new Error(
      "Perfil rejeitado, mas o log não pôde ser gravado. Informe a administradora."
    );
  }
}