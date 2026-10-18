import { describe, expect, it } from "vitest";
import { perfilSchema } from "./perfil";

const perfilValido = {
  nome: "Ana Silva",
  curso: "Ciência da Computação",
  cargo_student_club: "Desenvolvedora",
  linkedin_url: "https://www.linkedin.com/in/ana-silva",
  foto_path: "perfis/ana.webp",
};

describe("perfilSchema", () => {
  it("aceita um perfil válido", () => {
    expect(perfilSchema.safeParse(perfilValido).success).toBe(true);
  });

  it("aceita LinkedIn e foto ausentes", () => {
    expect(
      perfilSchema.safeParse({
        nome: "Ana Silva",
        curso: "Ciência da Computação",
        cargo_student_club: "Desenvolvedora",
      }).success,
    ).toBe(true);
  });

  it("rejeita nome ausente", () => {
    expect(
      perfilSchema.safeParse({
        curso: "Ciência da Computação",
        cargo_student_club: "Desenvolvedora",
      }).success,
    ).toBe(false);
  });

  it("rejeita curso ausente", () => {
    expect(
      perfilSchema.safeParse({
        nome: "Ana Silva",
        cargo_student_club: "Desenvolvedora",
      }).success,
    ).toBe(false);
  });

  it("rejeita cargo ausente", () => {
    expect(
      perfilSchema.safeParse({
        nome: "Ana Silva",
        curso: "Ciência da Computação",
      }).success,
    ).toBe(false);
  });

  it("rejeita nome abaixo do mínimo", () => {
    expect(
      perfilSchema.safeParse({ ...perfilValido, nome: "A" }).success,
    ).toBe(false);
  });

  it("rejeita curso acima do máximo", () => {
    expect(
      perfilSchema.safeParse({
        ...perfilValido,
        curso: "C".repeat(101),
      }).success,
    ).toBe(false);
  });

  it("rejeita cargo acima do máximo", () => {
    expect(
      perfilSchema.safeParse({
        ...perfilValido,
        cargo_student_club: "C".repeat(101),
      }).success,
    ).toBe(false);
  });

  it("rejeita URL do LinkedIn com HTTP", () => {
    expect(
      perfilSchema.safeParse({
        ...perfilValido,
        linkedin_url: "http://linkedin.com/in/ana",
      }).success,
    ).toBe(false);
  });

  it("rejeita URL de outro domínio", () => {
    expect(
      perfilSchema.safeParse({
        ...perfilValido,
        linkedin_url: "https://example.com/ana",
      }).success,
    ).toBe(false);
  });

  it("aceita foto nula", () => {
    expect(
      perfilSchema.safeParse({
        ...perfilValido,
        foto_path: null,
      }).success,
    ).toBe(true);
  });

  it("aceita os limites máximos dos campos textuais", () => {
    const resultado = perfilSchema.safeParse({
      nome: "N".repeat(150),
      curso: "C".repeat(100),
      cargo_student_club: "C".repeat(100),
      linkedin_url: "",
      foto_path: null,
    });

    expect(resultado.success).toBe(true);
  });

  it("rejeita nome acima de 150 caracteres", () => {
    expect(
      perfilSchema.safeParse({
        ...perfilValido,
        nome: "N".repeat(151),
      }).success,
    ).toBe(false);
  });

  it("rejeita curso abaixo de 2 caracteres", () => {
    expect(
      perfilSchema.safeParse({
        ...perfilValido,
        curso: "C",
      }).success,
    ).toBe(false);
  });

  it("rejeita cargo abaixo de 2 caracteres", () => {
    expect(
      perfilSchema.safeParse({
        ...perfilValido,
        cargo_student_club: "C",
      }).success,
    ).toBe(false);
  });

  it("rejeita campos obrigatórios preenchidos só com espaços", () => {
    for (const campo of [
      "nome",
      "curso",
      "cargo_student_club",
    ] as const) {
      const resultado = perfilSchema.safeParse({
        ...perfilValido,
        [campo]: "   ",
      });

      expect(resultado.success).toBe(false);
    }
  });

  it("aceita LinkedIn como string vazia", () => {
    expect(
      perfilSchema.safeParse({
        ...perfilValido,
        linkedin_url: "",
      }).success,
    ).toBe(true);
  });

  it("rejeita LinkedIn com URL malformada", () => {
    expect(
      perfilSchema.safeParse({
        ...perfilValido,
        linkedin_url: "nao-e-uma-url",
      }).success,
    ).toBe(false);
  });

  it("rejeita LinkedIn acima de 255 caracteres", () => {
    expect(
      perfilSchema.safeParse({
        ...perfilValido,
        linkedin_url: `https://linkedin.com/${"a".repeat(240)}`,
      }).success,
    ).toBe(false);
  });

  it("rejeita caminho de foto composto só por espaços", () => {
    expect(
      perfilSchema.safeParse({
        ...perfilValido,
        foto_path: "   ",
      }).success,
    ).toBe(false);
  });
});
