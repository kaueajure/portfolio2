import "server-only";
import pg, { type PoolClient } from "pg";

pg.types.setTypeParser(1082, (value) => value);
pg.types.setTypeParser(1114, (value) => value);
pg.types.setTypeParser(1184, (value) => value);
let pool: pg.Pool | undefined;
function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não configurada");
  return (pool ??= new pg.Pool({
    connectionString: url,
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  }));
}
export type Connection = pg.Pool | PoolClient;
export type Row = Record<string, string | number | boolean | null>;
function bind(sql: string) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}
function values(params: unknown[]) {
  return params.map((v) => {
    if (
      v === null ||
      typeof v === "string" ||
      typeof v === "number" ||
      typeof v === "boolean"
    )
      return v;
    throw new Error("Invalid SQL parameter");
  });
}
export async function rows<T = Row>(
  sql: string,
  params: unknown[] = [],
  c: Connection = db(),
): Promise<T[]> {
  const result = await c.query(bind(sql), values(params));
  return result.rows as T[];
}
export async function execute(
  sql: string,
  params: unknown[] = [],
  c: Connection = db(),
) {
  const result = await c.query(bind(sql), values(params));
  return { affectedRows: result.rowCount ?? 0 };
}
export async function transaction<T>(fn: (c: PoolClient) => Promise<T>) {
  const c = await db().connect();
  try {
    await c.query("BEGIN");
    const value = await fn(c);
    await c.query("COMMIT");
    return value;
  } catch (error) {
    await c.query("ROLLBACK");
    throw error;
  } finally {
    c.release();
  }
}
// Table and column names come exclusively from static server-side maps.
export async function insert(
  table: string,
  data: Record<string, unknown>,
  c: Connection = db(),
) {
  const keys = Object.keys(data);
  const result = await c.query(
    `INSERT INTO ${table} (${keys.join(",")}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(",")}) RETURNING id`,
    values(Object.values(data)),
  );
  return {
    insertId: Number(result.rows[0]?.id),
    affectedRows: result.rowCount ?? 0,
  };
}
export async function update(
  table: string,
  id: number,
  data: Record<string, unknown>,
  c: Connection = db(),
) {
  const keys = Object.keys(data);
  return execute(
    `UPDATE ${table} SET ${keys.map((k) => `${k}=?`).join(",")} WHERE id=?`,
    [...Object.values(data), id],
    c,
  );
}
