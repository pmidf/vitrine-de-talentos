import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  listarPendentes,
  listarModerados,
  reativarPerfil,
  aprovarPerfil,
  rejeitarPerfil,
  suspenderPerfil,
  removerPerfil,
} from "./perfil-actions";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  getAdminId: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  neq: vi.fn(),
  order: vi.fn(),
  rpc: vi.fn(),
  maybeSingle: vi.fn(),
  update: vi.fn(),
  updateEq: vi.fn(),
  remove: vi.fn(),
  createSignedUrls: vi.fn(),
}));

vi.mock("../auth/require-admin", () => ({
  getAdminId: mocks.getAdminId,
}));

// Cliente com a chave secreta: usado só pelo listarPendentes
vi.mock("../supabase/admin-client", () => ({
    createAdminClient: () => ({
    from: mocks.from,
    storage: {
      from: () => ({ remove: mocks.remove, createSignedUrls: mocks.createSignedUrls }),
    },
  }),
}));

// Cliente com a sessão de quem está logado: usado pela moderação
vi.mock("../supabase/server", () => ({
  createClient: async () => ({ rpc: mocks.rpc }),
}));

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getAdminId.mockResolvedValue("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");
  mocks.rpc.mockResolvedValue({ data: null, error: null });
  // Descarte da foto: por padrão, o perfil não tem foto
  mocks.maybeSingle.mockResolvedValue({ data: { foto_perfil: null }, error: null });
  mocks.from.mockReturnValue({
    select: () => ({ eq: () => ({ maybeSingle: mocks.maybeSingle }) }),
    update: mocks.update,
  });
  mocks.update.mockReturnValue({ eq: mocks.updateEq });
  mocks.updateEq.mockResolvedValue({ error: null });
  mocks.remove.mockResolvedValue({ error: null });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

const CAMINHO_FOTO = "perfis/0f8b7c2e-1111-2222-3333-444444444444.jpg";

// ---------------------------------------------------------------------------
// listarPendentes
// ---------------------------------------------------------------------------

describe("listarPendentes", () => {
  function setup(result: Record<string, unknown>) {
    mocks.order.mockResolvedValue(result);
    mocks.eq.mockReturnValue({ order: mocks.order });
    mocks.select.mockReturnValue({ eq: mocks.eq });
    mocks.from.mockReturnValue({ select: mocks.select });
  }

  it("retorna apenas perfis pendentes com dados LGPD", async () => {
    const perfisMock = [
      {
        id_perfil: "d3000000-2222-3333-4444-555555555555",
        nome_perfil: "Diego Ferreira",
        curso_perfil: "Engenharia de Software",
        cargo_perfil: "Desenvolvedor Front-end",
        linkedin_perfil: "https://linkedin.com/in/diego-ferreira-teste",
        foto_perfil: "https://example.com/fotos/diego.jpg",
        tb_lgpd_perfil: { aceite_lgpd: true, aceite_imagem_lgpd: false },
      },
    ];
    setup({ data: perfisMock, error: null });

    const resultado = await listarPendentes();

    expect(resultado).toEqual(perfisMock);
    expect(mocks.eq).toHaveBeenCalledWith("status_perfil", "pendente");
  });

  it("retorna lista vazia quando não há pendentes", async () => {
    setup({ data: [], error: null });
    expect(await listarPendentes()).toEqual([]);
  });

  it("lança erro quando o banco falha", async () => {
    setup({ data: null, error: { message: "timeout" } });
    await expect(listarPendentes()).rejects.toThrow(
      "Não foi possível carregar os perfis pendentes."
    );
  });

  it("recusa chamada sem admin autenticado", async () => {
    mocks.getAdminId.mockRejectedValue(new Error("Acesso negado"));
    await expect(listarPendentes()).rejects.toThrow("Acesso negado");
  });

  it("acrescenta o link temporário (5 min) da foto do bucket", async () => {
    vi.stubEnv("STORAGE_bucketFotos", "fotos-perfil");
    setup({
      data: [{ id_perfil: "d3000000-2222-3333-4444-555555555555", foto_perfil: CAMINHO_FOTO }],
      error: null,
    });
    mocks.createSignedUrls.mockResolvedValue({
      data: [{ path: CAMINHO_FOTO, signedUrl: "https://exemplo.test/assinado.jpg" }],
    });

    const [perfil] = await listarPendentes();

    expect(mocks.createSignedUrls).toHaveBeenCalledWith([CAMINHO_FOTO], 300);
    expect(perfil.foto_url).toBe("https://exemplo.test/assinado.jpg");
  });
});

