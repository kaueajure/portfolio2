# Kauê Ajure — portfólio e painel

Next.js App Router, React e TypeScript estrito. Portfólio, clientes, agenda, notas, catálogo, propostas, aceite público, uploads privados e 12 ferramentas PDF. O runtime não utiliza PHP.

## Executar

Requisitos: Node 24, MySQL 8 ou MariaDB compatível e banco com as tabelas legadas. Para PDF completo: Ghostscript, qpdf 11+, Tesseract (`por` e `eng`), LibreOffice e Poppler.

```sh
npm ci
cp .env.example .env.local
# Preencha conexão MySQL, APP_URL e AUTH_SECRET (mínimo 32 caracteres aleatórios).
npm run db:migrate
npm run dev
```

A migration cria apenas tabelas auxiliares. Leia [migração e deploy](docs/migration.md) antes de conectar ao banco existente. Para instalação vazia, use `npm run db:bootstrap` após criar o banco; esse comando cria as tabelas de negócio sem apagar registros.

Login: `/login`. Primeiro acesso exige um usuário já cadastrado sem senha, `SETUP_TOKEN` configurado e senha de 12–128 caracteres. Remova o token após configurar. Senhas PHP bcrypt existentes continuam válidas.

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

`npm run test:e2e` requer a aplicação e o banco isolado descritos em [testes](docs/testing.md). Não execute os testes de integração contra produção.

## Arquitetura

- `src/app`: páginas, metadata e Route Handlers; componentes estáticos no servidor.
- `src/lib/domain`: schemas Zod, cálculos Decimal e datas em America/Sao_Paulo.
- `src/lib/server`: repositórios MySQL parametrizados, transações, autenticação, storage e GitHub.
- `src/lib/pdf`: processadores e PDF comercial com Unicode.
- `src/components`: interfaces públicas, animações e painel.
- `migrations`: alterações aditivas; `legacy`: referência original preservada, fora do diretório público.

Sessões e limites de tentativas ficam no MySQL. Mutações exigem `Origin` igual a `APP_URL`; cookies usam HttpOnly, SameSite Lax e Secure em produção. Downloads exigem sessão administrativa ou identificação assinada do visualizador da proposta.

## Configuração

Todas as variáveis estão em `.env.example`: `MYSQL_*`, `APP_URL`, `AUTH_SECRET`, `SETUP_TOKEN`, `GITHUB_TOKEN` opcional, `STORAGE_DRIVER`, `STORAGE_PATH`, `S3_*`, `AWS_*`, `TRUST_PROXY`, `PDF_JOB_PATH` e `PDF_TIMEOUT_MS`. Nenhum segredo é público.

O destino preparado é VPS/container Linux com HTTPS e volumes persistentes. `Dockerfile` inclui os binários PDF. S3 é suportado para documentos privados; um deploy integral em Functions exige separar o processamento PDF em serviço externo.

PDF → Word extrai texto e não reproduz layouts complexos. OCR depende da legibilidade da imagem. Compressão pode não reduzir arquivos já otimizados. Recursos ausentes são identificados no painel.
