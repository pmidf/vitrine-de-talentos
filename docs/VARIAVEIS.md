# Variáveis de Ambiente

Nenhum valor real deve ser registrado aqui ou no repositório.
Os valores são compartilhados pela gerente de projetos fora do Git (ex: cofre de senhas da equipe).

O padrão de nomenclatura segue o guia de versionamento: `PREFIXO_nomeEmCamelCase`.
Variáveis expostas ao navegador no Next.js recebem o prefixo `NEXT_PUBLIC_` antes do prefixo de contexto.

| Variável | Finalidade | Onde é usada | Quem guarda o valor | Secreta? |
|---|---|---|---|---|
| `SUPABASE_url` | URL do projeto Supabase (servidor) | Apenas servidor | Back-end de banco | Não |
| `SUPABASE_anonKey` | Chave pública para queries (servidor) | Apenas servidor | Back-end de banco | Não |
| `SUPABASE_serviceRoleKey` | Acesso administrativo ao banco | Apenas servidor | Back-end de banco | **Sim** |
| `STORAGE_bucketFotos` | Nome do bucket de fotos no Storage | Apenas servidor | Back-end de banco | Não |
| `NEXT_PUBLIC_SUPABASE_url` | URL do Supabase (navegador) | Front-end | Back-end de banco | Não |
| `NEXT_PUBLIC_SUPABASE_anonKey` | Chave pública para queries (navegador) | Front-end | Back-end de banco | Não |

## Regras

- `SUPABASE_serviceRoleKey` **nunca** vai para o front-end nem recebe o prefixo `NEXT_PUBLIC_`.
- Em produção, as variáveis são configuradas no painel da hospedagem, não em arquivo.
- Qualquer nova variável deve ser adicionada aqui e no `.env.example` antes de ir para `develop`.
