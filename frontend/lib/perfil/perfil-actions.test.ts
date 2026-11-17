import { beforeEach, describe, expect, it, vi } from "vitest";
import { criarPerfil, buscarPerfisPublicos } from "./perfil-actions";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  insert: vi.fn(),
  select: vi.fn(),
  selectPublico: vi.fn(),
  single: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  adminFrom: vi.fn(),

}));

vi.mock("../supabase/server", () => ({
  createClient: async () => ({ from: mocks.from }),
}));

vi.mock("../supabase/admin-client", () => ({
  createAdminClient: () => ({ from: mocks.adminFrom }), // separado: para provar que NÃO é usado
}));


beforeEach(() => {
  vi.resetAllMocks();
});

// ---------------------------------------------------------------------------
// Dados de teste
// ---------------------------------------------------------------------------

const perfilValido = {
  nome_perfil: "Maria das Couves",
  curso_perfil: "Engenharia de Software",
  cargo_perfil: "Desenvolvedor Backend",
  linkedin_perfil: "https://www.linkedin.com/in/teste",
  foto_perfil: "perfis/maria.webp",
};

// ---------------------------------------------------------------------------
// criarPerfil
// ---------------------------------------------------------------------------

describe("criarPerfil", () => {
  function setupInserir(result: Record<string, unknown>) {
    mocks.single.mockResolvedValue(result);
    mocks.select.mockReturnValue({ single: mocks.single });
    mocks.insert.mockReturnValue({ select: mocks.select });
    mocks.from.mockReturnValue({ insert: mocks.insert });
  }

  it("salva perfil válido e retorna id, status e criado_em", async () => {
    setupInserir({
      data: {
        id_perfil: "uuid-ficticio-001",
        status_perfil: "pendente",
        data_criacao_perfil: "2026-10-31T00:00:00+00:00",
      },
      error: null,
    });

    const resultado = await criarPerfil(perfilValido);

    expect(resultado.id).toBe("uuid-ficticio-001");
    expect(resultado.status).toBe("pendente");
    expect(resultado.criado_em).toBe("2026-10-31T00:00:00+00:00");
  });

  it("salva perfil sem linkedin e sem foto", async () => {
    setupInserir({
      data: {
        id_perfil: "uuid-ficticio-002",
        status_perfil: "pendente",
        data_criacao_perfil: "2026-10-31T00:00:00+00:00",
      },
      error: null,
    });

    const resultado = await criarPerfil({
      nome_perfil: "João Sem LinkedIn",
      curso_perfil: "Administração",
      cargo_perfil: "Coordenador",
    });

    expect(resultado.status).toBe("pendente");
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        linkedin_perfil: null,
        foto_perfil: null,
      })
    );
  });

  it("rejeita perfil sem campo obrigatório", async () => {
    await expect(
      criarPerfil({
        curso_perfil: "Engenharia",
        cargo_perfil: "Dev",
      } as never)
    ).rejects.toThrow();

    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("rejeita campo fora do escopo", async () => {
    await expect(
      criarPerfil({
        ...perfilValido,
        cpf: "123.456.789-00",
      } as never)
    ).rejects.toThrow();

    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("rejeita linkedin sem HTTPS", async () => {
    await expect(
      criarPerfil({
        ...perfilValido,
        linkedin_perfil: "http://linkedin.com/in/teste",
      })
    ).rejects.toThrow();

    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("lança erro quando banco falha", async () => {
    setupInserir({ data: null, error: { message: "timeout" } });

    await expect(criarPerfil(perfilValido)).rejects.toThrow(
      "Ocorreu um problema ao registrar seu perfil."
    );
  });
});

// ---------------------------------------------------------------------------
// buscarPerfisPublicos
// ---------------------------------------------------------------------------

describe("buscarPerfisPublicos", () => {
  function setupBusca(result: Record<string, unknown>) {
    mocks.order.mockResolvedValue(result);
    mocks.eq.mockReturnValue({ order: mocks.order });
    mocks.selectPublico.mockReturnValue({ eq: mocks.eq });
    mocks.from.mockReturnValue({ select: mocks.selectPublico });
  }

  it("pede ao banco só os 5 campos públicos dos perfis aprovados", async () => {
    const perfisMock = [
      {
        nome_perfil: "Ana Silva",
        curso_perfil: "Ciência da Computação",
        cargo_perfil: "Desenvolvedora",
        linkedin_perfil: "https://www.linkedin.com/in/ana",
        foto_perfil: "perfis/ana.webp",
      },
    ];
    setupBusca({ data: perfisMock, error: null });

    const resultado = await buscarPerfisPublicos();

    expect(resultado).toEqual(perfisMock);
    expect(mocks.selectPublico).toHaveBeenCalledWith(
      "nome_perfil, curso_perfil, cargo_perfil, linkedin_perfil, foto_perfil"
    );
    expect(mocks.eq).toHaveBeenCalledWith("status_perfil", "aprovado");
  });

  it("retorna lista vazia quando não há aprovados", async () => {
    setupBusca({ data: [], error: null });

    const resultado = await buscarPerfisPublicos();

    expect(resultado).toEqual([]);
  });

  it("nunca pede id_perfil nem status_perfil ao banco", async () => {
    setupBusca({ data: [], error: null });

    await buscarPerfisPublicos();

    const camposPedidos = mocks.selectPublico.mock.calls[0][0] as string;
    expect(camposPedidos).not.toContain("id_perfil");
    expect(camposPedidos).not.toContain("status_perfil");
  });

  it("usa o cliente comum (com RLS), nunca o cliente admin", async () => {
    setupBusca({ data: [], error: null });

    await buscarPerfisPublicos();

    expect(mocks.from).toHaveBeenCalledWith("tb_perfil");
    expect(mocks.adminFrom).not.toHaveBeenCalled();
  });

  it("lança erro quando banco falha", async () => {
    setupBusca({ data: null, error: { message: "timeout" } });

    await expect(buscarPerfisPublicos()).rejects.toThrow(
      "Não foi possível carregar os voluntários."
    );
  });
});