// ---------------------------------------------------------------------------
// aprovarPerfil
// ---------------------------------------------------------------------------

describe("aprovarPerfil", () => {
  const idPerfil = "d3000000-2222-3333-4444-555555555555";

  it("chama moderar_perfil com a sessão, sem chave secreta e sem id do admin", async () => {
    await expect(aprovarPerfil(idPerfil)).resolves.toBeUndefined();

    expect(mocks.rpc).toHaveBeenCalledWith("moderar_perfil", {
      p_id_perfil: idPerfil,
      p_novo_status: "aprovado",
      p_motivo: null,
    });
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.getAdminId).not.toHaveBeenCalled();
  });

  it("mostra a mensagem do banco quando falta o aceite da LGPD", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: {
        code: "P0001",
        message: "Este perfil não pode ser aprovado: falta o aceite da LGPD.",
      },
    });

    await expect(aprovarPerfil(idPerfil)).rejects.toThrow(
      "Este perfil não pode ser aprovado: falta o aceite da LGPD."
    );
  });

  it("mostra a mensagem do banco quando o perfil não está pendente", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { code: "P0001", message: "Este perfil não está pendente ou não existe." },
    });

    await expect(aprovarPerfil(idPerfil)).rejects.toThrow(
      "Este perfil não está pendente ou não existe."
    );
  });

  it("troca erro desconhecido pela mensagem genérica e loga só o código", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { code: "XX000", message: "detalhe interno do banco" },
    });

    await expect(aprovarPerfil(idPerfil)).rejects.toThrow(
      "Não foi possível aprovar o perfil."
    );
    expect(log).toHaveBeenCalledWith("Falha ao moderar perfil:", "XX000");
    log.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// rejeitarPerfil
// ---------------------------------------------------------------------------

describe("rejeitarPerfil", () => {
  const idPerfil = "d3000000-2222-3333-4444-555555555555";
  const motivo = "Informações do cargo não atendem às diretrizes do projeto.";

  it("chama moderar_perfil com o motivo sem espaços nas pontas", async () => {
    await expect(rejeitarPerfil(idPerfil, `  ${motivo}  `)).resolves.toBeUndefined();

    expect(mocks.rpc).toHaveBeenCalledWith("moderar_perfil", {
      p_id_perfil: idPerfil,
      p_novo_status: "rejeitado",
      p_motivo: motivo,
    });
    // A moderação usa a sessão (rpc). A chave secreta só entra depois, para a foto.
    expect(mocks.rpc.mock.invocationCallOrder[0])
      .toBeLessThan(mocks.from.mock.invocationCallOrder[0]);
  });

  it("recusa rejeição sem motivo, sem chamar o banco", async () => {
    await expect(rejeitarPerfil(idPerfil, "")).rejects.toThrow(
      "O motivo é obrigatório para esta ação."
    );
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("recusa rejeição com motivo só de espaços", async () => {
    await expect(rejeitarPerfil(idPerfil, "   ")).rejects.toThrow(
      "O motivo é obrigatório para esta ação."
    );
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("mostra a mensagem do banco quando o admin está desativado", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: {
        code: "P0001",
        message: "Acesso negado: administrador inativo ou não autenticado.",
      },
    });

    await expect(rejeitarPerfil(idPerfil, motivo)).rejects.toThrow(
      "Acesso negado: administrador inativo ou não autenticado."
    );
  });

  it("troca erro desconhecido pela mensagem genérica", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { code: "42501", message: "permission denied for function moderar_perfil" },
    });

    await expect(rejeitarPerfil(idPerfil, motivo)).rejects.toThrow(
      "Não foi possível rejeitar o perfil."
    );
  });
});

// ---------------------------------------------------------------------------
// suspenderPerfil
// ---------------------------------------------------------------------------

