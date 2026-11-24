import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAdminId, requireAdmin } from "./require-admin";


const mocks = vi.hoisted(() => ({ connection: vi.fn(), getUser: vi.fn(), maybeSingle: vi.fn(), redirect: vi.fn(), eq: vi.fn() }));
// Imita o cache do React: guarda o resultado até o fim da "requisição".
// Cada teste é uma requisição nova (os caches são zerados no beforeEach).
const caches = vi.hoisted(() => ({ zerar: [] as Array<() => void> }));
vi.mock("react", () => ({
  cache: <T,>(fn: () => T) => {
    let guardado: { valor: T } | null = null;
    caches.zerar.push(() => { guardado = null; });
    return () => (guardado ??= { valor: fn() }).valor;
  },
}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next/server", () => ({ connection: mocks.connection }));
vi.mock("../supabase/server", () => ({ createClient: async () => ({
  auth: { getUser: mocks.getUser },
  from: () => ({ select: () => ({ eq: mocks.eq }) }),
}) }));

beforeEach(() => {
  caches.zerar.forEach((zerar) => zerar());
  vi.resetAllMocks();
  mocks.connection.mockResolvedValue(undefined);
  mocks.getUser.mockResolvedValue({ data: { user: { id: "admin-id" } }, error: null });
  mocks.eq.mockReturnValue({ maybeSingle: mocks.maybeSingle });
  mocks.maybeSingle.mockResolvedValue({ data: { status_admin: true }, error: null });
});

describe("acesso administrativo no servidor", () => {
  it("preserva a suspensão do Next.js sem consultar a sessão no prerender", async () => {
    const suspension = new Error("prerender interrompido pelo framework");
    mocks.connection.mockRejectedValue(suspension);
    await expect(requireAdmin()).rejects.toBe(suspension);
    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
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


describe("getAdminId", () => {
  it("retorna o id do administrador ativo", async () => {
    mocks.maybeSingle.mockResolvedValue({
      data: { id_admin: "admin-id", status_admin: true },
      error: null,
    });
    await expect(getAdminId()).resolves.toBe("admin-id");
  });

  it.each([null, { id_admin: "admin-id", status_admin: false }])(
    "recusa administrador ausente ou desativado: %s",
    async (data) => {
      mocks.maybeSingle.mockResolvedValue({ data, error: null });
      await expect(getAdminId()).rejects.toThrow("Acesso negado");
    },
  );

  it("recusa quem não está logado", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(getAdminId()).rejects.toThrow("Acesso negado");
  });

  it("recusa quando a conexão com o Supabase falha", async () => {
    mocks.getUser.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(getAdminId()).rejects.toThrow("Acesso negado");
  });
});

describe("uma consulta por requisição (SCRUM-147)", () => {
  it("requireAdmin e getAdminId reaproveitam a mesma consulta", async () => {
    mocks.maybeSingle.mockResolvedValue({
      data: { id_admin: "admin-id", status_admin: true },
      error: null,
    });

    await requireAdmin();
    await expect(getAdminId()).resolves.toBe("admin-id");
    await expect(getAdminId()).resolves.toBe("admin-id");

    expect(mocks.getUser).toHaveBeenCalledTimes(1);
    expect(mocks.maybeSingle).toHaveBeenCalledTimes(1);
  });

  it("o reaproveitamento não libera quem não é admin", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: { status_admin: false }, error: null });

    await requireAdmin();
    expect(mocks.redirect).toHaveBeenCalledWith("/login?erro=credenciais");
    await expect(getAdminId()).rejects.toThrow("Acesso negado");
    expect(mocks.getUser).toHaveBeenCalledTimes(1);
  });
});
