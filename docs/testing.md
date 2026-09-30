# Validação local

`npm test` executa domínio e processamento PDF. O teste dos 12 processadores é condicional à presença de todos os binários; para cobertura completa, instale os pacotes descritos no README. Ele cria arquivos reais em diretório temporário, testa download privado e remove os resultados.

## Integração e navegador

Use exclusivamente banco isolado. O script de preparação se conecta a MariaDB em `127.0.0.1:3308`, usuário root local sem senha, e usa o banco fixo `portfolio_migration_test`. Não configure um túnel dessa porta para produção.

```sh
# Com uma instância MariaDB descartável em 3308:
npx tsx scripts/prepare-test-db.ts
npx playwright install chromium
# Confira .env.test.local. O script não sobrescreve arquivos de ambiente existentes.
# Carregue essas variáveis no processo Next, em uma instância de testes:
node --env-file=.env.test.local node_modules/next/dist/bin/next dev
# Em outro terminal:
npm run test:e2e
```

A aplicação de testes usa `APP_URL=http://localhost:3000`. A conta é `test@example.test` com senha `Test-only-password-123!`. Somente o script de testes cria essa conta, nunca a migration de produção. Os testes deixam registros no banco descartável para inspeção; exclua o banco apenas quando encerrar a instância de testes.

Cobertura: datas/agenda/parcelas, cálculos/validação/códigos; 12 ferramentas PDF com arquivos reais; login bcrypt PHP, CSRF, documentos privados, catálogo/notas, proposta pública, gate/PDF, aceite transacional e bloqueio de segunda resposta. Navegador verifica 390/768/1440 px, reduced motion, páginas administrativas, criação/edição de cliente, item de proposta, envio, identificação, aceite e retorno ao admin.

## Orçamento de performance

Metas de produção: LCP ≤ 2,5 s, INP ≤ 200 ms e CLS ≤ 0,1 no percentil 75. São metas para monitoramento em produção, não resultados inventados. Seções estáticas são Server Components; GSAP é importado sob demanda; cache GitHub é de uma hora; fontes usam next/font; não há scroll hijacking. A intro usa pin apenas em desktop e dispensa movimento em reduced motion. Limite inicial de JavaScript da página pública: 250 KB gzip (incluindo motion carregado sob demanda); reavalie a cada nova dependência visual.

A imagem Docker e S3 precisam de smoke test no ambiente de destino, com credenciais e volumes reais. Build e testes locais não substituem teste de restauração do backup nem validação dos dados de produção.
