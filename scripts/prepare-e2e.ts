import { readFile } from "node:fs/promises";
import pg from "pg";
import bcrypt from "bcryptjs";
import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());
const url = process.env.TEST_DATABASE_DIRECT_URL;
if (!url)
  throw new Error(
    "TEST_DATABASE_DIRECT_URL deve apontar para um projeto Supabase descartável",
  );
const c = new pg.Client({ connectionString: url });
await c.connect();
try {
  await c.query("BEGIN");
  for (const file of ["202609300001_initial.sql", "202609300002_pdf_jobs.sql"])
    await c.query(await readFile(`supabase/migrations/${file}`, "utf8"));
  const hash = await bcrypt.hash("Test-only-password-123!", 10);
  await c.query(
    "INSERT INTO usuarios(nome,email,senha_hash,criado_em,atualizado_em) VALUES ('Teste','test@example.test',$1,LOCALTIMESTAMP,LOCALTIMESTAMP) ON CONFLICT (email) DO UPDATE SET senha_hash=EXCLUDED.senha_hash,atualizado_em=LOCALTIMESTAMP",
    [hash],
  );
  await c.query("COMMIT");
  console.log("Schema e usuário E2E preparados no projeto de teste.");
} catch (error) {
  await c.query("ROLLBACK");
  throw error;
} finally {
  await c.end();
}
