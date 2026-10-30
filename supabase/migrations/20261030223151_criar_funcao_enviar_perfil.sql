CREATE OR REPLACE FUNCTION public.enviar_perfil(
    p_nome_perfil VARCHAR,
    p_curso_perfil VARCHAR,
    p_cargo_perfil VARCHAR,
    p_linkedin_perfil VARCHAR,
    p_foto_perfil VARCHAR,
    p_aceite_lgpd BOOLEAN,
    p_aceite_imagem_lgpd BOOLEAN
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_id_perfil UUID;
BEGIN
    -- Validação 1: O aceite geral da LGPD é obrigatório
    IF NOT p_aceite_lgpd THEN
        RAISE EXCEPTION 'O consentimento dos termos da LGPD é obrigatório.';
    END IF;

    -- Validação 2: Se tem foto, o aceite de imagem é obrigatório
    IF p_foto_perfil IS NOT NULL AND NOT p_aceite_imagem_lgpd THEN
        RAISE EXCEPTION 'O consentimento de uso de imagem é obrigatório para enviar uma foto.';
    END IF;

    -- Inserção na tabela de perfil (status assume o DEFAULT 'pendente', ID e data são gerados)
    -- Referenciamos public.tb_perfil explicitamente devido ao search_path vazio
    INSERT INTO public.tb_perfil (
        nome_perfil, curso_perfil, cargo_perfil, linkedin_perfil, foto_perfil
    ) VALUES (
        p_nome_perfil, p_curso_perfil, p_cargo_perfil, p_linkedin_perfil, p_foto_perfil
    ) RETURNING id_perfil INTO v_id_perfil;

    -- Inserção na tabela de consentimento LGPD
    INSERT INTO public.tb_lgpd_perfil (
        fk_id_perfil, aceite_lgpd, aceite_imagem_lgpd
    ) VALUES (
        v_id_perfil, p_aceite_lgpd, p_aceite_imagem_lgpd
    );

    -- Retorna o ID gerado para a aplicação frontend
    RETURN v_id_perfil;
END;
$$;

-- Revogar a execução pública (segurança)
REVOKE EXECUTE ON FUNCTION public.enviar_perfil FROM PUBLIC;

-- Conceder execução apenas para visitantes (anon) e logados (authenticated)
GRANT EXECUTE ON FUNCTION public.enviar_perfil TO anon, authenticated;