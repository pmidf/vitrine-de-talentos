// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PerfilPendente } from "@/lib/admin/perfil-actions";
import { aprovarPerfil, rejeitarPerfil } from "@/lib/admin/perfil-actions";
import ListaPendentes from "./ListaPendentes";

vi.mock("@/lib/auth/require-admin", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/lib/admin/perfil-actions", () => ({
  aprovarPerfil: vi.fn(),
  rejeitarPerfil: vi.fn(),
}));

const perfil: PerfilPendente = {
  id_perfil: "d3000000-2222-3333-4444-555555555555",
  nome_perfil: "Diego Ferreira",
  curso_perfil: "Engenharia de Software",
  cargo_perfil: "Desenvolvedor Front-end",
  linkedin_perfil: "https://linkedin.com/in/diego-ferreira-teste",
  foto_perfil: "https://example.com/fotos/diego.jpg",
  tb_lgpd_perfil: { aceite_lgpd: true, aceite_imagem_lgpd: false },
};

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe("moderação de perfis pendentes", () => {
  it("exibe dados e consentimento e aprova somente após a confirmação pelo teclado", async () => {
    const teclado = userEvent.setup();
    render(<ListaPendentes perfisIniciais={[perfil]} />);

    expect(screen.getByText(perfil.curso_perfil)).toBeTruthy();
    expect(screen.getByText(perfil.cargo_perfil)).toBeTruthy();
    expect(screen.getByText("Concedido")).toBeTruthy();
    expect(screen.getByRole("link", { name: /diego-ferreira-teste/ })).toBeTruthy();
    expect(screen.getByRole("img", { name: /foto não disponível/i })).toBeTruthy();

    await teclado.tab();
    await teclado.tab();
    await teclado.keyboard("{Enter}");
    const confirmar = screen.getByRole("button", { name: "Sim, aprovar" });
    expect(document.activeElement).toBe(confirmar);
    expect(aprovarPerfil).not.toHaveBeenCalled();

    await teclado.keyboard("{Enter}");
    expect(aprovarPerfil).toHaveBeenCalledWith(perfil.id_perfil);
    expect(screen.getByText(/perfil de Diego Ferreira aprovado/i)).toBeTruthy();
    expect(screen.getByText("Nenhum perfil aguardando validação.")).toBeTruthy();
  });

  it("exige motivo, mantém o cartão em caso de falha e permite tentar novamente", async () => {
    const usuario = userEvent.setup();
      vi.mocked(rejeitarPerfil).mockRejectedValueOnce(
      new Error("Não foi possível rejeitar o perfil."),
    );
    render(<ListaPendentes perfisIniciais={[perfil]} />);

    await usuario.click(screen.getByRole("button", { name: /rejeitar perfil/i }));
    const motivo = screen.getByRole("textbox", { name: /motivo da rejeição/i });
    expect(document.activeElement).toBe(motivo);
    const confirmar = screen.getByRole("button", { name: "Confirmar rejeição" });

    await usuario.click(confirmar);
    expect(screen.getByRole("alert").textContent).toMatch(/escreva o motivo/i);
    expect(rejeitarPerfil).not.toHaveBeenCalled();

    await usuario.type(motivo, " Cargo não confere ");
    await usuario.click(confirmar);
    expect(screen.getByRole("alert").textContent).toMatch(/não foi possível rejeitar/i);
    expect(screen.getByRole("heading", { name: perfil.nome_perfil })).toBeTruthy();

    await usuario.click(confirmar);
    expect(rejeitarPerfil).toHaveBeenLastCalledWith(perfil.id_perfil, "Cargo não confere");
    expect(screen.getByText(/perfil de Diego Ferreira rejeitado/i)).toBeTruthy();
    expect(screen.queryByRole("heading", { name: perfil.nome_perfil })).toBeNull();
  });

  it("mostra a mensagem clara do banco quando a aprovação é recusada", async () => {
    const usuario = userEvent.setup();
    vi.mocked(aprovarPerfil).mockRejectedValueOnce(
      new Error("Este perfil não pode ser aprovado: falta o aceite da LGPD."),
    );
    render(<ListaPendentes perfisIniciais={[perfil]} />);

    await usuario.click(screen.getByRole("button", { name: /aprovar perfil/i }));
    await usuario.click(screen.getByRole("button", { name: "Sim, aprovar" }));

    expect(screen.getByRole("alert").textContent).toBe(
      "Este perfil não pode ser aprovado: falta o aceite da LGPD.",
    );
    expect(screen.getByRole("heading", { name: perfil.nome_perfil })).toBeTruthy();
  });

  it("mostra a mensagem de lista vazia ao abrir a página sem pendências", () => {
    render(<ListaPendentes perfisIniciais={[]} />);
    expect(screen.getByText("Nenhum perfil aguardando validação.")).toBeTruthy();
  });
});