describe("suspenderPerfil", () => {
  const idPerfil = "d3000000-2222-3333-4444-555555555555";
  const motivo = "Perfil com informações desatualizadas.";

  it("chama moderar_perfil com status suspenso e o motivo sem espaços nas pontas", async () => {
    await expect(suspenderPerfil(idPerfil, `  ${motivo}  `)).resolves.toBeUndefined();

    expect(mocks.rpc).toHaveBeenCalledWith("moderar_perfil", {
      p_id_perfil: idPerfil,
      p_novo_status: "suspenso",
      p_motivo: motivo,
    });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("recusa suspensão sem motivo, sem chamar o banco", async () => {
    await expect(suspenderPerfil(idPerfil, "")).rejects.toThrow(
      "O motivo é obrigatório para esta ação."
    );
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("recusa suspensão com motivo só de espaços", async () => {
    await expect(suspenderPerfil(idPerfil, "   ")).rejects.toThrow(
      "O motivo é obrigatório para esta ação."
    );
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("mostra a mensagem do banco quando o perfil já foi removido", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: {
        code: "P0001",
        message: "Este perfil já foi removido e não pode ser moderado.",
      },
    });

    await expect(suspenderPerfil(idPerfil, motivo)).rejects.toThrow(
      "Este perfil já foi removido e não pode ser moderado."
    );
  });

  it("troca erro desconhecido pela mensagem genérica", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { code: "XX000", message: "detalhe interno do banco" },
    });

    await expect(suspenderPerfil(idPerfil, motivo)).rejects.toThrow(
      "Não foi possível suspender o perfil."
    );
  });
});

// ---------------------------------------------------------------------------
// removerPerfil
// ---------------------------------------------------------------------------

describe("removerPerfil", () => {
  const idPerfil = "d3000000-2222-3333-4444-555555555555";
  const motivo = "Perfil com informações desatualizadas.";

  it("chama moderar_perfil com status removido e o motivo sem espaços nas pontas", async () => {
    await expect(removerPerfil(idPerfil, `  ${motivo}  `)).resolves.toBeUndefined();

    expect(mocks.rpc).toHaveBeenCalledWith("moderar_perfil", {
      p_id_perfil: idPerfil,
      p_novo_status: "removido",
      p_motivo: motivo,
    });
    // A moderação usa a sessão (rpc). A chave secreta só entra depois, para a foto.
    expect(mocks.rpc.mock.invocationCallOrder[0])
      .toBeLessThan(mocks.from.mock.invocationCallOrder[0]);
  });

  it("recusa remoção sem motivo, sem chamar o banco", async () => {
    await expect(removerPerfil(idPerfil, "")).rejects.toThrow(
      "O motivo é obrigatório para esta ação."
    );
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("recusa remoção com motivo só de espaços", async () => {
    await expect(removerPerfil(idPerfil, "   ")).rejects.toThrow(
      "O motivo é obrigatório para esta ação."
    );
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("mostra a mensagem do banco quando o perfil já foi removido", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: {
        code: "P0001",
        message: "Este perfil já foi removido e não pode ser moderado.",
      },
    });

    await expect(removerPerfil(idPerfil, motivo)).rejects.toThrow(
      "Este perfil já foi removido e não pode ser moderado."
    );
  });

  it("troca erro desconhecido pela mensagem genérica", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { code: "XX000", message: "detalhe interno do banco" },
    });

    await expect(removerPerfil(idPerfil, motivo)).rejects.toThrow(
      "Não foi possível remover o perfil."
    );
  });
});

// ---------------------------------------------------------------------------
// listarModerados
// ---------------------------------------------------------------------------

