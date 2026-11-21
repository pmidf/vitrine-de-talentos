ALTER TABLE public.tb_log_perfil 
ALTER COLUMN motivo_rejeicao_perfil drop not null;

-- adiciona coluna contendo a acao geral daquele log, caso haja registros antes dessa 
-- alteracao, vira EVENTO_GERAL para nao deixar como NULL
ALTER TABLE public.tb_log_perfil 
ADD COLUMN IF NOT EXISTS acao_log VARCHAR(100) NOT NULL DEFAULT 'EVENTO_GERAL';

ALTER TABLE public.tb_log_perfil 
ADD COLUMN IF NOT EXISTS detalhes_log JSONB;
