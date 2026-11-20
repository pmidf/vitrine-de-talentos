import { perfilSchema } from "@/lib/validations/perfil";

export type ErrosCadastro = Record<string, string>;

export const LIMITE_FOTO_RECORTADA = 800 * 1024;

export function validarCadastro(formulario: FormData) {
  const perfil = perfilSchema.safeParse({
    nome_perfil: formulario.get("nome_perfil"),
    curso_perfil: formulario.get("curso_perfil"),
    cargo_perfil: formulario.get("cargo_perfil"),
    linkedin_perfil: formulario.get("linkedin_perfil") ?? "",
  });
  const erros: ErrosCadastro = {};

  for (const erro of perfil.error?.issues ?? []) {
    const campo = String(erro.path[0]);
    const mensagem = erro.code === "invalid_union"
      ? erro.errors.find((grupo) => grupo.length && grupo[0].code !== "invalid_value")?.[0].message
      : erro.message;
    erros[campo] ??= mensagem ?? "Informe uma URL válida do LinkedIn.";
  }

  const aceiteLgpd = formulario.get("aceite_lgpd") === "on";
  const aceiteImagem = formulario.get("aceite_imagem") === "on";
  const arquivo = formulario.get("foto_perfil");
  const foto = arquivo instanceof File && arquivo.size > 0 ? arquivo : null;

  if (!aceiteLgpd) {
    erros.aceite_lgpd = "Aceite o tratamento dos seus dados para enviar o perfil.";
  }
  if (foto && !aceiteImagem) {
    erros.aceite_imagem = "Autorize o uso da sua imagem para enviar uma foto.";
  }

  return { perfil, erros, aceiteLgpd, aceiteImagem, foto };
}
