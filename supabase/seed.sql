-- 1. Limpa todas as tabelas em cascata para evitar erro de chave duplicada ao resetar
TRUNCATE TABLE 
    public.tb_log_perfil, 
    public.tb_lgpd_perfil, 
    public.tb_perfil, 
    public.tb_admin, 
    auth.users 
CASCADE;

--------------------------------------------------------------------------------
-- 2. INSERÇÃO DE USUÁRIOS DE AUTENTICAÇÃO E ADMINISTRADORES (tb_admin)
--------------------------------------------------------------------------------

-- Admin 1 (Ativo)
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'admin.vitoria@vitrine.com',
    crypt('senha123', gen_salt('bf')),
    now(),
    '{"full_name": "Vitória Souza", "username": "vitoria_admin"}'::jsonb,
    now(), now()
);

--INSERT INTO public.tb_admin (id_admin, nome_admin, usuario_admin, status_admin)
--VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Vitória Souza', 'vitoria_admin', true);

                                                    
-- Admin 2 (Ativo)
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
VALUES (
    'b1ffcd88-8d1a-3de7-aa5c-5aa8ac279b22',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'admin.carlos@vitrine.com',
    crypt('senha123', gen_salt('bf')),
    now(),
    '{"full_name": "Carlos Lima", "username": "carlos_admin"}'::jsonb,
    now(), now()
);

--INSERT INTO public.tb_admin (id_admin, nome_admin, usuario_admin, status_admin)
--VALUES ('b1ffcd88-8d1a-3de7-aa5c-5aa8ac279b22', 'Carlos Lima', 'carlos_admin', true);

--------------------------------------------------------------------------------
-- 3. INSERÇÃO DE PERFIS (tb_perfil) E CONSENTIMENTOS LGPD (tb_lgpd_perfil)
--------------------------------------------------------------------------------

-- Perfil 1: Aprovado
INSERT INTO public.tb_perfil (
    id_perfil, 
    nome_perfil, 
    curso_perfil, 
    cargo_perfil, 
    linkedin_perfil, 
    foto_perfil, 
    status_perfil
) VALUES (
    'c2000000-1111-2222-3333-444444444444',
    'Beatriz Alencar',
    'Ciência de Dados e Machine Learning',
    'Cientista de Dados Junior',
    'https://linkedin.com/in/beatriz-alencar-teste',
    'https://example.com/fotos/beatriz.jpg',
    'aprovado'
);

INSERT INTO public.tb_lgpd_perfil (fk_id_perfil, aceite_lgpd, aceite_imagem_lgpd, data_consentimento)
VALUES ('c2000000-1111-2222-3333-444444444444', true, true, now());


-- Perfil 2: Pendente de Moderação
INSERT INTO public.tb_perfil (
    id_perfil, 
    nome_perfil, 
    curso_perfil, 
    cargo_perfil, 
    linkedin_perfil, 
    foto_perfil, 
    status_perfil
) VALUES (
    'd3000000-2222-3333-4444-555555555555',
    'Diego Ferreira',
    'Engenharia de Software',
    'Desenvolvedor Front-end',
    'https://linkedin.com/in/diego-ferreira-teste',
    'https://example.com/fotos/diego.jpg',
    'pendente'
);

INSERT INTO public.tb_lgpd_perfil (fk_id_perfil, aceite_lgpd, aceite_imagem_lgpd, data_consentimento)
VALUES ('d3000000-2222-3333-4444-555555555555', true, false, now());


-- Perfil 3: Rejeitado (Para validação dos logs)
INSERT INTO public.tb_perfil (
    id_perfil, 
    nome_perfil, 
    curso_perfil, 
    cargo_perfil, 
    linkedin_perfil, 
    foto_perfil, 
    status_perfil
) VALUES (
    'e4000000-3333-4444-5555-666666666666',
    'Perfil Teste Invalido',
    'Sistemas de Informação',
    'Estagiário',
    NULL,
    NULL,
    'rejeitado'
);

INSERT INTO public.tb_lgpd_perfil (fk_id_perfil, aceite_lgpd, aceite_imagem_lgpd, data_consentimento)
VALUES ('e4000000-3333-4444-5555-666666666666', true, true, now());

--------------------------------------------------------------------------------
-- 4. INSERÇÃO DE LOGS DE MODERAÇÃO (tb_log_perfil)
--------------------------------------------------------------------------------

-- Registro de rejeição do Perfil 3 moderado pelo Admin Carlos Lima
INSERT INTO public.tb_log_perfil (
    fk_id_perfil, 
    fk_id_admin, 
    data_atualizacao_perfil,
    motivo_rejeicao_perfil

) VALUES (
    'e4000000-3333-4444-5555-666666666666',
    'b1ffcd88-8d1a-3de7-aa5c-5aa8ac279b22', -- ID do admin Carlos Lima
    now(),
    'As informações do cargo e foto fornecidas não atendem às diretrizes de preenchimento do projeto.'
);