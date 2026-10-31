BEGIN;
SELECT plan(11);

SELECT set_config('role', 'anon', true);
SELECT results_eq(
    'SELECT nome_perfil::varchar FROM public.tb_perfil',
    ARRAY['Beatriz Alencar'::varchar],
    'Cenario 1: Visitante le tb_perfil sem filtro -> so Beatriz aparece'
);

SELECT is_empty(
    $$SELECT * FROM public.tb_perfil WHERE id_perfil = 'd3000000-2222-3333-4444-555555555555'$$,
    'Cenario 2: Visitante busca Diego pelo id -> nenhuma linha'
);

SELECT is_empty('SELECT * FROM public.tb_lgpd_perfil', 'Cenario 3a: tb_lgpd_perfil vazia para visitante');
SELECT is_empty('SELECT * FROM public.tb_log_perfil', 'Cenario 3b: tb_log_perfil vazia para visitante');
SELECT is_empty('SELECT * FROM public.tb_admin', 'Cenario 3c: tb_admin vazia para visitante');

SELECT lives_ok(
    $$SELECT public.enviar_perfil('Novo Voluntario'::varchar, 'Sistemas'::varchar, 'Dev'::varchar, 'url'::varchar, NULL::varchar, true, false)$$,
    'Cenario 4: Visitante chama enviar_perfil corretamente -> sucesso'
);

SELECT throws_ok(
    $$INSERT INTO public.tb_perfil (nome_perfil, curso_perfil, cargo_perfil) VALUES ('Invasor', 'Hacker', 'Hacker')$$,
    '42501',
    NULL,
    'Cenario 5: Visitante tenta inserir direto em tb_perfil -> erro de permissao'
);

SELECT throws_ok(
    $$SELECT public.enviar_perfil('Teste LGPD'::varchar, 'Sistemas'::varchar, 'Dev'::varchar, 'url'::varchar, NULL::varchar, false, false)$$,
    'P0001',
    'O consentimento dos termos da LGPD é obrigatório.',
    'Cenario 6: enviar_perfil com aceite_lgpd = false -> erro'
);

SELECT throws_ok(
    $$SELECT public.enviar_perfil('Teste Foto'::varchar, 'Sistemas'::varchar, 'Dev'::varchar, 'url'::varchar, 'foto.jpg'::varchar, true, false)$$,
    'P0001',
    'O consentimento de uso de imagem é obrigatório para enviar uma foto.',
    'Cenario 7: enviar_perfil com foto sem aceite de imagem -> erro'
);


SELECT throws_ok(
    $$UPDATE public.tb_perfil SET nome_perfil = 'Hackeado'
      WHERE id_perfil = 'c2000000-1111-2222-3333-444444444444'$$,
    '42501',
    NULL,
    'Cenario 8: Visitante tenta UPDATE em tb_perfil -> erro de permissao'
);

SELECT throws_ok(
    $$DELETE FROM public.tb_perfil
      WHERE id_perfil = 'c2000000-1111-2222-3333-444444444444'$$,
    '42501',
    NULL,
    'Cenario 9: Visitante tenta DELETE em tb_perfil -> erro de permissao'
);