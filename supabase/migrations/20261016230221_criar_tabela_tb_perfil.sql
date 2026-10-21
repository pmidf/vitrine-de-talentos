CREATE TYPE status_perfil_enum AS ENUM(
  'pendente',
  'aprovado',
  'rejeitado',
  'suspenso',
  'removido'
);

CREATE TABLE public.tb_perfil(
  id_perfil UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_perfil VARCHAR(150) NOT NULL,
  curso_perfil VARCHAR(100) NOT NULL,
  cargo_perfil VARCHAR(100) NOT NULL,
  linkedin_perfil VARCHAR(255),
  foto_perfil VARCHAR(255),
  status_perfil status_perfil_enum NOT NULL DEFAULT 'pendente',
  data_criacao_perfil TIMESTAMPTZ NOT NULL DEFAULT now()
);