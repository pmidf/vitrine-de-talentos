# Guia de Contribuição

## Branches

| Branch | Finalidade | Push direto |
|--------|-----------|-------------|
| `main` | Código aprovado e estável | ❌ Bloqueado |
| `develop` | Integração contínua do time | ❌ Bloqueado |
| `feature/BKL-XXX-descricao` | Nova funcionalidade | ✅ Somente nela |
| `hotfix/BKL-XXX-descricao` | Correção urgente em produção | ✅ Somente nela |

**Exemplo de nome de branch:**
```
feature/BKL-008-estrutura-inicial
feature/BKL-009-formulario-cadastro
hotfix/BKL-010-corrige-rls-perfil
```

## Commits

Use sempre a chave do Jira no início da mensagem:

```
BKL-008: cria estrutura inicial de pastas e arquivos base
BKL-009: adiciona formulário de cadastro com aceite LGPD
```

## Pull Requests

- Abra sempre para `develop`, nunca direto para `main`.
- Mínimo de **1 aprovação** antes do merge.
- PRs que alteram `/supabase/migrations` precisam da aprovação do **back-end de banco**.
- Descreva o que foi feito e qual item do Jira está sendo entregue.
- Não feche o PR sem o checklist de aceite da tarefa preenchido.

## Segredos

- **Nunca** commite valores reais de variáveis de ambiente.
- O `.env` está no `.gitignore`. Use apenas o `.env.example` no repositório.
- A `SUPABASE_SERVICE_ROLE_KEY` é secreta e **nunca** vai para o front-end.

## Responsáveis por área (CODEOWNERS)

| Área | Responsável |
|------|------------|
| `/supabase/migrations` | Back-end de banco |
| `/frontend` | Front-end |
| `/docs` | Gerente de projetos |
