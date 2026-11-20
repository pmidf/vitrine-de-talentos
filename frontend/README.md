# Front-end da Vitrine de Talentos

Next.js 16 (App Router), TypeScript e Tailwind CSS 4.

Como rodar, testar e configurar: veja o [README principal](../README.md#2-rodar-o-front-end).
Regras de branch, commit e PR: veja [docs/CONTRIBUICAO.md](../docs/CONTRIBUICAO.md).

## Cadastro de voluntários

A galeria leva a `/cadastro`. O envio usa a função `enviar_perfil` do Supabase, que grava o perfil pendente e os consentimentos.

Para testar com foto, configure `STORAGE_bucketFotos` com o nome de um bucket **privado** e disponibilize `SUPABASE_serviceRoleKey` no servidor Next.js. A galeria gera URLs temporárias para as fotos dos perfis aprovados.

O texto dos consentimentos está provisório e precisa de aprovação antes da publicação do formulário.
