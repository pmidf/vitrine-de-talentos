import { createAdminClient } from "../supabase/admin-client";

const CAMINHO_FOTO = /^perfis\/[0-9a-f-]{36}\.jpg$/;

export function caminhoValido(caminho: string | null | undefined): caminho is string {
  return CAMINHO_FOTO.test(caminho ?? "");
}

/**
 * Gera links temporários para as fotos do bucket privado.
 * Devolve um mapa "caminho → link". Se o Storage falhar, devolve o mapa vazio
 * e a tela mostra as iniciais no lugar da foto.
 */
export async function gerarLinksFotos(
  caminhos: (string | null)[],
  segundos: number,
): Promise<Map<string, string>> {
  const links = new Map<string, string>();
  const bucket = process.env.STORAGE_bucketFotos;
  const validos = caminhos.filter(caminhoValido);
  if (!bucket || validos.length === 0) return links;

  try {
    const { data } = await createAdminClient()
      .storage.from(bucket)
      .createSignedUrls(validos, segundos);
    for (const foto of data ?? []) {
      if (foto.path && foto.signedUrl) links.set(foto.path, foto.signedUrl);
    }
  } catch {
  }
  return links;
}

/**
 * Apaga uma foto do bucket. Devolve true se apagou.
 * Nunca lança erro: quem chama decide o que fazer se falhar.
 */
export async function apagarFoto(caminho: string): Promise<boolean> {
  const bucket = process.env.STORAGE_bucketFotos;
  if (!bucket || !caminhoValido(caminho)) return false;

  try {
    const { error } = await createAdminClient().storage.from(bucket).remove([caminho]);
    return !error;
  } catch {
    return false;
  }
}