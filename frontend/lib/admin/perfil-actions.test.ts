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
  eq3: vi.fn(),
  maybeSingle: vi.fn(),
  selectFinal: vi.fn(),
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

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getAdminId.mockResolvedValue("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");
});

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
});

// ---------------------------------------------------------------------------
// aprovarPerfil
// ---------------------------------------------------------------------------

describe("aprovarPerfil", () => {
  const idPerfil = "d3000000-2222-3333-4444-555555555555";

  /**
   * aprovarPerfil faz três chamadas ao banco em sequência:
   * 1. from("tb_lgpd_perfil").select(...).eq(...).maybeSingle()
   * 2. from("tb_perfil").update(...).eq(...).eq(...).select()
   * 3. from("tb_log_perfil").insert(...)
   *
   * O mocks.from precisa retornar objetos diferentes a cada chamada.
   */
  function setup({
    lgpdResult = { data: { aceite_lgpd: true }, error: null },
    updateResult = { data: [{ id_perfil: idPerfil }], error: null },
    insertResult = { error: null },
  }: {
    lgpdResult?: Record<string, unknown>;
    updateResult?: Record<string, unknown>;
    insertResult?: Record<string, unknown>;
  } = {}) {
    // Cadeia 1: select LGPD → .select().eq().maybeSingle()
    mocks.maybeSingle.mockResolvedValue(lgpdResult);
    const eqLgpd = vi.fn().mockReturnValue({ maybeSingle: mocks.maybeSingle });
    const selectLgpd = vi.fn().mockReturnValue({ eq: eqLgpd });
    const fromLgpd = { select: selectLgpd };

    // Cadeia 2: update perfil → .update().eq().eq().select()
    mocks.selectFinal.mockResolvedValue(updateResult);
    const eq2Update = vi.fn().mockReturnValue({ select: mocks.selectFinal });
    const eq1Update = vi.fn().mockReturnValue({ eq: eq2Update });
    const updateFn = vi.fn().mockReturnValue({ eq: eq1Update });
    const fromUpdate = { update: updateFn };

    // Cadeia 3: insert log → .insert()
    mocks.insert.mockResolvedValue(insertResult);
    const fromInsert = { insert: mocks.insert };

    mocks.from
      .mockReturnValueOnce(fromLgpd)
      .mockReturnValueOnce(fromUpdate)
      .mockReturnValueOnce(fromInsert);
  }

  it("aprova perfil pendente com aceite LGPD e grava log", async () => {
    setup();

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
    setup({ lgpdResult: { data: { aceite_lgpd: false }, error: null } });

    await expect(aprovarPerfil(idPerfil)).rejects.toThrow(
      "consentimento LGPD não registrado"
    );
  });

  it("recusa aprovação sem LGPD registrada", async () => {
    setup({ lgpdResult: { data: null, error: null } });

    await expect(aprovarPerfil(idPerfil)).rejects.toThrow(
      "consentimento LGPD não registrado"
    );
  });

  it("recusa aprovação quando perfil não está pendente ou não existe", async () => {
    setup({ updateResult: { data: [], error: null } });

    await expect(aprovarPerfil(idPerfil)).rejects.toThrow(
      "não está pendente ou não existe"
    );
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("lança erro quando banco falha na verificação LGPD", async () => {
    setup({ lgpdResult: { data: null, error: { message: "timeout" } } });

    await expect(aprovarPerfil(idPerfil)).rejects.toThrow(
      "Não foi possível verificar o consentimento LGPD."
    );
  });

  it("lança erro quando banco falha no update", async () => {
    setup({ updateResult: { data: null, error: { message: "timeout" } } });

    await expect(aprovarPerfil(idPerfil)).rejects.toThrow(
      "Não foi possível aprovar o perfil."
    );
  });

  it("lança erro quando log não pode ser gravado", async () => {
    setup({ insertResult: { error: { message: "timeout" } } });

    await expect(aprovarPerfil(idPerfil)).rejects.toThrow(
      "log não pôde ser gravado"
    );
  });

  it("recusa chamada sem admin autenticado", async () => {
    mocks.getAdminId.mockRejectedValue(new Error("Acesso negado"));

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

  /**
   * rejeitarPerfil faz duas chamadas ao banco:
   * 1. from("tb_perfil").update(...).eq(...).eq(...).select()
   * 2. from("tb_log_perfil").insert(...)
   */
  function setup({
    updateResult = { data: [{ id_perfil: idPerfil }], error: null },
    insertResult = { error: null },
  }: {
    updateResult?: Record<string, unknown>;
    insertResult?: Record<string, unknown>;
  } = {}) {
    // Cadeia 1: update perfil
    mocks.selectFinal.mockResolvedValue(updateResult);
    const eq2Update = vi.fn().mockReturnValue({ select: mocks.selectFinal });
    const eq1Update = vi.fn().mockReturnValue({ eq: eq2Update });
    const updateFn = vi.fn().mockReturnValue({ eq: eq1Update });
    const fromUpdate = { update: updateFn };

    // Cadeia 2: insert log
    mocks.insert.mockResolvedValue(insertResult);
    const fromInsert = { insert: mocks.insert };

    mocks.from
      .mockReturnValueOnce(fromUpdate)
      .mockReturnValueOnce(fromInsert);
  }

  it("rejeita perfil pendente com motivo e grava log", async () => {
    setup();

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
    setup({ updateResult: { data: [], error: null } });

    await expect(rejeitarPerfil(idPerfil, motivo)).rejects.toThrow(
      "não está pendente ou não existe"
    );
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("lança erro quando banco falha no update", async () => {
    setup({ updateResult: { data: null, error: { message: "timeout" } } });

    await expect(rejeitarPerfil(idPerfil, motivo)).rejects.toThrow(
      "Não foi possível rejeitar o perfil."
    );
  });

  it("lança erro quando log não pode ser gravado", async () => {
    setup({ insertResult: { error: { message: "timeout" } } });

    await expect(rejeitarPerfil(idPerfil, motivo)).rejects.toThrow(
      "log não pôde ser gravado"
    );
  });

  it("recusa chamada sem admin autenticado", async () => {
    mocks.getAdminId.mockRejectedValue(new Error("Acesso negado"));

    await expect(rejeitarPerfil(idPerfil, motivo)).rejects.toThrow(
      "Acesso negado"
    );
    expect(mocks.from).not.toHaveBeenCalled();
  });
});