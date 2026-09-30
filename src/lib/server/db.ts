import "server-only";
import mysql, {
  type Pool,
  type PoolConnection,
  type RowDataPacket,
  type ResultSetHeader,
} from "mysql2/promise";
let pool: Pool | undefined;
export function db() {
  if (!pool)
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST ?? "127.0.0.1",
      port: Number(process.env.MYSQL_PORT ?? 3306),
      database: process.env.MYSQL_DATABASE,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      charset: "utf8mb4",
      dateStrings: true,
      decimalNumbers: false,
      connectionLimit: 10,
      ssl:
        process.env.MYSQL_SSL === "true"
          ? { rejectUnauthorized: true }
          : undefined,
    });
  return pool;
}
export type Connection = Pool | PoolConnection;
export type Row = Record<string, string | number | null>;
export async function rows<T = Row>(
  sql: string,
  params: unknown[] = [],
  c: Connection = db(),
): Promise<T[]> {
  const [r] = await c.execute<RowDataPacket[]>(sql, params.map(sqlValue));
  return r as T[];
}
export async function execute(
  sql: string,
  params: unknown[] = [],
  c: Connection = db(),
) {
  const [r] = await c.execute<ResultSetHeader>(sql, params.map(sqlValue));
  return r;
}
export async function transaction<T>(fn: (c: PoolConnection) => Promise<T>) {
  const c = await db().getConnection();
  try {
    await c.beginTransaction();
    const result = await fn(c);
    await c.commit();
    return result;
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}
// Identifiers originate only from static repository maps, never request input.
export async function insert(
  table: string,
  data: Record<string, unknown>,
  c: Connection = db(),
) {
  const keys = Object.keys(data);
  return execute(
    `INSERT INTO ${table} (${keys.join(",")}) VALUES (${keys.map(() => "?").join(",")})`,
    Object.values(data),
    c,
  );
}
export async function update(
  table: string,
  id: number,
  data: Record<string, unknown>,
  c: Connection = db(),
) {
  return execute(
    `UPDATE ${table} SET ${Object.keys(data)
      .map((k) => `${k}=?`)
      .join(",")} WHERE id=?`,
    [...Object.values(data), id],
    c,
  );
}

function sqlValue(v: unknown): string | number | boolean | null {
  if (
    v === null ||
    typeof v === "string" ||
    typeof v === "number" ||
    typeof v === "boolean"
  )
    return v;
  throw new Error("Invalid SQL parameter");
}
