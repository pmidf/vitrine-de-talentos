"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  aprovarPerfil,
  rejeitarPerfil,
} from "@/lib/admin/perfil-actions";

export type ResultadoModeracao = { ok: true } | { ok: false; erro: string };

const idSchema = z.guid();
const motivoSchema = z.string().trim().min(1).max(500);

const ERRO_DADOS = "Os dados enviados não são válidos. Atualize a página e tente novamente.";
const ERRO_APROVAR = "Não foi possível aprovar o perfil. Tente novamente em instantes.";
const ERRO_REJEITAR = "Não foi possível rejeitar o perfil. Tente novamente em instantes.";

// A checagem de administrador fica fora do try: requireAdmin redireciona lançando um erro.
export async function aprovarAction(idPerfil: string): Promise<ResultadoModeracao> {
  await requireAdmin();
  const id = idSchema.safeParse(idPerfil);
  if (!id.success) return { ok: false, erro: ERRO_DADOS };

  try {
    await aprovarPerfil(id.data);
    return { ok: true };
  } catch {
    return { ok: false, erro: ERRO_APROVAR };
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
  } catch {
    return { ok: false, erro: ERRO_REJEITAR };
  }
}
