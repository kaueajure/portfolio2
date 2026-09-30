import "server-only";
import { ZodError } from "zod";
export class HttpError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function assert(
  value: unknown,
  message: string,
  status = 400,
): asserts value {
  if (!value) throw new HttpError(message, status);
}
export function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}
export async function handled(fn: () => Promise<Response>) {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ZodError)
      return json(
        {
          error: e.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; "),
        },
        400,
      );
    if (e instanceof HttpError) return json({ error: e.message }, e.status);
    console.error("Request failed", e instanceof Error ? e.name : "unknown");
    return json(
      { error: "Não foi possível concluir a operação. Tente novamente." },
      500,
    );
  }
}
export function appUrl() {
  const value = process.env.APP_URL;
  if (!value && process.env.NODE_ENV === "production")
    throw new Error("APP_URL obrigatório");
  return new URL(value ?? "http://localhost:3000").origin;
}
export function requireOrigin(req: Request) {
  assert(req.headers.get("origin") === appUrl(), "Origem não autorizada.", 403);
  assert(
    req.headers.get("sec-fetch-site") !== "cross-site",
    "Origem não autorizada.",
    403,
  );
}
export async function body(req: Request) {
  assert(
    Number(req.headers.get("content-length") ?? 0) <= 1024 * 1024,
    "Requisição muito grande.",
    413,
  );
  const raw = await req.text();
  assert(
    Buffer.byteLength(raw) <= 1024 * 1024,
    "Requisição muito grande.",
    413,
  );
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new HttpError("JSON inválido");
  }
}
