# Vitrine de Talentos

**Vitrine de Talentos** é uma plataforma desenvolvida em Next.js e Supabase projetada para gerenciamento e exibição de talentos do PMI Student Club, contando com um painel administrativo completo e sincronização automática de usuários com o banco PostgreSQL.

---

## Tecnologias Utilizadas

- **Front-end:** Next.js (React / TypeScript), Tailwind CSS
- **Back-end & Banco de Dados:** Supabase (PostgreSQL)
- **Autenticação:** Supabase Auth
- **Ferramentas de Desenvolvimento:** Docker, Supabase CLI

---

## Pré-requisitos

Antes de iniciar, certifique-se de ter instalado em sua máquina:

- [Node.js](https://nodejs.org/) (versão 20.9 ou superior; recomendado: LTS mais recente)
- [Git](https://git-scm.com/)
- [Docker Desktop](https://www.docker.com/) (necessário para rodar o ambiente local do Supabase)

---

## Passo a Passo para Execução Local

### 1. Clonar o Repositório

```bash
git clone https://github.com/pmidf/vitrine-de-talentos.git
cd vitrine-de-talentos
git config core.hooksPath .github/hooks
```

O último comando ativa o validador de mensagens de commit (veja `docs/CONTRIBUICAO.md`).

---

### 2. Rodar o Front-end

O front-end fica na pasta `frontend/`. Todos os comandos abaixo são executados **dentro dela**:

```bash
cd frontend
npm install
npm run dev
```

Abra [http://localhost:3000/voluntarios](http://localhost:3000/voluntarios) no navegador.

Por enquanto, a galeria usa **dados fictícios** (`frontend/lib/mock-voluntarios.ts`), então o front roda sem configurar o banco.

Outros comandos úteis (também dentro de `frontend/`):

| Comando | O que faz |
|---|---|
| `npm test` | Roda os testes |
| `npm run lint` | Verifica o padrão do código |
| `npm run build` | Gera a versão de produção (bom para conferir antes do PR) |

---

### 3. Configurar as Variáveis de Ambiente (quando o front usar o banco)

Só será necessário quando a galeria passar a buscar os dados no Supabase. Crie o arquivo dentro de `frontend/`, a partir do exemplo:

```bash
cp supabase/.env.example frontend/.env.local
```

E preencha com as credenciais do seu ambiente (local ou nuvem):

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-local-ou-nuvem
```

*Nota: o `.env.local` está no `.gitignore` e jamais deve ser versionado.*

---

## Configuração do Banco de Dados (Supabase)
O projeto utiliza um fluxo de migrations automatizado do Supabase para manter o schema, as funções e as triggers sincronizados em todos os ambientes.

### 1. Ambiente Local (Desenvolvimento)
Para rodar o banco de dados PostgreSQL localmente via Docker:
1. Certifique-se de que o Docker está aberto na sua máquina.
2. Inicie o Supabase local:
   ```bash
   npx supabase start
   ```
Após a inicialização, o terminal exibirá os endpoints do banco e a URL do **Supabase Studio local** (`http://127.0.0.1:54323`).

3. Para resetar o banco local do zero e aplicar todas as migrations da pasta (`supabase/migrations`) em ordem cronológica e dados de teste (`supabase/seed.sql`):

   ```bash
   npx supabase db reset
   ```

4. Para a criação de novas migrations:

   ```bash
   npx supabase migration new nome_da_migration
   ```
Um novo arquivo com o padrão de nome `YYYYMMDDHHMMSS_nome_da_sua_alteracao.sql` será gerado automaticamente dentro da pasta `supabase/migrations/`. Insira o código SQL desejado nesse arquivo. Exemplos:
`20261016230132_criar_tabela_tb_admin`
`20261016230407_criar_triggers_tb_admin`

- Caso deseje desfazer a última migration, exclua o arquivo `.sql` correspondente da pasta `supabase/migrations/` e execute o comando de reset para alinhar o banco local ao estado das migrations restantes:
   ```bash
   npx supabase db reset
   ```
- Para ver o status do banco local, as urls do studio local e as portas do PostgreSQL:
   ```bash
   npx supabase status
   ```

### 2. Ambiente de Produção (Nuvem)
Após validar todas as novas alterações de schema (migrations) e triggers localmente, aplique as alterações no banco oficial do Supabase em produção:
1. Faça o login na CLI do Supabase (caso ainda não esteja logado):
   ```bash
   npx supabase login
   ```
2. Vincule o seu projeto local ao projeto da nuvem:
   ```bash
   npx supabase link --project-ref seu-project-ref-aqui
   ```
3. Envie e aplique as migrations pendentes para a nuvem:
   ```bash
   npx supabase db push
   ```
*Nota: Somente envie alterações quando o ambiente já tiver sido testado e documentado, assim como relatado para os demais desenvolvedores.*

## Estrutura de Arquivos da Infraestrutura

```text
vitrine-dos-saberes/
├── .env.example              # Exemplo de configuração de variáveis de ambiente
├── .env.local                # Variáveis locais (git-ignored)
├── supabase/
│   ├── config.toml           # Configurações do ecossistema Supabase
│   ├── seed.sql              # Dados fictícios para testes locais
│   └── migrations/           # Scripts DDL (tabelas, enums e triggers)
└── README.md
```
