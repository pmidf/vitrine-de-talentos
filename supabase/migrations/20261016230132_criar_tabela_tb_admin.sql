CREATE TABLE public.tb_admin (
    id_admin UUID PRIMARY KEY,
    nome_admin VARCHAR(100) NOT NULL,
    usuario_admin VARCHAR(80) NOT NULL UNIQUE,
    status_admin BOOLEAN NOT NULL DEFAULT true,
    data_criacao_admin TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_tb_admin_auth
    FOREIGN KEY (id_admin) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE
);