-- AUTOMAÇÃO DE ADMINISTRADORES (TRIGGERS DE SINCRONIZAÇÃO COM AUTH.USERS)

-- 1. FUNÇÃO DE INSERÇÃO AUTOMÁTICA (CREATE)
CREATE OR REPLACE FUNCTION public.handle_new_admin()
RETURNS TRIGGER 
SECURITY DEFINER 
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_email_prefix TEXT;
BEGIN
  v_email_prefix := split_part(NEW.email, '@', 1);

  INSERT INTO public.tb_admin (
    id_admin, 
    nome_admin, 
    usuario_admin, 
    status_admin
  )
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Administrador ' || v_email_prefix), 
    COALESCE(NEW.raw_user_meta_data->>'username', v_email_prefix),
    true
  );
  
  RETURN NEW;
END;
$$;

-- Trigger de Criação
CREATE OR REPLACE TRIGGER on_auth_user_created_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_admin();


-- 2. FUNÇÃO DE ATUALIZAÇÃO DE STATUS (UPDATE / BAN)
CREATE OR REPLACE FUNCTION public.handle_update_admin_status()
RETURNS TRIGGER 
SECURITY DEFINER 
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.banned_until IS NOT NULL AND NEW.banned_until > now() THEN
    UPDATE public.tb_admin
    SET status_admin = false
    WHERE id_admin = NEW.id;
    
  ELSIF (NEW.banned_until IS NULL OR NEW.banned_until <= now()) AND OLD.banned_until IS NOT NULL THEN
    UPDATE public.tb_admin
    SET status_admin = true
    WHERE id_admin = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger de Atualização
CREATE OR REPLACE TRIGGER on_auth_user_updated_admin_status
  AFTER UPDATE OF banned_until ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_update_admin_status();