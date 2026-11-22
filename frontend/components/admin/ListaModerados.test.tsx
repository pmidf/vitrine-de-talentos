// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { reativarAction, removerAction, suspenderAction } from "@/app/admin/pendentes/actions";
import type { PerfilModerado, StatusModerado } from "@/lib/admin/perfil-actions";
import ListaModerados from "./ListaModerados";

vi.mock("@/app/admin/pendentes/actions", () => ({
  suspenderAction: vi.fn(),
  removerAction: vi.fn(),
  reativarAction: vi.fn(),
}));

function criar(id: string, nome: string, status: StatusModerado): PerfilModerado {
  return {
    id_perfil: id,
    nome_perfil: nome,
    curso_perfil: "Engenharia de Software",
    cargo_perfil: "Desenvolvedor",
    linkedin_perfil: null,
    foto_perfil: null,
    tb_lgpd_perfil: { aceite_lgpd: true, aceite_imagem_lgpd: false },
    status_perfil: status,
  };
}

const diego = criar("d3000000-2222-3333-4444-555555555555", "Diego Ferreira", "aprovado");
const carla = criar("c1000000-2222-3333-4444-555555555555", "Carla Souza", "suspenso");
const bruno = criar("b2000000-2222-3333-4444-555555555555", "Bruno Lima", "removido");

beforeEach(() => {
  vi.mocked(suspenderAction).mockResolvedValue({ ok: true });
  vi.mocked(removerAction).mockResolvedValue({ ok: true });
  vi.mocked(reativarAction).mockResolvedValue({ ok: true });
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe("aba Todos os voluntários", () => {
  it("mostra a etiqueta de status e só as ações permitidas para cada perfil", () => {
    render(<ListaModerados perfisIniciais={[diego, carla, bruno]} />);

    expect(screen.getByRole("heading", { name: "Diego Ferreira Aprovado" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Carla Souza Suspenso" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Bruno Lima Removido" })).toBeTruthy();

    expect(screen.getByRole("button", { name: "Suspender perfil de Diego Ferreira" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Reativar perfil de Diego Ferreira" })).toBeNull();

    expect(screen.getByRole("button", { name: "Reativar perfil de Carla Souza" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Suspender perfil de Carla Souza" })).toBeNull();

    expect(screen.queryByRole("button", { name: /perfil de Bruno Lima/ })).toBeNull();
    expect(screen.getByText("Remoção definitiva: nenhuma ação disponível.")).toBeTruthy();
  });

  it("exige motivo para suspender e troca a etiqueta sem tirar o cartão da lista", async () => {
    const usuario = userEvent.setup();
    render(<ListaModerados perfisIniciais={[diego]} />);

    await usuario.click(screen.getByRole("button", { name: "Suspender perfil de Diego Ferreira" }));
    const confirmar = screen.getByRole("button", { name: "Confirmar suspensão" });

    await usuario.click(confirmar);
    expect(screen.getByRole("alert").textContent).toMatch(/escreva o motivo/i);
    expect(suspenderAction).not.toHaveBeenCalled();

    await usuario.type(screen.getByRole("textbox", { name: /motivo da suspensão/i }), " Conduta inadequada ");
    await usuario.click(confirmar);
    expect(suspenderAction).toHaveBeenCalledWith(diego.id_perfil, "Conduta inadequada");
    expect(screen.getByRole("heading", { name: "Diego Ferreira Suspenso" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reativar perfil de Diego Ferreira" })).toBeTruthy();
    expect(screen.getByRole("status").textContent).toMatch(/perfil de Diego Ferreira suspenso/i);
  });

  it("reativa um perfil suspenso sem motivo", async () => {
    const usuario = userEvent.setup();
    render(<ListaModerados perfisIniciais={[carla]} />);

    await usuario.click(screen.getByRole("button", { name: "Reativar perfil de Carla Souza" }));
    await usuario.click(screen.getByRole("button", { name: "Confirmar reativação" }));

    expect(reativarAction).toHaveBeenCalledWith(carla.id_perfil, undefined);
    expect(screen.getByRole("heading", { name: "Carla Souza Aprovado" })).toBeTruthy();
  });

  it("filtra por status, mostra as contagens e leva o foco para o aviso", async () => {
    const usuario = userEvent.setup();
    render(<ListaModerados perfisIniciais={[diego, carla, bruno]} />);

    expect(screen.getByRole("radio", { name: "Todos (3)" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Rejeitados (0)" })).toBeTruthy();

    await usuario.click(screen.getByRole("radio", { name: /^Rejeitados/ }));
    expect(screen.getByText('Nenhum perfil com status "Rejeitado".')).toBeTruthy();

    await usuario.click(screen.getByRole("radio", { name: /^Aprovados/ }));
    expect(screen.getByRole("heading", { name: /Diego Ferreira/ })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: /Carla Souza/ })).toBeNull();

    await usuario.click(screen.getByRole("button", { name: "Suspender perfil de Diego Ferreira" }));
    await usuario.type(screen.getByRole("textbox", { name: /motivo da suspensão/i }), "Teste");
    await usuario.click(screen.getByRole("button", { name: "Confirmar suspensão" }));
    expect(screen.getByText('Nenhum perfil com status "Aprovado".')).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Suspensos (2)" })).toBeTruthy();

    expect(document.activeElement).toBe(screen.getByRole("status"));
  });

  it("mantém o status e mostra o erro quando a ação falha", async () => {
    const usuario = userEvent.setup();
    vi.mocked(removerAction)
      .mockResolvedValueOnce({ ok: false, erro: "Não foi possível remover o perfil." })
      .mockRejectedValueOnce(new Error("sem rede"));
    render(<ListaModerados perfisIniciais={[diego]} />);

    await usuario.click(screen.getByRole("button", { name: "Remover perfil de Diego Ferreira" }));
    await usuario.type(screen.getByRole("textbox", { name: /motivo da remoção/i }), "Duplicado");
    const confirmar = screen.getByRole("button", { name: "Confirmar remoção" });

    // 1ª tentativa: o servidor recusa
    await usuario.click(confirmar);
    expect(screen.getByRole("alert").textContent).toBe("Não foi possível remover o perfil.");
    expect(screen.getByRole("heading", { name: "Diego Ferreira Aprovado" })).toBeTruthy();

    // 2ª tentativa: falha de conexão
    await usuario.click(confirmar);
    expect(screen.getByRole("alert").textContent).toMatch(/verifique sua conexão/i);
    expect(screen.getByRole("heading", { name: "Diego Ferreira Aprovado" })).toBeTruthy();
  });
});
