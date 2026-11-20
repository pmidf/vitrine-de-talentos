import { beforeEach, describe, expect, it, vi } from "vitest";
import { enviarPerfil } from "./actions";

const { rpc, upload, remove } = vi.hoisted(() => ({
  rpc: vi.fn(),
  upload: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: () => ({ rpc }) }));
vi.mock("@/lib/supabase/admin-client", () => ({
  createAdminClient: () => ({ storage: { from: () => ({ upload, remove }) } }),
}));

function cadastroValido() {
  const dados = new FormData();
  dados.set("nome_perfil", " Ana Silva ");
  dados.set("curso_perfil", "Engenharia");
  dados.set("cargo_perfil", "Voluntária");
  dados.set("aceite_lgpd", "on");
  dados.set("site_empresa", "");
  return dados;
}

describe("enviarPerfil", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("STORAGE_bucketFotos", "fotos-privadas");
    rpc.mockResolvedValue({ data: "perfil-id", error: null });
    upload.mockResolvedValue({ error: null });
    remove.mockResolvedValue({ error: null });
  });

  it("grava um perfil sem foto junto com os consentimentos", async () => {
    await expect(enviarPerfil(cadastroValido())).resolves.toEqual({ ok: true });
    expect(upload).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledWith("enviar_perfil", {
      p_nome_perfil: "Ana Silva",
      p_curso_perfil: "Engenharia",
      p_cargo_perfil: "Voluntária",
      p_linkedin_perfil: null,
      p_foto_perfil: null,
      p_aceite_lgpd: true,
      p_aceite_imagem_lgpd: false,
    });
  });

  it("devolve mensagens por campo para nome, LinkedIn e LGPD", async () => {
    const dados = cadastroValido();
    dados.set("nome_perfil", "");
    dados.set("linkedin_perfil", "link-invalido");
    dados.delete("aceite_lgpd");

    await expect(enviarPerfil(dados)).resolves.toEqual({
      ok: false,
      erros: {
        nome_perfil: "O nome deve ter pelo menos 2 caracteres.",
        linkedin_perfil: "Informe uma URL válida do LinkedIn.",
        aceite_lgpd: "Aceite o tratamento dos seus dados para enviar o perfil.",
      },
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("bloqueia o campo isca preenchido antes da gravação", async () => {
    const dados = cadastroValido();
    dados.set("site_empresa", "spammer");
    await expect(enviarPerfil(dados)).resolves.toMatchObject({ ok: false });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("exige autorização antes do upload e guarda o caminho da foto enviada", async () => {
    const dados = cadastroValido();
    dados.set("foto_perfil", new File(["jpeg"], "foto-perfil.jpg", { type: "image/jpeg" }));

    await expect(enviarPerfil(dados)).resolves.toMatchObject({
      ok: false,
      erros: { aceite_imagem: expect.any(String) },
    });
    expect(upload).not.toHaveBeenCalled();

    dados.set("aceite_imagem", "on");
    await expect(enviarPerfil(dados)).resolves.toEqual({ ok: true });
    const caminho = upload.mock.calls[0][0];
    expect(caminho).toMatch(/^perfis\/.*\.jpg$/);
    expect(rpc).toHaveBeenCalledWith("enviar_perfil", expect.objectContaining({
      p_foto_perfil: caminho,
      p_aceite_imagem_lgpd: true,
    }));
  });

  it("remove a foto quando o banco rejeita o cadastro", async () => {
    const dados = cadastroValido();
    dados.set("foto_perfil", new File(["jpeg"], "foto-perfil.jpg", { type: "image/jpeg" }));
    dados.set("aceite_imagem", "on");
    rpc.mockResolvedValue({ data: null, error: { code: "23514" } });

    await expect(enviarPerfil(dados)).resolves.toMatchObject({ ok: false });
    expect(remove).toHaveBeenCalledWith([upload.mock.calls[0][0]]);
  });
});
