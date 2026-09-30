import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";
import nextEnv from "@next/env";
const { loadEnvConfig } = nextEnv;
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
  const file = process.argv.includes("--bootstrap")
    ? "migrations/000_initial.sql"
    : "migrations/001_runtime.sql";
  const sql = await readFile(file, "utf8");
  for (const statement of sql.split(";").filter((s) => s.trim()))
    await c.query(statement);
  console.log("Migration aditiva aplicada. Tabelas de negócio preservadas.");
} finally {
  await c.end();
}
