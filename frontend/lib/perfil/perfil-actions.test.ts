import { beforeEach, describe, expect, it, vi } from "vitest";
import { criarPerfil, buscarPerfisPublicos } from "./perfil-actions";
import type { PerfilInput } from "../validations/perfil";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  selectPublico: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  adminFrom: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("../supabase/server", () => ({
  createClient: async () => ({ from: mocks.from , rpc: mocks.rpc}),
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

const perfilValido: PerfilInput = {
  nome_perfil: "Maria das Couves",
  curso_perfil: "Engenharia de Software",
  cargo_perfil: "Desenvolvedor Backend",
  linkedin_perfil: "https://www.linkedin.com/in/teste",
  foto_perfil: "perfis/maria.webp",
  aceite_lgpd: true,
  aceite_imagem_lgpd: true,
};


// ---------------------------------------------------------------------------
// criarPerfil
// ---------------------------------------------------------------------------

describe("criarPerfil", () => {
  function setupEnviar(result: Record<string, unknown>) {
    mocks.rpc.mockResolvedValue(result);
  }

  it("envia perfil válido pela função enviar_perfil e retorna o id", async () => {
    setupEnviar({ data: "uuid-ficticio-001", error: null });

    const resultado = await criarPerfil(perfilValido);

    expect(resultado).toEqual({ id: "uuid-ficticio-001" });
    expect(mocks.rpc).toHaveBeenCalledWith("enviar_perfil", {
      p_nome_perfil: "Maria das Couves",
      p_curso_perfil: "Engenharia de Software",
      p_cargo_perfil: "Desenvolvedor Backend",
      p_linkedin_perfil: "https://www.linkedin.com/in/teste",
      p_foto_perfil: "perfis/maria.webp",
      p_aceite_lgpd: true,
      p_aceite_imagem_lgpd: true,
    });
  });

  it("nunca grava direto na tabela", async () => {
    setupEnviar({ data: "uuid-ficticio-001", error: null });

    await criarPerfil(perfilValido);

    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("envia null para linkedin e foto ausentes e aceite de imagem falso", async () => {
    setupEnviar({ data: "uuid-ficticio-002", error: null });

    await criarPerfil({
      nome_perfil: "João Sem LinkedIn",
      curso_perfil: "Administração",
      cargo_perfil: "Coordenador",
      aceite_lgpd: true,
    });

    expect(mocks.rpc).toHaveBeenCalledWith(
      "enviar_perfil",
      expect.objectContaining({
        p_linkedin_perfil: null,
        p_foto_perfil: null,
        p_aceite_imagem_lgpd: false,
      })
    );
  });

  it("rejeita perfil sem aceite da LGPD sem chamar o banco", async () => {
    await expect(
      criarPerfil({ ...perfilValido, aceite_lgpd: false } as never)
    ).rejects.toThrow("É preciso aceitar os termos da LGPD");

    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("rejeita foto sem aceite de imagem sem chamar o banco", async () => {
    await expect(
      criarPerfil({ ...perfilValido, aceite_imagem_lgpd: false })
    ).rejects.toThrow("É preciso autorizar o uso da imagem");

    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("rejeita perfil sem campo obrigatório", async () => {
    await expect(
      criarPerfil({
        curso_perfil: "Engenharia",
        cargo_perfil: "Dev",
      } as never)
    ).rejects.toThrow();

    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("rejeita campo fora do escopo", async () => {
    await expect(
      criarPerfil({
        ...perfilValido,
        cpf: "123.456.789-00",
      } as never)
    ).rejects.toThrow();

    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("rejeita linkedin sem HTTPS", async () => {
    await expect(
      criarPerfil({
        ...perfilValido,
        linkedin_perfil: "http://linkedin.com/in/teste",
      })
    ).rejects.toThrow();

    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("lança erro genérico quando o banco falha, sem dados pessoais no log", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    setupEnviar({ data: null, error: { code: "P0001", message: "falha" } });

    await expect(criarPerfil(perfilValido)).rejects.toThrow(
      "Ocorreu um problema ao registrar seu perfil."
    );

    expect(JSON.stringify(log.mock.calls)).not.toContain("Maria das Couves");
    log.mockRestore();
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
