# Variáveis de Ambiente

Nenhum valor real deve ser registrado aqui ou no repositório.
Os valores são compartilhados pela gerente de projetos fora do Git (ex: cofre de senhas da equipe).

O padrão de nomenclatura segue o guia de versionamento: `PREFIXO_nomeEmCamelCase`.
Exceção: as variáveis públicas do Supabase usam o nome padrão do Supabase, em maiúsculas (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
Variáveis expostas ao navegador no Next.js recebem o prefixo `NEXT_PUBLIC_`.

| Variável | Finalidade | Onde é usada | Quem guarda o valor | Secreta? |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase | Navegador e servidor | Back-end de banco | Não |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública para consultas | Navegador e servidor | Back-end de banco | Não |
| `SUPABASE_serviceRoleKey` | Acesso administrativo ao banco e ao Storage | Apenas servidor | Back-end de banco | **Sim** |
| `STORAGE_bucketFotos` | Nome do bucket privado das fotos (`fotos-perfil`) | Apenas servidor | Back-end de banco | Não |

## Regras

- `SUPABASE_serviceRoleKey` **nunca** vai para o front-end nem recebe o prefixo `NEXT_PUBLIC_`.
- Em produção, as variáveis são configuradas no painel da hospedagem (ambiente Production), não em arquivo. Depois de mudar uma variável `NEXT_PUBLIC_`, é preciso publicar de novo: ela entra no código na hora do build.
- Qualquer nova variável deve ser adicionada aqui e no `.env.example` antes de ir para `develop`.

