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

- [Node.js](https://nodejs.org/) (versão LTS recomendada)
- [Git](https://git-scm.com/)
- [Docker Desktop](https://www.docker.com/) (necessário para rodar o ambiente local do Supabase)

---

## Passo a Passo para Execução Local

### 1. Clonar o Repositório

```bash
git clone https://github.com/pmidf/vitrine-de-talentos.git
cd vitrine-dos-saberes
```

---

### 2. Instalar as Dependências

```bash
npm install
```

---

### 3. Configurar as Variáveis de Ambiente

Crie o arquivo `.env.local` na raiz do projeto com base no arquivo de exemplo `.env.example`:

```bash
cp .env.example .env.local
```

No seu arquivo `.env.local`, certifique-se de preencher com as credenciais do seu ambiente (local ou nuvem):

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-local-ou-nuvem
```

*Nota: O arquivo `.env.local` está listado no `.gitignore` e jamais deve ser versionado.*

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
