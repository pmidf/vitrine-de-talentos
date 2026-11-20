-- SCRUM-140: a moderação muda o status e grava o histórico juntos,
-- com o admin identificado pela sessão (auth.uid()).

--------------------------------------------------------------------------------
-- 1. A trigger passa a registrar só a criação do perfil.
--    A mudança de status agora é registrada pela função moderar_perfil,
--    que sabe quem fez e por quê.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_update_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.tb_log_perfil (fk_id_perfil, acao_log, detalhes_log)
    VALUES (
        NEW.id_perfil,
        'CRIACAO_PERFIL',
        jsonb_build_object(
            'status_inicial', NEW.status_perfil,
            'mensagem', 'Perfil criado com sucesso'
        )
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auditoria_perfil ON public.tb_perfil;

CREATE TRIGGER trg_auditoria_perfil
AFTER INSERT ON public.tb_perfil
FOR EACH ROW
EXECUTE FUNCTION public.fn_update_status();

--------------------------------------------------------------------------------
-- 2. Função de moderação: confere o admin e as regras, muda o status
--    e grava uma linha completa no histórico, tudo na mesma transação.
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.moderar_perfil(
    p_id_perfil UUID,
    p_novo_status VARCHAR,       -- 'aprovado' ou 'rejeitado' (suspender e retirar: SCRUM-120)
    p_motivo TEXT DEFAULT NULL   -- obrigatório ao rejeitar
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_id_admin UUID := auth.uid();  -- quem está logado: vem da sessão, o código não informa
    v_status_anterior public.status_perfil_enum;
BEGIN
    -- Regra 1: só admin ativo pode moderar
    IF NOT EXISTS (
        SELECT 1 FROM public.tb_admin
         WHERE id_admin = v_id_admin AND status_admin = true
    ) THEN
        RAISE EXCEPTION 'Acesso negado: administrador inativo ou não autenticado.';
    END IF;

    -- Regra 2: nesta versão, só aprovar ou rejeitar
    IF p_novo_status IS NULL OR p_novo_status NOT IN ('aprovado', 'rejeitado') THEN
        RAISE EXCEPTION 'Ação de moderação inválida.';
    END IF;

    -- Regra 3: rejeitar exige motivo
    IF p_novo_status = 'rejeitado' AND coalesce(trim(p_motivo), '') = '' THEN
        RAISE EXCEPTION 'O motivo da rejeição é obrigatório.';
    END IF;

    -- Lê o status atual e trava o perfil até o fim da transação
    -- (evita dois admins moderando o mesmo perfil ao mesmo tempo)
    SELECT status_perfil INTO v_status_anterior
      FROM public.tb_perfil
     WHERE id_perfil = p_id_perfil
       FOR UPDATE;

    -- Regra 4: só perfil pendente pode ser aprovado ou rejeitado
    IF v_status_anterior IS DISTINCT FROM 'pendente' THEN
        RAISE EXCEPTION 'Este perfil não está pendente ou não existe.';
    END IF;

    -- Regra 5: aprovar exige o aceite da LGPD
    IF p_novo_status = 'aprovado' AND NOT EXISTS (
        SELECT 1 FROM public.tb_lgpd_perfil
         WHERE fk_id_perfil = p_id_perfil AND aceite_lgpd = true
    ) THEN
        RAISE EXCEPTION 'Este perfil não pode ser aprovado: falta o aceite da LGPD.';
    END IF;

    UPDATE public.tb_perfil
       SET status_perfil = p_novo_status::public.status_perfil_enum
     WHERE id_perfil = p_id_perfil;

    -- Uma linha só, completa: tipo da ação, admin, motivo e status anterior/novo
    INSERT INTO public.tb_log_perfil (
        fk_id_perfil, fk_id_admin, acao_log, motivo_rejeicao_perfil, detalhes_log
    ) VALUES (
        p_id_perfil,
        v_id_admin,
        CASE p_novo_status WHEN 'aprovado' THEN 'APROVACAO_PERFIL' ELSE 'REJEICAO_PERFIL' END,
        CASE WHEN p_novo_status = 'rejeitado' THEN trim(p_motivo) END,
        jsonb_build_object('status_anterior', v_status_anterior, 'status_novo', p_novo_status)
    );
END;
$$;

-- Visitante (anon) não pode chamar. Só usuário logado, e a função confere se é admin ativo.
REVOKE EXECUTE ON FUNCTION public.moderar_perfil(UUID, VARCHAR, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.moderar_perfil(UUID, VARCHAR, TEXT) TO authenticated;
