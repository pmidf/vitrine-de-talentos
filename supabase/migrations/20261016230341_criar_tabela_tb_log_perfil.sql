CREATE TABLE public.tb_log_perfil (
    id_log UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fk_id_perfil UUID NOT NULL,
    fk_id_admin UUID,
    data_atualizacao_perfil TIMESTAMPTZ NOT NULL DEFAULT now(),
    motivo_rejeicao_perfil TEXT NOT NULL,
    
    CONSTRAINT fk_tb_log_perfil_perfil 
        FOREIGN KEY (fk_id_perfil) 
        REFERENCES public.tb_perfil(id_perfil) 
        ON DELETE CASCADE,
        
    CONSTRAINT fk_tb_log_perfil_admin 
        FOREIGN KEY (fk_id_admin) 
        REFERENCES public.tb_admin(id_admin) 
        ON DELETE SET NULL
);