import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
import mysql from "mysql2/promise";
import { readdir, stat, rm } from "node:fs/promises";
import path from "node:path";
loadEnvConfig(process.cwd());
const c = await mysql.createConnection({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT ?? 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  ssl:
    process.env.MYSQL_SSL === "true" ? { rejectUnauthorized: true } : undefined,
});
try {
  await c.execute("DELETE FROM app_sessions WHERE expires_at<UTC_TIMESTAMP()");
  await c.execute(
    "DELETE FROM app_rate_limits WHERE expires_at<UTC_TIMESTAMP()",
  );
  const root = path.resolve(process.env.PDF_JOB_PATH ?? "storage/pdf-jobs");
  const entries = await readdir(root, { withFileTypes: true }).catch(
    (error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return [];
      throw error;
    },
  );
  for (const entry of entries) {
    if (!entry.isDirectory() || !/^[a-f0-9-]{36}$/.test(entry.name)) continue;
    const dir = path.join(root, entry.name);
    if (Date.now() - (await stat(dir)).mtimeMs > 3600000)
      await rm(dir, { recursive: true, force: true });
  }
  console.log(
    "Sessões, limites e jobs expirados removidos. Documentos de clientes preservados.",
  );
} finally {
  await c.end();
}
