import { describe, expect, it } from "vitest";
import { perfilSchema } from "./perfil";

const perfilValido = {
  nome_perfil: "Ana Silva",
  curso_perfil: "Ciência da Computação",
  cargo_perfil: "Desenvolvedora",
  linkedin_perfil: "https://www.linkedin.com/in/ana-silva",
  foto_perfil: "perfis/ana.webp",
  aceite_lgpd: true,
  aceite_imagem_lgpd: true,
};

describe("perfilSchema", () => {
  it("aceita um perfil válido", () => {
    expect(perfilSchema.safeParse(perfilValido).success).toBe(true);
  });

  it("aceita LinkedIn e foto ausentes", () => {
    expect(
      perfilSchema.safeParse({
        nome_perfil: "Ana Silva",
        curso_perfil: "Ciência da Computação",
        cargo_perfil: "Desenvolvedora",
        aceite_lgpd: true,
      }).success,
    ).toBe(true);
  });

  it("rejeita nome ausente", () => {
    expect(
      perfilSchema.safeParse({
        curso_perfil: "Ciência da Computação",
        cargo_perfil: "Desenvolvedora",
      }).success,
    ).toBe(false);
  });

  it("rejeita curso ausente", () => {
    expect(
      perfilSchema.safeParse({
        nome_perfil: "Ana Silva",
        cargo_perfil: "Desenvolvedora",
      }).success,
    ).toBe(false);
  });

  it("rejeita cargo ausente", () => {
    expect(
      perfilSchema.safeParse({
        nome_perfil: "Ana Silva",
        curso_perfil: "Ciência da Computação",
      }).success,
    ).toBe(false);
  });

  it("rejeita nome abaixo do mínimo", () => {
    expect(
      perfilSchema.safeParse({ ...perfilValido, nome_perfil: "A" }).success,
    ).toBe(false);
  });

  it("rejeita nome acima de 150 caracteres", () => {
    expect(
      perfilSchema.safeParse({
        ...perfilValido,
        nome_perfil: "N".repeat(151),
      }).success,
    ).toBe(false);
  });

  it("aceita nome com exatamente 150 caracteres", () => {
    expect(
      perfilSchema.safeParse({
        ...perfilValido,
        nome_perfil: "N".repeat(150),
      }).success,
    ).toBe(true);
  });

  it("rejeita curso abaixo de 2 caracteres", () => {
    expect(
      perfilSchema.safeParse({ ...perfilValido, curso_perfil: "C" }).success,
    ).toBe(false);
  });

  it("rejeita curso acima de 100 caracteres", () => {
    expect(
      perfilSchema.safeParse({
        ...perfilValido,
        curso_perfil: "C".repeat(101),
      }).success,
    ).toBe(false);
  });

  it("aceita curso com exatamente 100 caracteres", () => {
    expect(
      perfilSchema.safeParse({
        ...perfilValido,
        curso_perfil: "C".repeat(100),
      }).success,
    ).toBe(true);
  });

  it("rejeita cargo abaixo de 2 caracteres", () => {
    expect(
      perfilSchema.safeParse({
        ...perfilValido,
        cargo_perfil: "C",
      }).success,
    ).toBe(false);
  });

  it("rejeita cargo acima de 100 caracteres", () => {
    expect(
      perfilSchema.safeParse({
        ...perfilValido,
        cargo_perfil: "C".repeat(101),
      }).success,
    ).toBe(false);
  });

  it("aceita cargo com exatamente 100 caracteres", () => {
    expect(
      perfilSchema.safeParse({
        ...perfilValido,
        cargo_perfil: "C".repeat(100),
      }).success,
    ).toBe(true);
  });

  it("rejeita campos obrigatórios preenchidos só com espaços", () => {
    for (const campo of [
      "nome_perfil",
      "curso_perfil",
      "cargo_perfil",
    ] as const) {
      expect(
        perfilSchema.safeParse({ ...perfilValido, [campo]: "   " }).success,
      ).toBe(false);
    }
  });

  it("remove espaços nas extremidades antes de validar", () => {
    expect(
      perfilSchema.safeParse({
        ...perfilValido,
        nome_perfil: "  Ana Silva  ",
      }).success,
    ).toBe(true);
  });

  it("rejeita URL do LinkedIn com HTTP", () => {
    expect(
      perfilSchema.safeParse({
        ...perfilValido,
        linkedin_perfil: "http://linkedin.com/in/ana",
      }).success,
    ).toBe(false);
  });

  it("rejeita URL de outro domínio no LinkedIn", () => {
    expect(
      perfilSchema.safeParse({
        ...perfilValido,
        linkedin_perfil: "https://example.com/ana",
      }).success,
    ).toBe(false);
  });

  it("rejeita LinkedIn com URL malformada", () => {
    expect(
      perfilSchema.safeParse({
        ...perfilValido,
        linkedin_perfil: "nao-e-uma-url",
      }).success,
    ).toBe(false);
  });

  it("aceita LinkedIn como string vazia", () => {
    expect(
      perfilSchema.safeParse({ ...perfilValido, linkedin_perfil: "" }).success,
    ).toBe(true);
  });

  it("rejeita LinkedIn acima de 255 caracteres", () => {
    expect(
      perfilSchema.safeParse({
        ...perfilValido,
        linkedin_perfil: `https://linkedin.com/${"a".repeat(240)}`,
      }).success,
    ).toBe(false);
  });

  it("aceita foto nula", () => {
    expect(
      perfilSchema.safeParse({ ...perfilValido, foto_perfil: null }).success,
    ).toBe(true);
  });

  it("rejeita caminho de foto composto só por espaços", () => {
    expect(
      perfilSchema.safeParse({ ...perfilValido, foto_perfil: "   " }).success,
    ).toBe(false);
  });

  it("rejeita campo não permitido no perfil", () => {
    expect(
      perfilSchema.safeParse({ ...perfilValido, cpf: "000.000.000-00" })
        .success,
    ).toBe(false);
  });

  it("rejeita perfil sem aceite da LGPD", () => {
    expect(
      perfilSchema.safeParse({ ...perfilValido, aceite_lgpd: undefined })
        .success,
    ).toBe(false);
  });

  it("rejeita perfil com aceite da LGPD falso", () => {
    expect(
      perfilSchema.safeParse({ ...perfilValido, aceite_lgpd: false }).success,
    ).toBe(false);
  });

  it("rejeita foto sem aceite de uso de imagem", () => {
    const resultado = perfilSchema.safeParse({
      ...perfilValido,
      aceite_imagem_lgpd: false,
    });

    expect(resultado.success).toBe(false);
    expect(resultado.error?.issues[0].path).toEqual(["aceite_imagem_lgpd"]);
  });

  it("aceita perfil sem foto e sem aceite de imagem", () => {
    expect(
      perfilSchema.safeParse({
        ...perfilValido,
        foto_perfil: null,
        aceite_imagem_lgpd: false,
      }).success,
    ).toBe(true);
  });
});
