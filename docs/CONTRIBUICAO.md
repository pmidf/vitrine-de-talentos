# Guia de Contribuição

Resumo do Guia de Versionamento da Vitrine de Talentos. Em caso de dúvida, vale o guia completo.

## Antes do primeiro commit

Ative o validador de mensagens de commit (uma vez por clone):

```
git config core.hooksPath .github/hooks
```

## Branches

| Branch | Finalidade | Push direto |
|--------|-----------|-------------|
| `main` | Código aprovado e estável | ❌ Bloqueado |
| `develop` | Integração contínua do time (branch padrão) | ❌ Bloqueado |
| `dev/frontend` | Espelho do trabalho do front-end | ✅ Somente a responsável |
| `dev/backend-api` | Espelho das rotas e regras de negócio | ✅ Somente o responsável |
| `dev/backend-banco` | Espelho das migrations, RLS e banco | ✅ Somente a responsável |
| `feature/SCRUM-XXX-descricao` | Nova funcionalidade | ✅ Quem criou |
| `hotfix/SCRUM-XXX-descricao` | Correção urgente em produção | ✅ Quem criou |

- Todo trabalho novo começa em uma `feature/` criada a partir da `develop` atualizada.
- As `dev/*` são atualizadas com a feature **só depois** do PR aprovado na `develop`.
- Branches `feature/` e `hotfix/` são apagadas após o merge.

**Exemplo de nome de branch:**
```
feature/SCRUM-107-card-voluntario
hotfix/SCRUM-116-corrige-rls-perfil
```

## Commits

Formato: `SCRUM-XXX: verbo no presente + descrição` (máximo de 72 caracteres na primeira linha).

```
SCRUM-105: adiciona validação dos campos do perfil
SCRUM-107: corrige card sem foto
```

Commits fora do padrão são bloqueados pelo validador.

## Pull Requests

- Abra sempre para `develop`, nunca direto para `main`.
- Mínimo de **2 aprovações** antes do merge.
- Merge pelo botão **"Create a merge commit"** (único método permitido).
- Preencha o template: o que foi feito, link do card no Jira e checklist.
- PRs que alteram `/supabase/migrations` precisam da revisão do **back-end de banco**.
- O merge de `develop` para `main` é feito pela gerente de projetos, após validar o critério de aceite no Jira.

## Segredos

- **Nunca** commite valores reais de variáveis de ambiente.
- O `.env` está no `.gitignore`. Use apenas o `.env.example` no repositório.
- A `SUPABASE_SERVICE_ROLE_KEY` é secreta e **nunca** vai para o front-end.

## Revisores automáticos (CODEOWNERS)

Ao abrir um PR, o GitHub pede revisão automaticamente conforme as pastas alteradas:

| Área | Revisores |
|------|-----------|
| Qualquer arquivo | Gerente de projetos |
| `/supabase/migrations` | Back-end de banco + gerente |
| `/backend` | Back-end 2 + gerente |
| `/frontend` | Front-end + gerente |
