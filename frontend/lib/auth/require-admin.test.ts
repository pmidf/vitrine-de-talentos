import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireAdmin } from "./require-admin";

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), maybeSingle: vi.fn(), redirect: vi.fn(), eq: vi.fn() }));
vi.mock("react", () => ({ cache: (fn: unknown) => fn }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("../supabase/server", () => ({ createClient: async () => ({
  auth: { getUser: mocks.getUser },
  from: () => ({ select: () => ({ eq: mocks.eq }) }),
}) }));

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: "admin-id" } }, error: null });
  mocks.eq.mockReturnValue({ maybeSingle: mocks.maybeSingle });
  mocks.maybeSingle.mockResolvedValue({ data: { status_admin: true }, error: null });
});

describe("acesso administrativo no servidor", () => {
  it("aceita apenas administrador ativo vinculado ao usuário autenticado", async () => {
    await requireAdmin();
    expect(mocks.eq).toHaveBeenCalledWith("id_admin", "admin-id");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
  it("redireciona visitantes sem sessão", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    await requireAdmin();
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
    expect(mocks.eq).not.toHaveBeenCalled();
  });
  it.each([null, { status_admin: false }])("bloqueia administrador ausente ou inativo: %s", async (data) => {
    mocks.maybeSingle.mockResolvedValue({ data, error: null });
    await requireAdmin();
    expect(mocks.redirect).toHaveBeenCalledWith("/login?erro=credenciais");
  });
  it("bloqueia sessões inválidas", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: { status: 401 } });
    await requireAdmin();
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });
  it("trata falha na consulta sem liberar acesso", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: { message: "offline" } });
    await requireAdmin();
    expect(mocks.redirect).toHaveBeenCalledWith("/login?erro=conexao");
  });
  it("trata conexão indisponível na autenticação", async () => {
    mocks.getUser.mockRejectedValue(new TypeError("Failed to fetch"));
    await requireAdmin();
    expect(mocks.redirect).toHaveBeenCalledWith("/login?erro=conexao");
  });
});
