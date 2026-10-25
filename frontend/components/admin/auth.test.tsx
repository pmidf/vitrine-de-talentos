// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginForm from "./LoginForm";
import LogoutButton from "./LogoutButton";
import { CONNECTION_ERROR, INVALID_CREDENTIALS } from "@/lib/auth/messages";

const mocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(), signOut: vi.fn(), replace: vi.fn(), refresh: vi.fn(),
}));
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: mocks }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => mocks }));

afterEach(cleanup);
beforeEach(() => vi.resetAllMocks());

async function fillLogin() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("E-mail"), "admin@example.test");
  await user.type(screen.getByLabelText("Senha"), "senha-de-teste");
  return user;
}

describe("login administrativo", () => {
  it("envia as credenciais e segue para os pendentes", async () => {
    mocks.signInWithPassword.mockResolvedValue({ error: null });
    render(<LoginForm />);
    const user = await fillLogin();
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    expect(mocks.signInWithPassword).toHaveBeenCalledWith({
      email: "admin@example.test", password: "senha-de-teste",
    });
    expect(mocks.replace).toHaveBeenCalledWith("/admin/pendentes");
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it("impede novos envios enquanto aguarda a resposta", async () => {
    let finish!: (value: { error: null }) => void;
    mocks.signInWithPassword.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const { container } = render(<LoginForm />);
    const user = await fillLogin();
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    expect((screen.getByRole("button", { name: "Entrando..." }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.submit(container.querySelector("form")!);
    expect(mocks.signInWithPassword).toHaveBeenCalledOnce();
    await act(async () => finish({ error: null }));
  });

  it.each(["invalid_credentials", "user_banned", "email_not_confirmed"])(
    "não revela detalhes do erro %s", async (code) => {
      mocks.signInWithPassword.mockResolvedValue({ error: { code, status: 400, message: "Detalhe privado" } });
      render(<LoginForm />);
      const user = await fillLogin();
      await user.click(screen.getByRole("button", { name: "Entrar" }));
      expect(screen.getByRole("alert").textContent).toBe(INVALID_CREDENTIALS);
      expect(mocks.replace).not.toHaveBeenCalled();
      expect((screen.getByRole("button", { name: "Entrar" }) as HTMLButtonElement).disabled).toBe(false);
    },
  );

  it.each(["rejeição de rede", "erro retornado pelo SDK", "servidor indisponível"])(
    "permite tentar novamente após %s", async (scenario) => {
      if (scenario === "rejeição de rede") mocks.signInWithPassword.mockRejectedValue(new TypeError("Failed to fetch"));
      else mocks.signInWithPassword.mockResolvedValue({ error: scenario === "erro retornado pelo SDK"
        ? { name: "AuthRetryableFetchError" } : { status: 503 } });
      render(<LoginForm />);
      const user = await fillLogin();
      await user.click(screen.getByRole("button", { name: "Entrar" }));
      expect(screen.getByRole("alert").textContent).toBe(CONNECTION_ERROR);
      mocks.signInWithPassword.mockResolvedValue({ error: null });
      await user.click(screen.getByRole("button", { name: "Entrar" }));
      expect(mocks.replace).toHaveBeenCalledWith("/admin/pendentes");
    },
  );
});

describe("saída", () => {
  it("encerra a sessão deste navegador e retorna ao login", async () => {
    mocks.signOut.mockResolvedValue({ error: null });
    render(<LogoutButton />);
    await userEvent.click(screen.getByRole("button", { name: "Sair" }));
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(mocks.replace).toHaveBeenCalledWith("/login");
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it("mostra falha e permite repetir a saída", async () => {
    mocks.signOut.mockResolvedValue({ error: new Error("offline") });
    render(<LogoutButton />);
    await userEvent.click(screen.getByRole("button", { name: "Sair" }));
    expect(screen.getByRole("alert").textContent).toContain("Não foi possível sair.");
    expect(mocks.replace).not.toHaveBeenCalled();
    mocks.signOut.mockResolvedValue({ error: null });
    await userEvent.click(screen.getByRole("button", { name: "Sair" }));
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/login"));
  });
});
