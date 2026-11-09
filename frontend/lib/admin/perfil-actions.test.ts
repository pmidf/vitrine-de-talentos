import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  listarPendentes,
  aprovarPerfil,
  rejeitarPerfil,
} from "./perfil-actions";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  getAdminId: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  update: vi.fn(),
  insert: vi.fn(),
  eq: vi.fn(),
  eq2: vi.fn(),
  maybeSingle: vi.fn(),
  order: vi.fn(),
}));

vi.mock("../auth/require-admin", () => ({
  getAdminId: mocks.getAdminId,
}));

vi.mock("../supabase/admin-client", () => ({
  createAdminClient: () => ({
    from: mocks.from,
  }),
}));

// ---------------------------------------------------------------------------
// Setup padrão: admin logado com id fixo
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getAdminId.mockResolvedValue("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");
});

// ---------------------------------------------------------------------------
// Helpers tipados com unknown para flexibilidade nos testes
// ---------------------------------------------------------------------------

type AnyResult = Record<string, unknown>;

function mockListarPendentes(result: AnyResult) {
  mocks.order.mockResolvedValue(result);
  mocks.eq.mockReturnValue({ order: mocks.order });
  mocks.select.mockReturnValue({ eq: mocks.eq });
  mocks.from.mockReturnValue({ select: mocks.select });
}

function mockLgpd(result: AnyResult) {
  mocks.maybeSingle.mockResolvedValue(result);
  mocks.eq.mockReturnValue({ maybeSingle: mocks.maybeSingle });
  mocks.select.mockReturnValue({ eq: mocks.eq });
}

function mockUpdate(result: AnyResult) {
  mocks.eq2.mockResolvedValue(result);
  mocks.eq.mockReturnValue({ eq: mocks.eq2 });
  mocks.update.mockReturnValue({ eq: mocks.eq });
}

function mockInsert(result: AnyResult) {
  mocks.insert.mockResolvedValue(result);
}

function mockFromSequence(methods: string[]) {
  let callCount = 0;
  mocks.from.mockImplementation(() => {
    const method = methods[callCount++];
    if (method === "select") return { select: mocks.select };
    if (method === "update") return { update: mocks.update };
    if (method === "insert") return { insert: mocks.insert };
  });
}

// ---------------------------------------------------------------------------
// listarPendentes
// ---------------------------------------------------------------------------

describe("listarPendentes", () => {
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
    mockListarPendentes({ data: perfisMock, error: null });

    const resultado = await listarPendentes();

    expect(resultado).toEqual(perfisMock);
    expect(mocks.eq).toHaveBeenCalledWith("status_perfil", "pendente");
  });

  it("retorna lista vazia quando não há pendentes", async () => {
    mockListarPendentes({ data: [], error: null });

    const resultado = await listarPendentes();

    expect(resultado).toEqual([]);
  });

  it("lança erro quando o banco falha", async () => {
    mockListarPendentes({ data: null, error: { message: "timeout" } });

    await expect(listarPendentes()).rejects.toThrow(
      "Não foi possível carregar os perfis pendentes."
    );
  });

  it("recusa chamada sem admin autenticado", async () => {
    mocks.getAdminId.mockRejectedValue(
      new Error("Acesso negado: nenhum administrador autenticado.")
    );

    await expect(listarPendentes()).rejects.toThrow("Acesso negado");
  });
});

// ---------------------------------------------------------------------------
// aprovarPerfil
// ---------------------------------------------------------------------------

