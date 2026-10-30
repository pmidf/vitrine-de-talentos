CREATE POLICY "Leitura publica de perfis aprovados"
ON public.tb_perfil
FOR SELECT
TO anon, authenticated
USING (status_perfil = 'aprovado');