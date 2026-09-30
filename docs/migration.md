# Migração e deploy

## Origem e preservação

A cópia auditada de `kaueajure/portfolio` permanece em `legacy/`. Não é servida pelo Next.js nem incluída na imagem Docker. As sete tabelas de negócio e os nomes físicos das colunas são mantidos. Os repositórios convertem para propriedades TypeScript.

**Não execute `legacy/database/schema.sql` no banco atual:** contém DROP TABLE. O comando normal `npm run db:migrate` aplica somente `001_runtime.sql`, com `CREATE TABLE IF NOT EXISTS` para sessões, limites de tentativas e sequência anual de propostas. `000_initial.sql` serve exclusivamente à instalação inicial (`db:bootstrap`) e não contém DROP.

## Banco existente

1. Faça backup consistente de MySQL e de `uploads/clientes`. Teste a restauração em um banco separado.
2. Configure `.env.local` com o banco restaurado. Use usuário com SELECT/INSERT/UPDATE/DELETE na aplicação; execute migrations com uma credencial de manutenção que possa criar tabelas.
3. Execute `npm run db:migrate`. Não renomeie tabelas ou colunas. Compare contagens das sete tabelas antes e depois.
4. Copie os arquivos de `uploads/clientes/` para o diretório privado `STORAGE_PATH`, mantendo os nomes. `documento_caminho` já armazena somente o nome relativo no legado. Confira downloads de registros antigos. Não use `public/`.
5. Para S3: copie os mesmos arquivos para bucket privado preservando as chaves e configure `STORAGE_DRIVER=s3`, endpoint, região, bucket e credenciais AWS. Mantenha a cópia local até conferir todos os documentos.
6. Confira clientes com cada forma de pagamento/status, notas, catálogo, proposta antiga com itens, histórico e PDF. Bcrypt `$2y$` existente é validado sem redefinição. Novas senhas usam Argon2id. Sessões PHP antigas não são reaproveitadas: faça login novamente.
7. Na troca de produção, suspenda escritas no legado, faça backup final e sincronize banco/documentos. Troque o proxy para o Node somente após validar os fluxos. Não mantenha as duas versões recebendo escritas: a sequência anual segura depende de todas as novas emissões passarem pelo Node.

Rollback: suspenda escritas, preserve o banco e os uploads atualizados e retorne o proxy ao legado. Nenhuma tabela de negócio mudou. As tabelas auxiliares podem permanecer. Antes do rollback, confirme compatibilidade dos hashes: contas novas com Argon2id exigem PHP com suporte Argon2; senhas legadas não foram convertidas.

## Decisões de compatibilidade

- Datas seguem America/Sao_Paulo. O avanço mensal preserva o overflow de PHP (31/jan + 1 mês pode cair em março).
- Agenda continua incluindo os clientes cancelados, como o código original.
- Itens são snapshots; alteração do catálogo não altera propostas existentes. O aceite e a sincronização do cliente são uma transação.
- O download público de PDF agora exige a mesma identificação da proposta. Fecha a possibilidade de contornar o gate pelo PDF no legado.
- PDF → Word preserva o texto extraído. Conversão com fidelidade de layout não era garantida no legado e não é anunciada na interface.
- Proteção/remoção de senha usam qpdf; Ghostscript pdfwrite do ambiente só oferecia revisões antigas de criptografia. Foi validado AES-256 com [qpdf](https://qpdf.readthedocs.io/en/12.0/cli.html).
- Senhas do processador ficam em arquivo de job com permissão 0600, removido após a execução, sem aparecer na linha de comando.

## Produção em VPS/container

```sh
npm ci
npm run db:migrate
npm run build
npm start
```

Ou construa a imagem passando a URL pública, necessária para metadata/canonical:

```sh
docker build --build-arg APP_URL=https://seu-dominio.example -t kaue-portfolio .
docker run --env-file .env.production -p 127.0.0.1:3000:3000 \
  --mount source=portfolio-private,target=/app/storage/private \
  --mount source=portfolio-jobs,target=/app/storage/pdf-jobs \
  --memory=2g --cpus=2 --pids-limit=256 \
  --restart unless-stopped kaue-portfolio
```

Crie `.env.production` fora do controle de versão. Ajuste `APP_URL`, MySQL e segredos. Execute a migration separadamente antes da troca: a imagem de runtime não inclui ferramentas de migração. HTTPS é obrigatório para cookies Secure. Use o exemplo Nginx deste diretório. Ative `TRUST_PROXY=true` somente se o proxy sobrescrever `X-Real-IP`, sem acesso direto externo à porta Node.

Instale Ghostscript, qpdf, Poppler, LibreOffice e Tesseract com `por` + `eng` no host se não usar Docker. A imagem inclui esses pacotes. Configure timeout do proxy maior que `PDF_TIMEOUT_MS`. O processamento limita concorrência a dois jobs por processo, 25 MB/arquivo e 100 MB/operação. Evite múltiplos processos sem dimensionar CPU/memória. Jobs expiram em uma hora e a limpeza ocorre ao iniciar operações. Rode `npm run maintenance` periodicamente no host para limpar também durante inatividade; use o mesmo ambiente e volumes.

Faça backups periódicos de MySQL e documentos. Não publique `/legacy`, `.env`, `storage`, arquivos SQL ou logs. O painel detecta binários ausentes.

Vercel/Functions não é o destino integral deste pacote: documentos podem usar S3 e o banco é remoto, mas OCR/Office/PDF precisam de serviço Linux persistente separado. O deploy entregue e validado é Node em Linux.
