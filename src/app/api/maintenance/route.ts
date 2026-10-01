import { createClient } from "@supabase/supabase-js";
import { rows, execute } from "@/lib/server/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`)
    return new Response(null, { status: 401 });
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return new Response(null, { status: 503 });
  const expired = await rows<{ id: string; object_key: string }>(
    "SELECT id,object_key FROM app_pdf_jobs WHERE expires_at < (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') LIMIT 100",
  );
  const storage = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  }).storage.from("private-pdf-jobs");
  for (const job of expired) {
    const { error } = await storage.remove([job.object_key]);
    if (error) throw error;
    await execute("DELETE FROM app_pdf_jobs WHERE id=?", [job.id]);
  }
  await execute(
    "DELETE FROM app_sessions WHERE expires_at < (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')",
  );
  await execute(
    "DELETE FROM app_rate_limits WHERE expires_at < (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')",
  );
  return Response.json(
    { cleaned: expired.length },
    { headers: { "Cache-Control": "no-store" } },
  );
}
