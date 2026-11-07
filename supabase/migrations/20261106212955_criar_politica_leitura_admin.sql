-- Permite que usuários autenticados leiam apenas a própria linha na tabela tb_admin
CREATE POLICY "Admin le a propria linha"
ON public.tb_admin
FOR SELECT
TO authenticated
USING (
  id_admin = (select auth.uid())
);