-- ============================================================
-- Migration 004 — Tabela: historico_perfil
-- Sprint: BKL-008
-- Descrição: Registra cada ação feita sobre um perfil
--            (envio, aprovação, reprovação, edição, retirada).
--            administrador_id é nulo quando a ação é do voluntário.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.historico_perfil (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id         UUID        NOT NULL REFERENCES public.perfil(id) ON DELETE CASCADE,
  administrador_id  UUID        REFERENCES public.administrador(id), -- nulo quando ação é do voluntário
  acao              TEXT        NOT NULL CHECK (acao IN (
                                  'envio',
                                  'aprovacao',
                                  'reprovacao',
                                  'edicao',
                                  'retirada'
                                )),
  status_anterior   TEXT,
  status_novo       TEXT,
  observacao        TEXT,       -- ex: motivo da reprovação
  criado_em         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.historico_perfil                   IS 'Histórico de ações sobre perfis de voluntários.';
COMMENT ON COLUMN public.historico_perfil.administrador_id  IS 'Nulo quando a ação é do próprio voluntário (ex: envio).';
COMMENT ON COLUMN public.historico_perfil.acao              IS 'Valores: envio, aprovacao, reprovacao, edicao, retirada.';
COMMENT ON COLUMN public.historico_perfil.observacao        IS 'Campo livre. Usado principalmente para registrar o motivo da reprovação.';

-- ── Índices ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_historico_perfil_perfil_id
  ON public.historico_perfil (perfil_id);

CREATE INDEX IF NOT EXISTS idx_historico_perfil_administrador_id
  ON public.historico_perfil (administrador_id);

-- ── RLS ────────────────────────────────────────────────────
ALTER TABLE public.historico_perfil ENABLE ROW LEVEL SECURITY;

-- Administrador autenticado vê todo o histórico
CREATE POLICY "historico_select_admin"
  ON public.historico_perfil
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.administrador a
      WHERE a.id = auth.uid() AND a.ativo = TRUE
    )
  );

-- Inserção apenas via service_role (servidor registra as ações)
CREATE POLICY "historico_insert_service_role"
  ON public.historico_perfil
  FOR INSERT
  WITH CHECK (FALSE);

-- ── Trigger: registra histórico automaticamente ao mudar status ──
CREATE OR REPLACE FUNCTION public.fn_registrar_historico_perfil()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.historico_perfil (
      perfil_id,
      administrador_id,
      acao,
      status_anterior,
      status_novo
    ) VALUES (
      NEW.id,
      auth.uid(),  -- nulo se a mudança vier de anon/service_role sem contexto
      CASE NEW.status
        WHEN 'aprovado'   THEN 'aprovacao'
        WHEN 'reprovado'  THEN 'reprovacao'
        WHEN 'retirado'   THEN 'retirada'
        ELSE 'edicao'
      END,
      OLD.status,
      NEW.status
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_perfil_historico
  AFTER UPDATE ON public.perfil
  FOR EACH ROW EXECUTE FUNCTION public.fn_registrar_historico_perfil();
