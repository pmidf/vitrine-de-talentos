-- ============================================================
-- Migration 002 — Tabela: acesso_admin
-- Sprint: BKL-008
-- Descrição: Registra o histórico de acessos do administrador
--            (login, logout e falhas de login).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.acesso_admin (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  administrador_id  UUID        NOT NULL REFERENCES public.administrador(id) ON DELETE CASCADE,
  tipo              TEXT        NOT NULL CHECK (tipo IN ('login', 'logout', 'falha_login')),
  ocorrido_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.acesso_admin                    IS 'Histórico de acessos dos administradores.';
COMMENT ON COLUMN public.acesso_admin.tipo               IS 'Valores permitidos: login, logout, falha_login.';
COMMENT ON COLUMN public.acesso_admin.administrador_id   IS 'FK para administrador.';

-- ── Índice para consultas por administrador ─────────────────
CREATE INDEX IF NOT EXISTS idx_acesso_admin_administrador_id
  ON public.acesso_admin (administrador_id);

-- ── RLS ────────────────────────────────────────────────────
ALTER TABLE public.acesso_admin ENABLE ROW LEVEL SECURITY;

-- Administrador autenticado vê apenas seus próprios registros
CREATE POLICY "acesso_select_proprio"
  ON public.acesso_admin
  FOR SELECT
  USING (
    administrador_id = auth.uid()
  );

-- Inserção apenas via service_role (registrada pelo servidor, nunca pelo front)
CREATE POLICY "acesso_insert_service_role"
  ON public.acesso_admin
  FOR INSERT
  WITH CHECK (FALSE);
