# Kauê Ajure — portfólio e painel

Aplicação Next.js App Router para site público, administração de clientes, agenda, notas, catálogo, propostas e aceite público. A implantação usa Vercel e Supabase PostgreSQL/Storage.

## Instalação

1. Crie um projeto Supabase e copie as URLs de conexão em **Connect**. Use a conexão **Transaction pooler** (porta 6543) em `DATABASE_URL`. Para migrations, use a conexão direta ou **Session pooler** em `DATABASE_DIRECT_URL`.
2. Copie `.env.example` para `.env.local` e preencha as variáveis. `SUPABASE_SECRET_KEY` e senhas do banco ficam somente no servidor. Gere `AUTH_SECRET`, `SETUP_TOKEN` e `CRON_SECRET` com pelo menos 32 caracteres aleatórios cada.
3. Execute:

```sh
npm ci
npm run db:migrate
npm run dev
```

A migration cria as tabelas e dois buckets privados. O usuário inicial `kaueajure@gmail.com` fica sem senha. Configure a primeira senha em `/login` com `SETUP_TOKEN`, então retire esse token da configuração. Os hashes Argon2id e bcrypt existentes continuam válidos.

## Implantação na Vercel

1. Importe este repositório na Vercel com framework Next.js. Build: `npm run build`. Não há comando de inicialização específico.
2. Aplique `npm run db:migrate` ao projeto Supabase antes do primeiro deploy de produção. Use a conexão direta ou Session pooler para isso.
3. Configure no projeto Vercel `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `APP_URL`, `AUTH_SECRET` e `CRON_SECRET`; configure `SETUP_TOKEN` somente até criar a senha. `GITHUB_TOKEN` é opcional. `DATABASE_DIRECT_URL` só é necessária onde as migrations forem executadas.
4. Defina `APP_URL` como a origem HTTPS exata do domínio final e faça o deploy. Reimplante ao trocar domínio ou variáveis. O cron diário em `vercel.json` remove sessões, limites e resultados PDF expirados.
5. Confira login, upload/download privado e aceite de proposta no domínio publicado.

A Vercel limita os corpos de entrada e saída das Functions a 4,5 MB; uploads e resultados neste projeto são limitados a 4 MB. Para arquivos maiores, será preciso implementar upload direto assinado e download direto protegido no Storage. A bancada PDF suporta unir, separar, imagens para PDF, PDF para texto/Word e marca d'água. Veja [ferramentas PDF](docs/pdf.md).

## Código e segurança

- `src/app`: páginas, Server Components e Route Handlers Node.
- `src/lib/domain`: validações Zod, cálculos e datas.
- `src/lib/server`: PostgreSQL parametrizado, transações, sessão própria e Supabase Storage.
- `src/lib/pdf`: operações nativas com `pdf-lib`/`sharp` e PDF de propostas.
- `supabase/migrations`: schema PostgreSQL, índices, restrições, RLS e buckets privados.

Cookies de sessão são HttpOnly, SameSite Lax e Secure em produção. Rotas administrativas verificam a sessão; mutações verificam `Origin`. Documentos e resultados PDF ficam em buckets privados e são baixados somente após autorização na aplicação. A chave service role nunca vai ao navegador.

## Verificação

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

Os testes E2E precisam de um projeto Supabase isolado; veja [testes](docs/testing.md). Para migrar dados de uma instalação anterior, veja [migração de dados](docs/migration.md).
