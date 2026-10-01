# Testes

`npm test` executa testes unitários de domínio e das capacidades PDF sem serviços externos. Execute também `npm run lint`, `npm run typecheck` e `npm run build`.

Os testes E2E modificam dados. Use um **projeto Supabase descartável**, nunca produção. Defina `TEST_DATABASE_DIRECT_URL` como a conexão direta ou Session pooler **desse projeto de teste** e rode `npm run test:e2e:prepare`. O script aplica as migrations e cria a conta `test@example.test` com senha `Test-only-password-123!`. Inicie o Next com `DATABASE_URL`, `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` do **mesmo projeto de teste**; `APP_URL` deve ser `http://localhost:3000`. Depois execute `npx playwright install chromium` e `npm run test:e2e`.

O E2E cobre autenticação, documentos privados, catálogo, propostas, aceite, PDF com marca d'água, páginas e responsividade. Ele exige conexão e Storage reais no projeto de teste. Revogue as credenciais e descarte o projeto após o ensaio.
