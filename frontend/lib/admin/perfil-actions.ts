"use server";

import { createAdminClient } from "../supabase/admin-client";
import { createClient } from "../supabase/server";
import { getAdminId } from "../auth/require-admin";
import { apagarFoto, caminhoValido, gerarLinksFotos } from "../storage/fotos";

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
  foto_url?: string | null;
  tb_lgpd_perfil: {
    aceite_lgpd: boolean;
    aceite_imagem_lgpd: boolean;
  } | null;
};

/** Status de quem já passou pela moderação (todos, menos pendente). */
export type StatusModerado = "aprovado" | "rejeitado" | "suspenso" | "removido";

export type PerfilModerado = PerfilPendente & {
  status_perfil: StatusModerado;
};

const VALIDADE_LINK_ADMIN = 300;

async function comLinksDasFotos<T extends PerfilPendente>(perfis: T[]): Promise<T[]> {
  const links = await gerarLinksFotos(perfis.map((p) => p.foto_perfil), VALIDADE_LINK_ADMIN);
  return perfis.map((perfil) => {
    const link = links.get(perfil.foto_perfil ?? "");
    return link ? { ...perfil, foto_url: link } : perfil;
  });
}

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

  return comLinksDasFotos((data ?? []) as unknown as PerfilPendente[]);
}

// ---------------------------------------------------------------------------
// listarModerados
// ---------------------------------------------------------------------------

/**
 * Retorna todos os perfis que já passaram pela moderação (aprovados,
 * rejeitados, suspensos e removidos), em ordem alfabética, com o status
 * e os dados de consentimento LGPD. Pendentes ficam em listarPendentes.
 */
export async function listarModerados(): Promise<PerfilModerado[]> {
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
       status_perfil,
       tb_lgpd_perfil (
         aceite_lgpd,
         aceite_imagem_lgpd
       )`
    )
    .neq("status_perfil", "pendente")
    .order("nome_perfil", { ascending: true });

  if (error) {
    throw new Error("Não foi possível carregar os voluntários.");
  }

  return comLinksDasFotos((data ?? []) as unknown as PerfilModerado[]);
}

// ---------------------------------------------------------------------------
// Moderação: aprovar, rejeitar, suspender, remover e reativar
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

/**
 * Apaga a foto de um perfil que saiu da vitrine de vez (rejeitado ou removido)
 * e limpa o caminho no banco (LGPD: não guardar imagem sem uso).
 * Roda só depois da moderação dar certo e nunca desfaz a moderação:
 * se o Storage falhar, o caminho fica no banco e dá para apagar depois.
 */
async function descartarFoto(idPerfil: string): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("tb_perfil")
      .select("foto_perfil")
      .eq("id_perfil", idPerfil)
      .maybeSingle();

    const caminho = data?.foto_perfil;
    if (!caminhoValido(caminho)) return;      // sem foto (ou caminho fora do padrão)
    if (!(await apagarFoto(caminho))) return; // não apagou: mantém o caminho para tentar de novo

    await supabase.from("tb_perfil").update({ foto_perfil: null }).eq("id_perfil", idPerfil);
  } catch {
    console.error("Falha ao descartar a foto de um perfil retirado da vitrine.");
  }
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
  await descartarFoto(idPerfil);
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
  await descartarFoto(idPerfil);
}

/**
 * Reativa um perfil suspenso: ele volta para aprovado e aparece de novo
 * na vitrine. O motivo é opcional; se vier, fica no histórico.
 */
export async function reativarPerfil(
  idPerfil: string,
  motivo?: string | null,
): Promise<void> {
  await moderar(
    idPerfil,
    "aprovado",
    motivo?.trim() || null,
    "Não foi possível reativar o perfil.",
  );
}
