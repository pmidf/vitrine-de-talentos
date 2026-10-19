import { z } from "zod";

const nomePerfil = z
  .string({ error: "O nome deve ser um texto." })
  .trim()
  .min(2, "O nome deve ter pelo menos 2 caracteres.")
  .max(150, "O nome deve ter no máximo 150 caracteres.");

const cursoPerfil = z
  .string({ error: "O curso deve ser um texto." })
  .trim()
  .min(2, "O curso deve ter pelo menos 2 caracteres.")
  .max(100, "O curso deve ter no máximo 100 caracteres.");

const cargoPerfil = z
  .string({ error: "O cargo deve ser um texto." })
  .trim()
  .min(2, "O cargo deve ter pelo menos 2 caracteres.")
  .max(100, "O cargo deve ter no máximo 100 caracteres.");

const linkedinPerfil = z
  .union([
    z.literal(""),
    z
      .string()
      .trim()
      .max(255, "O link do LinkedIn deve ter no máximo 255 caracteres.")
      .url("Informe uma URL válida do LinkedIn.")
      .refine((value) => {
        try {
          const url = new URL(value);

          return (
            url.protocol === "https:" &&
            (url.hostname === "linkedin.com" ||
              url.hostname.endsWith(".linkedin.com"))
          );
        } catch {
          return false;
        }
      }, "Informe uma URL HTTPS do domínio linkedin.com."),
  ])
  .optional();

export const perfilSchema = z
  .object({
    nome_perfil: nomePerfil,
    curso_perfil: cursoPerfil,
    cargo_perfil: cargoPerfil,
    linkedin_perfil: linkedinPerfil,
    foto_perfil: z
      .string()
      .trim()
      .min(1, "O caminho da foto não pode estar vazio.")
      .nullable()
      .optional(),
  })
  .strict();

export type PerfilInput = z.infer<typeof perfilSchema>;