describe("aprovarPerfil", () => {
  const idPerfil = "d3000000-2222-3333-4444-555555555555";

  function setupAprovar(
    lgpd: AnyResult = { data: { aceite_lgpd: true }, error: null },
    update: AnyResult = { data: [{ id_perfil: idPerfil }], error: null },
    insert: AnyResult = { error: null }
  ) {
    mockFromSequence(["select", "update", "insert"]);
    mockLgpd(lgpd);
    mockUpdate(update);
    mockInsert(insert);
  }

  it("aprova perfil pendente com aceite LGPD e grava log", async () => {
    setupAprovar();

    await expect(aprovarPerfil(idPerfil)).resolves.toBeUndefined();
    expect(mocks.getAdminId).toHaveBeenCalled();
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        fk_id_perfil: idPerfil,
        fk_id_admin: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      })
    );
  });

  it("recusa aprovação sem aceite LGPD", async () => {
    setupAprovar({ data: { aceite_lgpd: false }, error: null });

    await expect(aprovarPerfil(idPerfil)).rejects.toThrow(
      "consentimento LGPD não registrado"
    );
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("recusa aprovação quando perfil não está pendente ou não existe", async () => {
    setupAprovar(
      { data: { aceite_lgpd: true }, error: null },
      { data: [], error: null }
    );

    await expect(aprovarPerfil(idPerfil)).rejects.toThrow(
      "não está pendente ou não existe"
    );
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("recusa aprovação sem LGPD registrada", async () => {
    setupAprovar({ data: null, error: null });

    await expect(aprovarPerfil(idPerfil)).rejects.toThrow(
      "consentimento LGPD não registrado"
    );
  });

  it("lança erro quando banco falha na verificação LGPD", async () => {
    setupAprovar({ data: null, error: { message: "timeout" } });

    await expect(aprovarPerfil(idPerfil)).rejects.toThrow(
      "Não foi possível verificar o consentimento LGPD."
    );
  });

  it("lança erro quando banco falha no update", async () => {
    setupAprovar(
      { data: { aceite_lgpd: true }, error: null },
      { data: null, error: { message: "timeout" } }
    );

    await expect(aprovarPerfil(idPerfil)).rejects.toThrow(
      "Não foi possível aprovar o perfil."
    );
  });

  it("lança erro quando log não pode ser gravado", async () => {
    setupAprovar(
      { data: { aceite_lgpd: true }, error: null },
      { data: [{ id_perfil: idPerfil }], error: null },
      { error: { message: "timeout" } }
    );

    await expect(aprovarPerfil(idPerfil)).rejects.toThrow(
      "log não pôde ser gravado"
    );
  });

  it("recusa chamada sem admin autenticado", async () => {
    mocks.getAdminId.mockRejectedValue(
      new Error("Acesso negado: nenhum administrador autenticado.")
    );

    await expect(aprovarPerfil(idPerfil)).rejects.toThrow("Acesso negado");
    expect(mocks.from).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// rejeitarPerfil
// ---------------------------------------------------------------------------

describe("rejeitarPerfil", () => {
  const idPerfil = "d3000000-2222-3333-4444-555555555555";
  const motivo = "Informações do cargo não atendem às diretrizes do projeto.";

  function setupRejeitar(
    update: AnyResult = { data: [{ id_perfil: idPerfil }], error: null },
    insert: AnyResult = { error: null }
  ) {
    mockFromSequence(["update", "insert"]);
    mockUpdate(update);
    mockInsert(insert);
  }

  it("rejeita perfil pendente com motivo e grava log", async () => {
    setupRejeitar();

    await expect(rejeitarPerfil(idPerfil, motivo)).resolves.toBeUndefined();
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        fk_id_perfil: idPerfil,
        fk_id_admin: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        motivo_rejeicao_perfil: motivo,
      })
    );
  });

  it("recusa rejeição sem motivo", async () => {
    await expect(rejeitarPerfil(idPerfil, "")).rejects.toThrow(
      "O motivo da rejeição é obrigatório."
    );
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("recusa rejeição com motivo só de espaços", async () => {
    await expect(rejeitarPerfil(idPerfil, "   ")).rejects.toThrow(
      "O motivo da rejeição é obrigatório."
    );
  });

  it("recusa rejeição quando perfil não está pendente ou não existe", async () => {
    setupRejeitar({ data: [], error: null });

    await expect(rejeitarPerfil(idPerfil, motivo)).rejects.toThrow(
      "não está pendente ou não existe"
    );
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("lança erro quando banco falha no update", async () => {
    setupRejeitar({ data: null, error: { message: "timeout" } });

    await expect(rejeitarPerfil(idPerfil, motivo)).rejects.toThrow(
      "Não foi possível rejeitar o perfil."
    );
  });

  it("lança erro quando log não pode ser gravado", async () => {
    setupRejeitar(
      { data: [{ id_perfil: idPerfil }], error: null },
      { error: { message: "timeout" } }
    );

    await expect(rejeitarPerfil(idPerfil, motivo)).rejects.toThrow(
      "log não pôde ser gravado"
    );
  });

  it("recusa chamada sem admin autenticado", async () => {
    mocks.getAdminId.mockRejectedValue(
      new Error("Acesso negado: nenhum administrador autenticado.")
    );

    await expect(rejeitarPerfil(idPerfil, motivo)).rejects.toThrow(
      "Acesso negado"
    );
    expect(mocks.from).not.toHaveBeenCalled();
  });
});