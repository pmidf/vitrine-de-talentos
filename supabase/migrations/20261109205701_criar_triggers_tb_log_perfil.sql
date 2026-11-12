CREATE OR REPLACE FUNCTION public.fn_update_status()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- CASO 1: Insercao de um novo perfil (criacao)
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.tb_log_perfil (
            fk_id_perfil, 
            acao_log, 
            detalhes_log
        )
        VALUES (
            NEW.id_perfil,
            'CRIACAO_PERFIL',
            jsonb_build_object(
                'status_inicial', NEW.status_perfil, 
                'mensagem', 'Perfil criado com sucesso'
            )
        );
        RETURN NEW;

    -- CASO 2: Atualizacao de um perfil existente (update)
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Verifica se o status realmente mudou para evitar logs desnecessarios
        IF (OLD.status_perfil IS DISTINCT FROM NEW.status_perfil) THEN
            INSERT INTO public.tb_log_perfil (
                fk_id_perfil, 
                acao_log, 
                detalhes_log
            )
            VALUES (
                NEW.id_perfil,
                'ALTERACAO_STATUS',
                jsonb_build_object(
                    'status_anterior', OLD.status_perfil,
                    'status_novo', NEW.status_perfil
                )
            );
        END IF;

        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;


-- Remove a trigger caso ela ja exista para evitar duplicidade ao rodar o reset
DROP TRIGGER IF EXISTS trg_auditoria_perfil ON public.tb_perfil;

-- cria o gatilho que dispara APOS um INSERT ou UPDATE na tabela de perfis
CREATE TRIGGER trg_auditoria_perfil
AFTER INSERT OR UPDATE ON public.tb_perfil
FOR EACH ROW
EXECUTE FUNCTION public.fn_update_status();