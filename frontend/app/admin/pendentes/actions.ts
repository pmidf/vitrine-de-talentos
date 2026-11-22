"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  aprovarPerfil,
  rejeitarPerfil,
  suspenderPerfil,
  removerPerfil,
  reativarPerfil,
} from "@/lib/admin/perfil-actions";

export type ResultadoModeracao = { ok: true } | { ok: false; erro: string };

const idSchema = z.guid();
const motivoSchema = z.string().trim().min(1).max(500);
const motivoOpcionalSchema = z.string().trim().max(500).optional();

const ERRO_DADOS = "Os dados enviados não são válidos. Atualize a página e tente novamente.";
const ERRO_APROVAR = "Não foi possível aprovar o perfil. Tente novamente em instantes.";
const ERRO_REJEITAR = "Não foi possível rejeitar o perfil. Tente novamente em instantes.";
const ERRO_SUSPENDER = "Não foi possível suspender o perfil. Tente novamente em instantes.";
const ERRO_REMOVER = "Não foi possível remover o perfil. Tente novamente em instantes.";
const ERRO_REATIVAR = "Não foi possível reativar o perfil. Tente novamente em instantes.";

// As funções de lib/admin só lançam mensagens seguras para mostrar ao admin.
function mensagemDoErro(erro: unknown, padrao: string) {
  return erro instanceof Error && erro.message ? erro.message : padrao;
}

// A checagem de administrador fica fora do try: requireAdmin redireciona lançando um erro.
export async function aprovarAction(idPerfil: string): Promise<ResultadoModeracao> {
  await requireAdmin();
  const id = idSchema.safeParse(idPerfil);
  if (!id.success) return { ok: false, erro: ERRO_DADOS };

  try {
    await aprovarPerfil(id.data);
    return { ok: true };
  } catch (erro) {
    return { ok: false, erro: mensagemDoErro(erro, ERRO_APROVAR) };
  }
}

export async function rejeitarAction(
  idPerfil: string,
  motivo: string,
): Promise<ResultadoModeracao> {
  await requireAdmin();
  const id = idSchema.safeParse(idPerfil);
  if (!id.success) return { ok: false, erro: ERRO_DADOS };

  const texto = motivoSchema.safeParse(motivo);
  if (!texto.success) return { ok: false, erro: "Escreva o motivo da rejeição." };

  try {
    await rejeitarPerfil(id.data, texto.data);
    return { ok: true };
  } catch (erro) {
    return { ok: false, erro: mensagemDoErro(erro, ERRO_REJEITAR) };
  }
}

export async function suspenderAction(
  idPerfil: string,
  motivo: string,
): Promise<ResultadoModeracao> {
  await requireAdmin();
  const id = idSchema.safeParse(idPerfil);
  if (!id.success) return { ok: false, erro: ERRO_DADOS };

  const texto = motivoSchema.safeParse(motivo);
  if (!texto.success) return { ok: false, erro: "Escreva o motivo da suspensão." };

  try {
    await suspenderPerfil(id.data, texto.data);
    return { ok: true };
  } catch (erro) {
    return { ok: false, erro: mensagemDoErro(erro, ERRO_SUSPENDER) };
  }
}

export async function removerAction(
  idPerfil: string,
  motivo: string,
): Promise<ResultadoModeracao> {
  await requireAdmin();
  const id = idSchema.safeParse(idPerfil);
  if (!id.success) return { ok: false, erro: ERRO_DADOS };

  const texto = motivoSchema.safeParse(motivo);
  if (!texto.success) return { ok: false, erro: "Escreva o motivo da remoção." };

  try {
    await removerPerfil(id.data, texto.data);
    return { ok: true };
  } catch (erro) {
    return { ok: false, erro: mensagemDoErro(erro, ERRO_REMOVER) };
  }
}

// Reativar: o motivo é opcional.
export async function reativarAction(
  idPerfil: string,
  motivo?: string,
): Promise<ResultadoModeracao> {
  await requireAdmin();
  const id = idSchema.safeParse(idPerfil);
  if (!id.success) return { ok: false, erro: ERRO_DADOS };

  const texto = motivoOpcionalSchema.safeParse(motivo);
  if (!texto.success) return { ok: false, erro: "O motivo pode ter no máximo 500 caracteres." };

  try {
    await reativarPerfil(id.data, texto.data || null);
    return { ok: true };
  } catch (erro) {
    return { ok: false, erro: mensagemDoErro(erro, ERRO_REATIVAR) };
  }
}
