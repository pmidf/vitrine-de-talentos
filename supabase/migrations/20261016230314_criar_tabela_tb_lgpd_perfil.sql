CREATE TABLE public.tb_lgpd_perfil(
  id_lgpd UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fk_id_perfil UUID NOT NULL UNIQUE,
  aceite_lgpd BOOLEAN NOT NULL,
  aceite_imagem_lgpd BOOLEAN NOT NULL,
  data_consentimento TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT fk_lgpd_perfil_tb_perfil 
  FOREIGN KEY (fk_id_perfil)
  REFERENCES public.tb_perfil(id_perfil) 
  ON DELETE CASCADE
);