ALTER TABLE public.tb_perfil ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tb_lgpd_perfil ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tb_log_perfil ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tb_admin ENABLE ROW LEVEL SECURITY;


-- Revogar permissões de escrita/deleção (INSERT, UPDATE, DELETE) do role anon (não logados)
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.tb_perfil FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.tb_lgpd_perfil FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.tb_log_perfil FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.tb_admin FROM anon;

-- Revogar TRUNCATE (limpar tabela inteira) do role authenticated (logados)
REVOKE TRUNCATE ON public.tb_perfil FROM authenticated;
REVOKE TRUNCATE ON public.tb_lgpd_perfil FROM authenticated;
REVOKE TRUNCATE ON public.tb_log_perfil FROM authenticated;
REVOKE TRUNCATE ON public.tb_admin FROM authenticated;