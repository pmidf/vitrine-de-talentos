-- SCRUM-143: estende moderar_perfil para aceitar 'suspenso' e 'removido'.
-- Regras:
--   suspender: aceita qualquer status exceto 'removido'; motivo obrigatório.
--   remover:   aceita qualquer status exceto 'removido'; motivo obrigatório.
--   aprovar:   só de 'pendente'; exige aceite LGPD (inalterado).
--   rejeitar:  só de 'pendente'; motivo obrigatório (inalterado).

CREATE OR REPLACE FUNCTION public.moderar_perfil(
    p_id_perfil  UUID,
    p_novo_status VARCHAR,
    p_motivo      TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_id_admin        UUID := auth.uid();
    v_status_anterior public.status_perfil_enum;
BEGIN
    -- Regra 1: só admin ativo pode moderar
    IF NOT EXISTS (
        SELECT 1 FROM public.tb_admin
         WHERE id_admin = v_id_admin AND status_admin = true
    ) THEN
        RAISE EXCEPTION 'Acesso negado: administrador inativo ou não autenticado.';
    END IF;

    -- Regra 2: status de destino deve ser válido
    IF p_novo_status IS NULL
       OR p_novo_status NOT IN ('aprovado', 'rejeitado', 'suspenso', 'removido')
    THEN
        RAISE EXCEPTION 'Ação de moderação inválida.';
    END IF;

    -- Regra 3: motivo obrigatório para rejeitar, suspender e remover
    IF p_novo_status IN ('rejeitado', 'suspenso', 'removido')
       AND coalesce(trim(p_motivo), '') = ''
    THEN
        RAISE EXCEPTION 'O motivo é obrigatório para esta ação.';
    END IF;

    -- Lê o status atual e trava o perfil até o fim da transação
    SELECT status_perfil INTO v_status_anterior
      FROM public.tb_perfil
     WHERE id_perfil = p_id_perfil
       FOR UPDATE;

    IF v_status_anterior IS NULL THEN
        RAISE EXCEPTION 'Perfil não encontrado.';
    END IF;

    -- Regra 4: perfil já removido não pode ser moderado
    IF v_status_anterior = 'removido' THEN
        RAISE EXCEPTION 'Este perfil já foi removido e não pode ser moderado.';
    END IF;

    -- Regra 5: aprovar e rejeitar só a partir de 'pendente'
    IF p_novo_status IN ('aprovado', 'rejeitado')
       AND v_status_anterior IS DISTINCT FROM 'pendente'
    THEN
        RAISE EXCEPTION 'Este perfil não está pendente ou não existe.';
    END IF;

    -- Regra 6: aprovar exige aceite da LGPD
    IF p_novo_status = 'aprovado' AND NOT EXISTS (
        SELECT 1 FROM public.tb_lgpd_perfil
         WHERE fk_id_perfil = p_id_perfil AND aceite_lgpd = true
    ) THEN
        RAISE EXCEPTION 'Este perfil não pode ser aprovado: falta o aceite da LGPD.';
    END IF;

    UPDATE public.tb_perfil
       SET status_perfil = p_novo_status::public.status_perfil_enum
     WHERE id_perfil = p_id_perfil;

    INSERT INTO public.tb_log_perfil (
        fk_id_perfil, fk_id_admin, acao_log, motivo_rejeicao_perfil, detalhes_log
    ) VALUES (
        p_id_perfil,
        v_id_admin,
        CASE p_novo_status
            WHEN 'aprovado'  THEN 'APROVACAO_PERFIL'
            WHEN 'rejeitado' THEN 'REJEICAO_PERFIL'
            WHEN 'suspenso'  THEN 'SUSPENSAO_PERFIL'
            WHEN 'removido'  THEN 'REMOCAO_PERFIL'
        END,
        CASE WHEN p_novo_status IN ('rejeitado', 'suspenso', 'removido')
             THEN trim(p_motivo)
        END,
        jsonb_build_object(
            'status_anterior', v_status_anterior,
            'status_novo',     p_novo_status
        )
    );
END;
$$;
