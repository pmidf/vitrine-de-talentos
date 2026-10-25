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

Com o Docker e Supabase local disponíveis, execute `npx supabase start` e `npx supabase db reset` na raiz. O reset apaga os dados locais. O seed existente define `admin.vitoria@vitrine.com` / `senha123` (somente para testes locais). Verifique o funcionamento do seed de Auth com a SCRUM-110 antes de considerar o aceite integrado concluído.

## Validação

Na pasta `frontend`: `npm test`, `npm run lint`, `npx tsc --noEmit` e `npm run build`.

Os testes automatizados simulam o SDK para verificar sucesso, mensagem genérica, falha de conexão, tentativas repetidas, bloqueio de envio duplicado, saída e proteção de acesso. Não substituem o teste com Supabase real.

Validação da implementação: 41 testes aprovados, TypeScript e build de produção aprovados. Lint sem erros, com um aviso preexistente em `VoluntarioCard.tsx` sobre `<img>`. Tela conferida no navegador em 320 px e 1440 px, sem corte horizontal ou erros de JavaScript; acesso direto à administração sem configuração retorna ao login e a vitrine não contém link para `/login`. O aceite com administrador real permanece pendente da configuração do Supabase/SCRUM-110.

Para o aceite integrado:

1. Entre com o administrador local e confirme a chegada a `/admin/pendentes`.
2. Use senha errada: deve aparecer apenas “E-mail ou senha incorretos.”.
3. Limite a rede e confirme o botão “Entrando...” desativado durante a espera.
4. Desconecte a rede e confirme a mensagem de conexão e possibilidade de tentar novamente.
5. Clique em “Sair” e tente abrir `/admin/pendentes` diretamente: deve retornar ao login.
6. Teste com administrador inativo ou usuário sem registro em `tb_admin`: o acesso deve ser negado.
7. Verifique `/login` e o topo administrativo em 320 px e em desktop, inclusive com erro visível.
