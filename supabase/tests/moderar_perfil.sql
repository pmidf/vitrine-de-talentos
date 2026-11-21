-- SCRUM-140 / SCRUM-143: testes da função moderar_perfil
-- Roda com: npx supabase test db
BEGIN;
SELECT plan(24);

-- Perfil de apoio sem consentimento LGPD (só para testar a regra do aceite).
-- O dono do banco grava direto: o visitante não consegue fazer isso.
INSERT INTO public.tb_perfil (id_perfil, nome_perfil, curso_perfil, cargo_perfil)
VALUES ('f5000000-4444-5555-6666-777777777777', 'Perfil Sem Aceite', 'Curso', 'Cargo');

--------------------------------------------------------------------------------
-- Quem NÃO pode moderar
--------------------------------------------------------------------------------

-- Visitante
SELECT set_config('role', 'anon', true);
SELECT throws_ok(
    $$SELECT public.moderar_perfil('d3000000-2222-3333-4444-555555555555', 'aprovado')$$,
    '42501',
    NULL,
    'Cenario 1: visitante (anon) chama moderar_perfil -> erro de permissao'
);
RESET ROLE;

-- Usuário logado que não é admin (id inventado)
SELECT set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-000000000099", "role": "authenticated"}', true);
SELECT set_config('role', 'authenticated', true);
SELECT throws_ok(
    $$SELECT public.moderar_perfil('d3000000-2222-3333-4444-555555555555', 'aprovado')$$,
    'P0001',
    'Acesso negado: administrador inativo ou não autenticado.',
    'Cenario 2: usuario logado que nao e admin -> recusado'
);
RESET ROLE;

-- Admin desativado (Carlos)
UPDATE public.tb_admin SET status_admin = false WHERE id_admin = 'b1ffcd88-8d1a-3de7-aa5c-5aa8ac279b22';
SELECT set_config('request.jwt.claims', '{"sub": "b1ffcd88-8d1a-3de7-aa5c-5aa8ac279b22", "role": "authenticated"}', true);
SELECT set_config('role', 'authenticated', true);
SELECT throws_ok(
    $$SELECT public.moderar_perfil('d3000000-2222-3333-4444-555555555555', 'aprovado')$$,
    'P0001',
    'Acesso negado: administrador inativo ou não autenticado.',
    'Cenario 3: admin desativado -> recusado'
);
RESET ROLE;

--------------------------------------------------------------------------------
-- Admin ativo (Vitória): regras de moderação
--------------------------------------------------------------------------------
SELECT set_config('request.jwt.claims', '{"sub": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", "role": "authenticated"}', true);
SELECT set_config('role', 'authenticated', true);

SELECT throws_ok(
    $$SELECT public.moderar_perfil('d3000000-2222-3333-4444-555555555555', 'rejeitado', '   ')$$,
    'P0001',
    'O motivo é obrigatório para esta ação.',
    'Cenario 4: rejeitar sem motivo -> recusado'
);

SELECT throws_ok(
    $$SELECT public.moderar_perfil('d3000000-2222-3333-4444-555555555555', 'pendente', 'motivo')$$,
    'P0001',
    'Ação de moderação inválida.',
    'Cenario 5: status fora de aprovar, rejeitar, suspender ou remover -> recusado'
);

SELECT throws_ok(
    $$SELECT public.moderar_perfil('e4000000-3333-4444-5555-666666666666', 'aprovado')$$,
    'P0001',
    'Este perfil não está pendente ou não existe.',
    'Cenario 6: aprovar perfil ja rejeitado -> recusado'
);

SELECT throws_ok(
    $$SELECT public.moderar_perfil('f5000000-4444-5555-6666-777777777777', 'aprovado')$$,
    'P0001',
    'Este perfil não pode ser aprovado: falta o aceite da LGPD.',
    'Cenario 7: aprovar perfil sem aceite da LGPD -> recusado'
);

SELECT lives_ok(
    $$SELECT public.moderar_perfil('d3000000-2222-3333-4444-555555555555', 'aprovado')$$,
    'Cenario 8: admin ativo aprova perfil pendente -> sucesso'
);

SELECT lives_ok(
    $$SELECT public.moderar_perfil('f5000000-4444-5555-6666-777777777777', 'rejeitado', '  Não é voluntário  ')$$,
    'Cenario 9: admin ativo rejeita perfil pendente com motivo -> sucesso'
);
RESET ROLE;

--------------------------------------------------------------------------------
-- O que ficou gravado (conferido como dono do banco)
--------------------------------------------------------------------------------
SELECT is(
    (SELECT status_perfil::text FROM public.tb_perfil WHERE id_perfil = 'd3000000-2222-3333-4444-555555555555'),
    'aprovado',
    'Cenario 10: status do perfil aprovado mudou para aprovado'
);

