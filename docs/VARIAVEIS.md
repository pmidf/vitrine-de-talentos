# Variáveis de Ambiente

Nenhum valor real deve ser registrado aqui ou no repositório.  
Os valores são compartilhados pela gerente de projetos fora do Git (ex: cofre de senhas da equipe).

| Variável | Finalidade | Onde é usada | Quem guarda o valor | Secreta? |
|----------|-----------|--------------|---------------------|----------|
| `SUPABASE_URL` | URL do projeto Supabase | Front e servidor | Back-end de banco | Não |
| `SUPABASE_ANON_KEY` | Chave pública para queries do front | Front | Back-end de banco | Não |
| `SUPABASE_SERVICE_ROLE_KEY` | Acesso administrativo ao banco | Apenas servidor | Back-end de banco | **Sim** |
| `STORAGE_BUCKET_FOTOS` | Nome do bucket de fotos no Storage | Servidor | Back-end de banco | Não |

## Regras

- `SUPABASE_SERVICE_ROLE_KEY` **nunca** vai para o front-end nem para variáveis públicas.
- Em produção, as variáveis são configuradas no painel da hospedagem, não em arquivo.
- Qualquer nova variável deve ser adicionada aqui e no `.env.example` antes de ir para `develop`.
