import mysql from "mysql2/promise";
import { readFile, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
const db = await mysql.createConnection({
  host: "127.0.0.1",
  port: 3308,
  user: "root",
});
try {
  await db.query(
    "CREATE DATABASE IF NOT EXISTS portfolio_migration_test CHARACTER SET utf8mb4",
  );
  await db.query("USE portfolio_migration_test");
  for (const file of [
    "legacy/database/schema.sql",
    "legacy/database/notas.sql",
    "legacy/database/propostas.sql",
    "migrations/001_runtime.sql",
  ]) {
    let sql = await readFile(file, "utf8");
    sql = sql
      .replace(/^--.*$/gm, "")
      .replace(/SET FOREIGN_KEY_CHECKS\s*=\s*\d\s*;/g, "")
      .replace(/DROP TABLE[^;]*;/g, "")
      .replace("CREATE TABLE clientes", "CREATE TABLE IF NOT EXISTS clientes");
    for (const q of sql.split(";").filter((v) => v.trim())) await db.query(q);
  }
  const password = "Test-only-password-123!";
  const hash = (await bcrypt.hash(password, 10)).replace("$2b$", "$2y$");
  await db.execute(
    "INSERT INTO usuarios(nome,email,senha_hash,criado_em,atualizado_em) VALUES ('Teste','test@example.test',?,NOW(),NOW()) ON DUPLICATE KEY UPDATE senha_hash=VALUES(senha_hash)",
    [hash],
  );
  const env = `APP_URL=http://localhost:3000\nMYSQL_HOST=127.0.0.1\nMYSQL_PORT=3308\nMYSQL_DATABASE=portfolio_migration_test\nMYSQL_USER=root\nMYSQL_PASSWORD=\nAUTH_SECRET=${randomBytes(32).toString("hex")}\nSETUP_TOKEN=${randomBytes(32).toString("hex")}\nSTORAGE_PATH=/tmp/portfolio-test-uploads\nPDF_JOB_PATH=/tmp/portfolio-test-pdf\n`;
  await writeFile(".env.test.local", env, { mode: 0o600, flag: "wx" }).catch(
    (error: NodeJS.ErrnoException) => {
      if (error.code !== "EEXIST") throw error;
    },
  );
  console.log("Banco isolado de testes preparado na porta 3308.");
} finally {
  await db.end();
}