describe("listarModerados", () => {
  function setup(result: Record<string, unknown>) {
    mocks.order.mockResolvedValue(result);
    mocks.neq.mockReturnValue({ order: mocks.order });
    mocks.select.mockReturnValue({ neq: mocks.neq });
    mocks.from.mockReturnValue({ select: mocks.select });
  }

  it("retorna os perfis já moderados, sem pendentes, em ordem alfabética", async () => {
    const perfisMock = [
      {
        id_perfil: "d3000000-2222-3333-4444-555555555555",
        nome_perfil: "Diego Ferreira",
        curso_perfil: "Engenharia de Software",
        cargo_perfil: "Desenvolvedor Front-end",
        linkedin_perfil: null,
        foto_perfil: null,
        status_perfil: "suspenso",
        tb_lgpd_perfil: { aceite_lgpd: true, aceite_imagem_lgpd: false },
      },
    ];
    setup({ data: perfisMock, error: null });

    expect(await listarModerados()).toEqual(perfisMock);
    expect(mocks.neq).toHaveBeenCalledWith("status_perfil", "pendente");
    expect(mocks.order).toHaveBeenCalledWith("nome_perfil", { ascending: true });
  });

  it("lança erro quando o banco falha", async () => {
    setup({ data: null, error: { message: "timeout" } });
    await expect(listarModerados()).rejects.toThrow(
      "Não foi possível carregar os voluntários."
    );
  });

  it("recusa chamada sem admin autenticado", async () => {
    mocks.getAdminId.mockRejectedValue(new Error("Acesso negado"));
    await expect(listarModerados()).rejects.toThrow("Acesso negado");
    expect(mocks.from).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// reativarPerfil
// ---------------------------------------------------------------------------

describe("reativarPerfil", () => {
  const idPerfil = "d3000000-2222-3333-4444-555555555555";

  it("chama moderar_perfil com status aprovado e sem motivo", async () => {
    await expect(reativarPerfil(idPerfil)).resolves.toBeUndefined();

    expect(mocks.rpc).toHaveBeenCalledWith("moderar_perfil", {
      p_id_perfil: idPerfil,
      p_novo_status: "aprovado",
      p_motivo: null,
    });
  });

  it("envia o motivo sem espaços nas pontas quando informado", async () => {
    await reativarPerfil(idPerfil, "  Dados revisados  ");

    expect(mocks.rpc).toHaveBeenCalledWith("moderar_perfil", {
      p_id_perfil: idPerfil,
      p_novo_status: "aprovado",
      p_motivo: "Dados revisados",
    });
  });

  it("trata motivo só de espaços como sem motivo", async () => {
    await reativarPerfil(idPerfil, "   ");
    expect(mocks.rpc).toHaveBeenCalledWith("moderar_perfil", expect.objectContaining({ p_motivo: null }));
  });

  it("mostra a mensagem do banco quando falta o aceite da LGPD", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: {
        code: "P0001",
        message: "Este perfil não pode ser aprovado: falta o aceite da LGPD.",
      },
    });

    await expect(reativarPerfil(idPerfil)).rejects.toThrow(
      "Este perfil não pode ser aprovado: falta o aceite da LGPD."
    );
  });

  it("troca erro desconhecido pela mensagem genérica", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { code: "XX000", message: "detalhe interno do banco" },
    });

    await expect(reativarPerfil(idPerfil)).rejects.toThrow(
      "Não foi possível reativar o perfil."
    );
  });
});

// ---------------------------------------------------------------------------
// Descarte da foto (LGPD)
// ---------------------------------------------------------------------------

describe("descarte da foto", () => {
  const idPerfil = "d3000000-2222-3333-4444-555555555555";

  beforeEach(() => {
    vi.stubEnv("STORAGE_bucketFotos", "fotos-perfil");
    mocks.maybeSingle.mockResolvedValue({ data: { foto_perfil: CAMINHO_FOTO }, error: null });
  });

  it("apaga a foto e limpa o caminho ao rejeitar", async () => {
    await rejeitarPerfil(idPerfil, "Cargo não confere");

    expect(mocks.remove).toHaveBeenCalledWith([CAMINHO_FOTO]);
    expect(mocks.update).toHaveBeenCalledWith({ foto_perfil: null });
    expect(mocks.updateEq).toHaveBeenCalledWith("id_perfil", idPerfil);
  });

  it("apaga a foto e limpa o caminho ao remover", async () => {
    await removerPerfil(idPerfil, "Pedido do voluntário");

    expect(mocks.remove).toHaveBeenCalledWith([CAMINHO_FOTO]);
    expect(mocks.update).toHaveBeenCalledWith({ foto_perfil: null });
  });

  it("mantém a foto ao suspender, porque o perfil pode ser reativado", async () => {
    await suspenderPerfil(idPerfil, "Revisão do cargo");

    expect(mocks.remove).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("mantém o caminho no banco se o Storage falhar, sem desfazer a moderação", async () => {
    mocks.remove.mockResolvedValue({ error: { message: "indisponível" } });

    await expect(removerPerfil(idPerfil, "Pedido do voluntário")).resolves.toBeUndefined();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("não mexe na foto quando o banco recusa a moderação", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: "erro qualquer" } });

    await expect(rejeitarPerfil(idPerfil, "Cargo não confere")).rejects.toThrow();
    expect(mocks.remove).not.toHaveBeenCalled();
  });
});