SELECT results_eq(
    $$SELECT acao_log::text, fk_id_admin FROM public.tb_log_perfil
       WHERE fk_id_perfil = 'd3000000-2222-3333-4444-555555555555' AND acao_log <> 'CRIACAO_PERFIL'$$,
    $$VALUES ('APROVACAO_PERFIL'::text, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid)$$,
    'Cenario 11: aprovacao gerou uma unica linha no historico, com o admin'
);

SELECT results_eq(
    $$SELECT acao_log::text, motivo_rejeicao_perfil FROM public.tb_log_perfil
       WHERE fk_id_perfil = 'f5000000-4444-5555-6666-777777777777' AND acao_log <> 'CRIACAO_PERFIL'$$,
    $$VALUES ('REJEICAO_PERFIL'::text, 'Não é voluntário'::text)$$,
    'Cenario 12: rejeicao gerou uma unica linha no historico, com o motivo'
);

SELECT is(
    (SELECT count(*)::int FROM public.tb_log_perfil
      WHERE fk_id_perfil = 'f5000000-4444-5555-6666-777777777777' AND acao_log = 'CRIACAO_PERFIL'),
    1,
    'Cenario 13: criacao do perfil continua gerando uma unica linha CRIACAO_PERFIL'
);

--------------------------------------------------------------------------------
-- SCRUM-143: suspender e remover (admin ativo, Vitória)
--------------------------------------------------------------------------------
SELECT set_config('request.jwt.claims', '{"sub": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", "role": "authenticated"}', true);
SELECT set_config('role', 'authenticated', true);

SELECT throws_ok(
    $$SELECT public.moderar_perfil('d3000000-2222-3333-4444-555555555555', 'suspenso', '   ')$$,
    'P0001',
    'O motivo é obrigatório para esta ação.',
    'Cenario 14: suspender sem motivo -> recusado'
);

SELECT throws_ok(
    $$SELECT public.moderar_perfil('d3000000-2222-3333-4444-555555555555', 'removido')$$,
    'P0001',
    'O motivo é obrigatório para esta ação.',
    'Cenario 15: remover sem motivo -> recusado'
);

SELECT throws_ok(
    $$SELECT public.moderar_perfil('00000000-0000-0000-0000-000000000000', 'suspenso', 'motivo')$$,
    'P0001',
    'Perfil não encontrado.',
    'Cenario 16: perfil inexistente -> recusado'
);

SELECT lives_ok(
    $$SELECT public.moderar_perfil('d3000000-2222-3333-4444-555555555555', 'suspenso', '  Dados desatualizados  ')$$,
    'Cenario 17: admin ativo suspende perfil aprovado com motivo -> sucesso'
);

SELECT throws_ok(
    $$SELECT public.moderar_perfil('d3000000-2222-3333-4444-555555555555', 'aprovado')$$,
    'P0001',
    'Este perfil não está pendente ou não existe.',
    'Cenario 18: aprovar perfil suspenso -> recusado (aprovar só de pendente)'
);

SELECT lives_ok(
    $$SELECT public.moderar_perfil('e4000000-3333-4444-5555-666666666666', 'removido', '  Pedido do voluntário  ')$$,
    'Cenario 19: admin ativo remove perfil rejeitado com motivo -> sucesso'
);

SELECT throws_ok(
    $$SELECT public.moderar_perfil('e4000000-3333-4444-5555-666666666666', 'suspenso', 'motivo')$$,
    'P0001',
    'Este perfil já foi removido e não pode ser moderado.',
    'Cenario 20: moderar perfil ja removido -> recusado'
);
RESET ROLE;

SELECT is(
    (SELECT status_perfil::text FROM public.tb_perfil WHERE id_perfil = 'd3000000-2222-3333-4444-555555555555'),
    'suspenso',
    'Cenario 21: status do perfil suspenso mudou para suspenso'
);

SELECT results_eq(
    $$SELECT acao_log::text, motivo_rejeicao_perfil, fk_id_admin FROM public.tb_log_perfil
       WHERE fk_id_perfil = 'd3000000-2222-3333-4444-555555555555' AND acao_log = 'SUSPENSAO_PERFIL'$$,
    $$VALUES ('SUSPENSAO_PERFIL'::text, 'Dados desatualizados'::text, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid)$$,
    'Cenario 22: suspensao gerou uma unica linha no historico, com motivo e admin'
);

SELECT is(
    (SELECT status_perfil::text FROM public.tb_perfil WHERE id_perfil = 'e4000000-3333-4444-5555-666666666666'),
    'removido',
    'Cenario 23: status do perfil removido mudou para removido'
);

SELECT results_eq(
    $$SELECT acao_log::text, motivo_rejeicao_perfil, detalhes_log->>'status_anterior' FROM public.tb_log_perfil
       WHERE fk_id_perfil = 'e4000000-3333-4444-5555-666666666666' AND acao_log = 'REMOCAO_PERFIL'$$,
    $$VALUES ('REMOCAO_PERFIL'::text, 'Pedido do voluntário'::text, 'rejeitado'::text)$$,
    'Cenario 24: remocao gerou uma unica linha no historico, com motivo e status anterior'
);

SELECT * FROM finish();
ROLLBACK;
