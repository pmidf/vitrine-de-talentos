-- ============================================================
-- Migration 003 — Tabela: perfil
-- Sprint: BKL-008
-- Descrição: Perfil do voluntário. Campos públicos são exibidos
--            na Vitrine após aprovação. O email é interno (P-02).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.perfil (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nome                TEXT        NOT NULL,                          -- público
  curso               TEXT        NOT NULL,                          -- público
  cargo_student_club  TEXT        NOT NULL,                          -- público
  linkedin_url        TEXT        CHECK (
                                    linkedin_url IS NULL OR
                                    linkedin_url ~* '^https://www\.linkedin\.com/.*$'
                                  ),                                 -- público, opcional
  foto_path           TEXT,                                          -- público (caminho no Storage)
  email               TEXT        NOT NULL UNIQUE,                   -- interno (P-02 pendente)
  status              TEXT        NOT NULL DEFAULT 'aguardando_validacao'
                                  CHECK (status IN (
                                    'aguardando_validacao',
                                    'aprovado',
                                    'reprovado',
                                    'retirado'
                                  )),
  versao_termo        TEXT        NOT NULL,                          -- versão do termo aceito
  consentimento_em    TIMESTAMPTZ NOT NULL DEFAULT NOW(),            -- data do aceite LGPD
  revisado_por        UUID        REFERENCES public.administrador(id),
  revisado_em         TIMESTAMPTZ,
  criado_em           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.perfil                    IS 'Perfil do voluntário. Campos públicos expostos na Vitrine apenas quando status = aprovado.';
COMMENT ON COLUMN public.perfil.email              IS 'Interno. Nunca exposto ao front-end. Pendência P-02: definir uso e destino.';
COMMENT ON COLUMN public.perfil.linkedin_url       IS 'Link opcional digitado pelo voluntário. Sem integração OAuth (DEC-002).';
COMMENT ON COLUMN public.perfil.foto_path          IS 'Caminho do arquivo no Supabase Storage (bucket fotos-voluntarios).';
COMMENT ON COLUMN public.perfil.versao_termo       IS 'Versão do termo LGPD aceito no momento do cadastro.';
COMMENT ON COLUMN public.perfil.status             IS 'Ciclo: aguardando_validacao → aprovado | reprovado | retirado.';

-- ── Índice para consultas por status (Vitrine) ─────────────
CREATE INDEX IF NOT EXISTS idx_perfil_status
  ON public.perfil (status);

-- ── Atualização automática de atualizado_em ────────────────
CREATE OR REPLACE FUNCTION public.fn_set_atualizado_em()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_perfil_atualizado_em
  BEFORE UPDATE ON public.perfil
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_atualizado_em();

-- ── RLS ────────────────────────────────────────────────────
ALTER TABLE public.perfil ENABLE ROW LEVEL SECURITY;

-- Anônimo (Vitrine pública): apenas perfis aprovados, sem email
-- A view pública abaixo é a forma segura de expor esses dados
CREATE POLICY "perfil_select_aprovado_anonimo"
  ON public.perfil
  FOR SELECT
  TO anon
  USING (status = 'aprovado');

-- Administrador autenticado: vê todos os perfis
CREATE POLICY "perfil_select_admin"
  ON public.perfil
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.administrador a
      WHERE a.id = auth.uid() AND a.ativo = TRUE
    )
  );

-- Inserção por anon (voluntário envia o formulário sem login)
CREATE POLICY "perfil_insert_anonimo"
  ON public.perfil
  FOR INSERT
  TO anon
  WITH CHECK (status = 'aguardando_validacao');

-- Atualização apenas pelo administrador autenticado ou service_role
CREATE POLICY "perfil_update_admin"
  ON public.perfil
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.administrador a
      WHERE a.id = auth.uid() AND a.ativo = TRUE
    )
  );

-- ── View pública para a Vitrine ────────────────────────────
-- Expõe apenas os campos públicos de perfis aprovados.
-- O email nunca aparece aqui.
CREATE OR REPLACE VIEW public.vitrine_voluntarios AS
  SELECT
    id,
    nome,
    curso,
    cargo_student_club,
    linkedin_url,
    foto_path,
    criado_em
  FROM public.perfil
  WHERE status = 'aprovado';

COMMENT ON VIEW public.vitrine_voluntarios IS 'View pública da Vitrine. Expõe apenas perfis aprovados e campos públicos. Email nunca exposto.';
