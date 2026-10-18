-- ============================================================
-- Migration 005 — Dados de teste
-- Sprint: BKL-008
-- Descrição: Insere 3 perfis para validar a Vitrine e o painel
--            do administrador. REMOVER antes de ir para produção.
-- ============================================================

-- Perfil 1: aprovado COM linkedin_url (card abre LinkedIn)
INSERT INTO public.perfil (
  nome, curso, cargo_student_club, linkedin_url,
  foto_path, email, status, versao_termo, consentimento_em
) VALUES (
  'Ana Silva',
  'Engenharia de Software',
  'Diretora de Projetos',
  'https://www.linkedin.com/in/ana-silva-teste',
  NULL,
  'ana.silva.teste@email.com',
  'aprovado',
  'v1.0',
  NOW()
);

-- Perfil 2: aprovado SEM linkedin_url (card NÃO abre LinkedIn)
INSERT INTO public.perfil (
  nome, curso, cargo_student_club, linkedin_url,
  foto_path, email, status, versao_termo, consentimento_em
) VALUES (
  'Carlos Souza',
  'Administração',
  'Coordenador de Eventos',
  NULL,
  NULL,
  'carlos.souza.teste@email.com',
  'aprovado',
  'v1.0',
  NOW()
);

-- Perfil 3: aguardando validação (NÃO deve aparecer na Vitrine)
INSERT INTO public.perfil (
  nome, curso, cargo_student_club, linkedin_url,
  foto_path, email, status, versao_termo, consentimento_em
) VALUES (
  'Mariana Costa',
  'Ciência da Computação',
  'Analista de Tecnologia',
  'https://www.linkedin.com/in/mariana-costa-teste',
  NULL,
  'mariana.costa.teste@email.com',
  'aguardando_validacao',
  'v1.0',
  NOW()
);
