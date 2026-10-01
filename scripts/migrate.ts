import { readFile } from "node:fs/promises";
import pg from "pg";
import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());
const url = process.env.DATABASE_DIRECT_URL;
if (!url) throw new Error("DATABASE_DIRECT_URL é necessária para migrations");
const c = new pg.Client({ connectionString: url });
await c.connect();
try {
  await c.query("BEGIN");
  for (const file of ["202609300001_initial.sql", "202609300002_pdf_jobs.sql"])
    await c.query(await readFile(`supabase/migrations/${file}`, "utf8"));
  await c.query("COMMIT");
  console.log("Schema PostgreSQL aplicado.");
} catch (error) {
  await c.query("ROLLBACK");
  throw error;
} finally {
  await c.end();
}
