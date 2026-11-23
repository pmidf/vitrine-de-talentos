// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import PaginaCadastro from "./page";
import { enviarPerfil } from "./actions";

vi.mock("./actions", () => ({ enviarPerfil: vi.fn() }));

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe("Página de cadastro", () => {
  it("foca o nome inválido e envia sem foto após o aceite da LGPD", async () => {
    const teclado = userEvent.setup();
    vi.mocked(enviarPerfil).mockResolvedValue({ ok: true });
    render(<PaginaCadastro />);

    const nome = screen.getByRole("textbox", { name: "Nome completo" });
    await teclado.click(screen.getByRole("button", { name: "Enviar perfil" }));
    expect(document.activeElement).toBe(nome);
    expect(screen.getByText("O nome deve ter pelo menos 2 caracteres.")).toBeTruthy();

    await teclado.keyboard("Ana Silva");
    await teclado.tab();
    await teclado.keyboard("Engenharia");
    await teclado.tab();
    await teclado.keyboard("Voluntária");
    await teclado.click(screen.getByRole("button", { name: "Enviar perfil" }));

    const lgpd = screen.getByRole("checkbox", { name: /aceito o tratamento/i });
    expect(document.activeElement).toBe(lgpd);
    expect(enviarPerfil).not.toHaveBeenCalled();

    await teclado.keyboard(" ");
    await teclado.tab();
    expect(document.activeElement).toBe(screen.getByRole("checkbox", { name: /autorizo a publicação/i }));
    await teclado.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Enviar perfil" }));
    await teclado.keyboard("{Enter}");

    const confirmacao = await screen.findByRole("heading", { name: "Perfil enviado" });
    expect(document.activeElement).toBe(confirmacao);
    expect(screen.getByText(/só aparecerá na Vitrine após a aprovação/)).toBeTruthy();
    const dados = vi.mocked(enviarPerfil).mock.calls[0][0];
    expect(dados.get("foto_perfil")).toBeNull();
    expect(dados.get("site_empresa")).toBe("");
  });
});
