
import { z } from "zod";

const nomeSchema = z
  .string({ error: "O nome deve ser um texto." })
  .trim()
  .min(2, "O nome deve ter pelo menos 2 caracteres.")
  .max(150, "O nome deve ter no máximo 150 caracteres.");

const cursoSchema = z
  .string({ error: "O curso deve ser um texto." })
  .trim()
  .min(2, "O curso deve ter pelo menos 2 caracteres.")
  .max(100, "O curso deve ter no máximo 100 caracteres.");

const cargoSchema = z
  .string({ error: "O cargo deve ser um texto." })
  .trim()
  .min(2, "O cargo deve ter pelo menos 2 caracteres.")
  .max(100, "O cargo deve ter no máximo 100 caracteres.");

const linkedinSchema = z
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

export const perfilSchema = z.object({
  nome: nomeSchema,
  curso: cursoSchema,
  cargo_student_club: cargoSchema,
  linkedin_url: linkedinSchema,
  foto_path: z
    .string()
    .trim()
    .min(1, "O caminho da foto não pode estar vazio.")
    .nullable()
    .optional(),
});

export type PerfilInput = z.infer<typeof perfilSchema>;
