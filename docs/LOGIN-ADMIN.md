# Login administrativo — SCRUM-111

- Entrada direta: `/login`. A vitrine pública não oferece link para essa rota.
- Sucesso: `/admin/pendentes`. A rota está protegida, mas a lista será implementada na SCRUM-118.
- O servidor valida a sessão no Supabase Auth e exige `tb_admin.status_admin = true` para o mesmo `id_admin` do usuário autenticado.
- O proxy renova os cookies apenas nas rotas de login e administração. Respostas dessas rotas usam `Cache-Control: private, no-store`.
- “Sair” encerra a sessão do navegador atual e retorna ao login. Falhas permitem repetir a tentativa.
- A SCRUM-110 deve manter os clientes em `frontend/lib/supabase/` ou ajustar seus consumidores. Nenhuma credencial administrativa ou chave de serviço é usada no navegador.
- Antes de expor dados ou ações reais na SCRUM-118, a SCRUM-110 deve assegurar permissões/RLS de leitura do próprio administrador ativo e autorização das operações de moderação. A proteção de páginas não substitui a autorização do banco.

## Configuração local

Use Node.js 22.13 ou superior (clientes atuais do Supabase e ambiente de teste).

Crie `frontend/.env.local` com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` do ambiente de teste, conforme o README. Não versione esse arquivo. Sem configuração, o formulário permanece disponível e mostra uma mensagem de conexão ao enviar.

Com o Docker e Supabase local disponíveis, execute `npx supabase start` na raiz. Para recriar os dados, `npx supabase db reset` apaga o banco local. O seed existente define `admin.vitoria@vitrine.com` / `senha123` (somente para testes locais). No teste com Supabase CLI 2.122.0, os campos de tokens nulos inseridos pelo seed em `auth.users` causaram “Database error querying schema”. Foi necessário normalizar esses campos para strings vazias nos dois administradores fictícios, apenas no banco local. A correção permanente do seed deve ser alinhada com a SCRUM-110; resetar o banco recria esse problema.

## Validação

Na pasta `frontend`: `npm test`, `npm run lint`, `npx tsc --noEmit` e `npm run build`.

Os testes automatizados simulam o SDK para verificar sucesso, mensagem genérica, falha de conexão, tentativas repetidas, bloqueio de envio duplicado, saída e proteção de acesso. Não substituem o teste com Supabase real.

Validação da implementação: 41 testes aprovados, TypeScript e build de produção aprovados. Lint sem erros, com um aviso preexistente em `VoluntarioCard.tsx` sobre `<img>`. Tela conferida no navegador em 320 px e 1440 px, sem corte horizontal ou erros de JavaScript; acesso direto à administração sem configuração retorna ao login e a vitrine não contém link para `/login`.

Em 25/10/2026, com Supabase local e o ajuste de dados descrito acima, foram confirmados no navegador: login do administrador fictício, chegada a `/admin/pendentes`, mensagem genérica com senha errada, saída e redirecionamento ao login ao tentar reabrir a área protegida. O topo administrativo também foi verificado em 320 px sem corte horizontal. O formulário usa POST como proteção adicional caso seja enviado antes da hidratação do JavaScript. A configuração e autorização do ambiente compartilhado continuam dependendo da SCRUM-110.

Para o aceite integrado:

1. Entre com o administrador local e confirme a chegada a `/admin/pendentes`.
2. Use senha errada: deve aparecer apenas “E-mail ou senha incorretos.”.
3. Limite a rede e confirme o botão “Entrando...” desativado durante a espera.
4. Desconecte a rede e confirme a mensagem de conexão e possibilidade de tentar novamente.
5. Clique em “Sair” e tente abrir `/admin/pendentes` diretamente: deve retornar ao login.
6. Teste com administrador inativo ou usuário sem registro em `tb_admin`: o acesso deve ser negado.
7. Verifique `/login` e o topo administrativo em 320 px e em desktop, inclusive com erro visível.
