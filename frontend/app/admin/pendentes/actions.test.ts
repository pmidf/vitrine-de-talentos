import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  suspenderPerfil,
  removerPerfil,
  reativarPerfil,
} from "@/lib/admin/perfil-actions";
import { reativarAction, removerAction, suspenderAction } from "./actions";

vi.mock("@/lib/auth/require-admin", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/lib/admin/perfil-actions", () => ({
  aprovarPerfil: vi.fn(),
  rejeitarPerfil: vi.fn(),
  suspenderPerfil: vi.fn(),
  removerPerfil: vi.fn(),
  reativarPerfil: vi.fn(),
}));

const idPerfil = "d3000000-2222-3333-4444-555555555555";
const ERRO_DADOS = "Os dados enviados não são válidos. Atualize a página e tente novamente.";

beforeEach(() => {
  vi.resetAllMocks();
});

describe("suspenderAction e removerAction", () => {
  const casos = [
    { nome: "suspenderAction", action: suspenderAction, lib: suspenderPerfil, erroMotivo: "Escreva o motivo da suspensão." },
    { nome: "removerAction", action: removerAction, lib: removerPerfil, erroMotivo: "Escreva o motivo da remoção." },
  ];

  for (const { nome, action, lib, erroMotivo } of casos) {
    describe(nome, () => {
      it("chama a função com o motivo sem espaços nas pontas", async () => {
        expect(await action(idPerfil, "  Dados desatualizados  ")).toEqual({ ok: true });
        expect(lib).toHaveBeenCalledWith(idPerfil, "Dados desatualizados");
      });

      it("recusa id inválido sem chamar a função", async () => {
        expect(await action("nao-e-um-id", "motivo")).toEqual({ ok: false, erro: ERRO_DADOS });
        expect(lib).not.toHaveBeenCalled();
      });

      it("recusa motivo vazio sem chamar a função", async () => {
        expect(await action(idPerfil, "   ")).toEqual({ ok: false, erro: erroMotivo });
        expect(lib).not.toHaveBeenCalled();
      });

      it("devolve a mensagem segura lançada pela função", async () => {
        vi.mocked(lib).mockRejectedValue(new Error("Este perfil já foi removido e não pode ser moderado."));
        expect(await action(idPerfil, "motivo")).toEqual({
          ok: false,
          erro: "Este perfil já foi removido e não pode ser moderado.",
        });
      });
    });
  }
});

describe("reativarAction", () => {
  it("reativa sem motivo", async () => {
    expect(await reativarAction(idPerfil)).toEqual({ ok: true });
    expect(reativarPerfil).toHaveBeenCalledWith(idPerfil, null);
  });

  it("reativa com motivo sem espaços nas pontas", async () => {
    expect(await reativarAction(idPerfil, "  Dados revisados  ")).toEqual({ ok: true });
    expect(reativarPerfil).toHaveBeenCalledWith(idPerfil, "Dados revisados");
  });

  it("recusa id inválido sem chamar a função", async () => {
    expect(await reativarAction("nao-e-um-id")).toEqual({ ok: false, erro: ERRO_DADOS });
    expect(reativarPerfil).not.toHaveBeenCalled();
  });

  it("recusa motivo com mais de 500 caracteres", async () => {
    const resultado = await reativarAction(idPerfil, "a".repeat(501));
    expect(resultado.ok).toBe(false);
    expect(reativarPerfil).not.toHaveBeenCalled();
  });

  it("devolve a mensagem segura lançada pela função", async () => {
    vi.mocked(reativarPerfil).mockRejectedValue(
      new Error("Este perfil não pode ser aprovado: falta o aceite da LGPD."),
    );
    expect(await reativarAction(idPerfil)).toEqual({
      ok: false,
      erro: "Este perfil não pode ser aprovado: falta o aceite da LGPD.",
    });
  });
});
