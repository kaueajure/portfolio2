import "server-only";
import { randomBytes, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import argon2 from "argon2";
import { z } from "zod";
import { rows, execute, transaction } from "./db";
import { assert, requireOrigin, HttpError } from "./http";
import { timestamp } from "../domain/dates";
const cookieName = "kaue_session";
function digest(value: string) {
  const key = process.env.AUTH_SECRET;
  assert(key && key.length >= 32, "Autenticação não configurada.", 503);
  return createHmac("sha256", key).update(value).digest("hex");
}
export function secureEqual(a: string, b: string) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}
export async function currentUser() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const r = await rows<{ id: number; name: string; email: string }>(
    "SELECT u.id,u.nome AS name,u.email FROM app_sessions s JOIN usuarios u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>UTC_TIMESTAMP() AND u.senha_hash IS NOT NULL",
    [digest(token)],
  );
  return r[0] ?? null;
}
export async function requireUser() {
  const user = await currentUser();
  assert(user, "Faça login para continuar.", 401);
  return user;
}
export async function rateLimit(
  req: Request,
  action: string,
  limit: number,
  seconds: number,
) {
  const ip =
    process.env.TRUST_PROXY === "true"
      ? (req.headers.get("x-real-ip") ?? "unknown")
      : "local";
  const key = digest(`${action}:${ip.slice(0, 100)}`);
  const allowed = await transaction(async (c) => {
    await execute(
      "INSERT INTO app_rate_limits (bucket,attempts,expires_at) VALUES (?,0,DATE_ADD(UTC_TIMESTAMP(),INTERVAL ? SECOND)) ON DUPLICATE KEY UPDATE bucket=bucket",
      [key, seconds],
      c,
    );
    const [r] = await rows<{ attempts: number; expired: number }>(
      "SELECT attempts,expires_at<=UTC_TIMESTAMP() AS expired FROM app_rate_limits WHERE bucket=? FOR UPDATE",
      [key],
      c,
    );
    if (r.expired) {
      await execute(
        "UPDATE app_rate_limits SET attempts=1,expires_at=DATE_ADD(UTC_TIMESTAMP(),INTERVAL ? SECOND) WHERE bucket=?",
        [seconds, key],
        c,
      );
      return true;
    }
    if (r.attempts >= limit) return false;
    await execute(
      "UPDATE app_rate_limits SET attempts=attempts+1 WHERE bucket=?",
      [key],
      c,
    );
    return true;
  });
  assert(allowed, "Muitas tentativas. Aguarde e tente novamente.", 429);
}
const loginSchema = z.object({
  email: z
    .email()
    .max(190)
    .transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1).max(128),
  setupToken: z.string().max(256).optional(),
  passwordConfirm: z.string().max(128).optional(),
});
export async function authenticate(
  req: Request,
  input: unknown,
  setup = false,
) {
  requireOrigin(req);
  await rateLimit(req, setup ? "setup" : "login", setup ? 5 : 8, 900);
  const v = loginSchema.parse(input);
  const [user] = await rows<{ id: number; senha_hash: string | null }>(
    "SELECT id,senha_hash FROM usuarios WHERE email=?",
    [v.email],
  );
  if (setup) {
    assert(
      process.env.SETUP_TOKEN &&
        secureEqual(v.setupToken ?? "", process.env.SETUP_TOKEN),
      "Não foi possível definir a senha.",
      403,
    );
    assert(
      v.password.length >= 12 && v.password === v.passwordConfirm,
      "Use 12 a 128 caracteres e confirme a senha.",
    );
    assert(user && !user.senha_hash, "Não foi possível definir a senha.", 403);
    const hash = await argon2.hash(v.password);
    const r = await execute(
      "UPDATE usuarios SET senha_hash=?,atualizado_em=? WHERE id=? AND senha_hash IS NULL",
      [hash, timestamp(), user.id],
    );
    assert(r.affectedRows === 1, "Não foi possível definir a senha.", 403);
  } else {
    const hash = user?.senha_hash;
    let valid = false;
    if (hash?.startsWith("$argon2"))
      valid = await argon2.verify(hash, v.password).catch(() => false);
    else if (hash && /^\$2[aby]\$/.test(hash))
      valid = await bcrypt.compare(v.password, hash.replace(/^\$2y\$/, "$2b$"));
    else
      await bcrypt.compare(
        v.password,
        "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
      );
    assert(valid && user, "E-mail ou senha incorretos.", 401);
  }
  assert(user, "E-mail ou senha incorretos.", 401);
  const jar = await cookies();
  const old = jar.get(cookieName)?.value;
  if (old)
    await execute("DELETE FROM app_sessions WHERE token_hash=?", [digest(old)]);
  const token = randomBytes(32).toString("hex");
  await execute(
    "INSERT INTO app_sessions(token_hash,user_id,expires_at) VALUES (?,?,DATE_ADD(UTC_TIMESTAMP(),INTERVAL 12 HOUR))",
    [digest(token), user.id],
  );
  await execute(
    "UPDATE usuarios SET ultimo_acesso=?,atualizado_em=? WHERE id=?",
    [timestamp(), timestamp(), user.id],
  );
  jar.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 43200,
  });
}
export async function logout(req: Request) {
  requireOrigin(req);
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (token)
    await execute("DELETE FROM app_sessions WHERE token_hash=?", [
      digest(token),
    ]);
  jar.delete(cookieName);
}
export async function viewerSession(token: string, name?: string) {
  const jar = await cookies();
  const key = `pv_${token.slice(0, 24)}`;
  if (name) {
    const value = Buffer.from(
      JSON.stringify({ token, name, exp: Date.now() + 12 * 3600000 }),
    ).toString("base64url");
    jar.set(key, `${value}.${digest(value)}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    return name;
  }
  const value = jar.get(key)?.value;
  if (!value) return null;
  const [data, mac] = value.split(".");
  if (!mac || !secureEqual(digest(data), mac)) return null;
  try {
    const v = JSON.parse(Buffer.from(data, "base64url").toString()) as {
      token: string;
      name: string;
      exp: number;
    };
    return v.token === token && v.exp > Date.now() ? v.name : null;
  } catch {
    return null;
  }
}
export async function requireViewer(token: string) {
  const name = await viewerSession(token);
  if (!name)
    throw new HttpError("Informe seu nome para abrir a proposta.", 403);
  return name;
}
