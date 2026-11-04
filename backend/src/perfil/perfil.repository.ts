import { createClient } from '@supabase/supabase-js';
import type { CriarPerfilInput, PerfilCriado, PerfilPublico } from './types';

// Lê credenciais somente de variáveis de ambiente
const supabase = createClient(
  process.env.SUPABASE_url!,
  process.env.SUPABASE_serviceRoleKey! // service role para bypass de RLS ao inserir
);

// ── Mapeamento dicionário → coluna real no banco ────────────
// Remover quando a migration for atualizada para os nomes do dicionário
function toDbRow(input: CriarPerfilInput) {
  return {
    nome: input.nome_perfil,
    curso: input.curso_perfil,
    cargo_student_club: input.cargo_perfil,
    linkedin_url: input.linkedin_perfil ?? null,
    foto_path: input.foto_perfil ?? null,
    email: input.email,
    versao_termo: input.versao_termo,
    status: 'aguardando_validacao' as const,
  };
}

function fromDbRow(row: Record<string, unknown>): PerfilPublico {
  return {
    id: row.id as string,
    nome_perfil: row.nome as string,
    curso_perfil: row.curso as string,
    cargo_perfil: row.cargo_student_club as string,
    linkedin_perfil: (row.linkedin_url as string) ?? null,
    foto_perfil: (row.foto_path as string) ?? null,
    criado_em: row.criado_em as string,
  };
}

/**
 * Salva um novo perfil como 'aguardando_validacao'.
 * Lança erro com mensagem genérica se o banco recusar.
 * Nunca loga dados pessoais.
 */
export async function criarPerfil(
  input: CriarPerfilInput
): Promise<PerfilCriado> {
  const { data, error } = await supabase
    .from('perfil') // nome atual da tabela; trocar para 'tb_perfil' após migration
    .insert(toDbRow(input))
    .select('id, status, criado_em')
    .single();

  if (error) {
    // Loga apenas o código de erro — nunca o input
    console.error('[criarPerfil] erro ao salvar perfil', { code: error.code });
    throw new Error('Não foi possível salvar o perfil. Tente novamente.');
  }

  return {
    id: data.id,
    status: data.status,
    criado_em: data.criado_em,
  };
}