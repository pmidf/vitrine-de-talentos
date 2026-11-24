"use server";

import { createAdminClient } from "@/lib/supabase/admin-client";
import { createClient } from "@/lib/supabase/server";
import { LIMITE_FOTO_RECORTADA, validarCadastro, type ErrosCadastro } from "./validacao";

type ResultadoEnvio =
  | { ok: true }
  | { ok: false; erros?: ErrosCadastro; mensagem?: string };

const mensagemFalha = "Não foi possível enviar o perfil. Tente novamente.";

export async function enviarPerfil(formulario: FormData): Promise<ResultadoEnvio> {
  if (formulario.get("site_empresa") !== "") {
    return { ok: false, mensagem: mensagemFalha };
  }

  const { perfil, erros, aceiteLgpd, aceiteImagem, foto } = validarCadastro(formulario);

  if (foto && (foto.type !== "image/jpeg" || foto.size > LIMITE_FOTO_RECORTADA)) {
    erros.foto_perfil = "Selecione novamente a foto para recortá-la antes de enviar.";
  }
  if (!perfil.success || Object.keys(erros).length) {
    return { ok: false, erros };
  }

  const bucket = process.env.STORAGE_bucketFotos;
  let upload: { caminho: string; storage: ReturnType<ReturnType<typeof createAdminClient>["storage"]["from"]> } | undefined;

  try {
    const supabase = await createClient();

    if (foto) {
      if (!bucket) {
        return { ok: false, erros: { foto_perfil: "O envio de fotos está indisponível. Tente novamente ou remova a foto." } };
      }

      const storage = createAdminClient().storage.from(bucket);
      const caminho = `perfis/${crypto.randomUUID()}.jpg`;
      const { error } = await storage.upload(caminho, foto, { contentType: "image/jpeg" });
      if (error) {
        return { ok: false, erros: { foto_perfil: "Não foi possível enviar a foto. Tente novamente ou remova a foto." } };
      }
      upload = { caminho, storage };
    }

    const { data, error } = await supabase.rpc("enviar_perfil", {
      p_nome_perfil: perfil.data.nome_perfil,
      p_curso_perfil: perfil.data.curso_perfil,
      p_cargo_perfil: perfil.data.cargo_perfil,
      p_linkedin_perfil: perfil.data.linkedin_perfil || null,
      p_foto_perfil: upload?.caminho ?? null,
      p_aceite_lgpd: aceiteLgpd,
      p_aceite_imagem_lgpd: aceiteImagem,
    });

    if (error && upload && /^[0-9A-Z]{5}$/.test(error.code)) {
      const { error: erroRemocao } = await upload.storage.remove([upload.caminho]);
      if (erroRemocao) console.error("Falha ao remover foto de um cadastro rejeitado.");
    }

    return error || !data ? { ok: false, mensagem: mensagemFalha } : { ok: true };
  } catch {
    return { ok: false, mensagem: mensagemFalha };
  }
}
