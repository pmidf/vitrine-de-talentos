-- ============================================================
-- Migration 001 — Tabela: administrador
-- Sprint: BKL-008
-- Descrição: Armazena os administradores do sistema.
--            O id é o mesmo gerado pelo Supabase Auth.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.administrador (
  id            UUID        PRIMARY KEY,  -- mesmo id do Supabase Auth
  nome          TEXT        NOT NULL,
  email         TEXT        NOT NULL UNIQUE,  -- login; senha fica só no Supabase Auth
  ativo         BOOLEAN     NOT NULL DEFAULT TRUE,  -- false bloqueia o acesso
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ultimo_login_em TIMESTAMPTZ
);

COMMENT ON TABLE  public.administrador               IS 'Administradores do sistema. Autenticação via Supabase Auth.';
COMMENT ON COLUMN public.administrador.id            IS 'Mesmo UUID do Supabase Auth.';
COMMENT ON COLUMN public.administrador.ativo         IS 'FALSE bloqueia o acesso sem excluir o registro.';

-- ── RLS ────────────────────────────────────────────────────
ALTER TABLE public.administrador ENABLE ROW LEVEL SECURITY;

-- Somente o próprio administrador autenticado pode ver seu registro
CREATE POLICY "admin_select_proprio"
  ON public.administrador
  FOR SELECT
  USING (auth.uid() = id);

-- Somente service_role pode inserir (criação via painel ou script)
CREATE POLICY "admin_insert_service_role"
  ON public.administrador
  FOR INSERT
  WITH CHECK (FALSE);  -- bloqueado para anon e authenticated; service_role ignora RLS

-- Somente o próprio administrador pode atualizar seu registro
CREATE POLICY "admin_update_proprio"
  ON public.administrador
  FOR UPDATE
  USING (auth.uid() = id);
