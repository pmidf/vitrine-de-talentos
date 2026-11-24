"use server";

import { createClient } from "../supabase/server";
import { createAdminClient } from "../supabase/admin-client";
import { perfilSchema, type PerfilInput } from "../validations/perfil";
import type { Voluntario } from "@/types/voluntarios";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type PerfilCriado = {
  id: string;
};

/** Campo isca: fica invisível no formulário. Só robôs preenchem. */
type CampoIsca = {
  site_empresa?: string;
};

const MENSAGEM_ERRO_ENVIO =
  "Ocorreu um problema ao registrar seu perfil. Por favor, tente novamente mais tarde.";

// ---------------------------------------------------------------------------
// criarPerfil
// ---------------------------------------------------------------------------

/**
 * Recebe os dados do formulário, valida e envia ao banco pela função enviar_perfil.
 * A função grava o perfil como 'pendente' e o consentimento LGPD de uma vez só.
 * O visitante (anon) não tem permissão de gravar direto na tb_perfil.
 */
export async function criarPerfil(
  input: PerfilInput & CampoIsca
): Promise<PerfilCriado> {
  // 1. Campo isca: se veio preenchido, é robô. Recusa sem dizer o motivo.
  const { site_empresa, ...perfil } = input;

  if (site_empresa && site_empresa.trim() !== "") {
    console.error("Envio recusado: campo isca preenchido");
    throw new Error(MENSAGEM_ERRO_ENVIO);
  }

  // 2. Valida os dados com o mesmo schema do formulário
  const resultado = perfilSchema.safeParse(perfil);

  if (!resultado.success) {
    const mensagens = resultado.error.issues
      .map((issue) => issue.message)
      .join(", ");
    throw new Error(mensagens);
  }

  const dados = resultado.data;

  // 3. Envia ao banco só os campos previstos, um a um.
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
    throw new Error(MENSAGEM_ERRO_ENVIO);
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

  const perfis = data ?? [];
  const caminhos = perfis
    .map((perfil) => perfil.foto_perfil)
    .filter((foto): foto is string => /^perfis\/[0-9a-f-]{36}\.jpg$/.test(foto ?? ""));

  if (caminhos.length === 0) return perfis;

  // Só assina caminhos retornados pela consulta de perfis aprovados.
  const urls = new Map<string, string | null>(caminhos.map((caminho) => [caminho, null]));
  const bucket = process.env.STORAGE_bucketFotos;
  if (bucket) {
    try {
      const { data: fotos } = await createAdminClient().storage.from(bucket)
        .createSignedUrls([...urls.keys()], 3600);
      for (const foto of fotos ?? []) {
        if (foto.path && foto.signedUrl) urls.set(foto.path, foto.signedUrl);
      }
    } catch {
      // A galeria continua disponível quando o Storage está indisponível.
    }
  }

  return perfis.map((perfil) => {
    const url = urls.get(perfil.foto_perfil ?? "");
    return url === undefined ? perfil : { ...perfil, foto_perfil: url };
  });
}
