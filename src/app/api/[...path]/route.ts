import { z } from "zod";
import {
  handled,
  json,
  body,
  requireOrigin,
  assert,
  HttpError,
} from "@/lib/server/http";
import {
  authenticate,
  currentUser,
  logout,
  requireUser,
  rateLimit,
  viewerSession,
  requireViewer,
} from "@/lib/server/auth";
import { listClients, saveClient, deleteClient } from "@/lib/server/clients";
import {
  listNotes,
  saveNote,
  deleteNote,
  listProducts,
  saveProduct,
  reorderProducts,
} from "@/lib/server/catalog-notes";
import {
  listProposals,
  getProposal,
  saveProposal,
  proposalAction,
  publicPreview,
  openProposal,
  publicPayload,
  respond,
  publicFull,
  expireProposals,
} from "@/lib/server/proposals";
import {
  idSchema,
  tokenSchema,
  viewerSchema,
  responseSchema,
} from "@/lib/domain/schemas";
import { agenda } from "@/lib/domain/agenda";
import { rows, execute } from "@/lib/server/db";
import { storage } from "@/lib/server/storage";
import { timestamp } from "@/lib/domain/dates";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function download(data: Uint8Array, name: string, mime: string) {
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": mime,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(name)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
async function dispatch(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return handled(async () => {
    const { path } = await params;
    const route = path.join("/");
    const knownRoute =
      /^(?:auth\/(?:me|login|setup|logout)|public\/[a-f0-9]{64}\/(?:preview|open|full|pdf|respond)|clients(?:\/\d+(?:\/(?:delete|document))?)?|notes(?:\/\d+(?:\/delete)?)?|products(?:\/reorder|\/\d+(?:\/deactivate)?)?|proposals(?:\/\d+(?:\/(?:send|cancel|delete|duplicate|pdf))?)?|agenda|pdf\/(?:capabilities|download\/[a-f0-9-]{36}|merge|split|images_to_pdf|file_to_pdf|pdf_to_images|pdf_to_txt|pdf_to_docx|compress|protect|unlock|watermark|ocr))$/;
    assert(knownRoute.test(route), "Rota não encontrada", 404);
    const [area, key, action] = path;
    const get = req.method === "GET";
    if (!get) requireOrigin(req);
    if (area === "auth") {
      if (get && key === "me") return json({ user: await currentUser() });
      if (!get && key === "logout") {
        await logout(req);
        return json({ ok: true });
      }
      if (!get && (key === "login" || key === "setup")) {
        await authenticate(req, await body(req), key === "setup");
        return json({ ok: true });
      }
      throw new HttpError("Método não permitido", 405);
    }
    if (area === "public") {
      const token = tokenSchema.parse(key);
      if (get && action === "preview") return json(await publicPreview(token));
      if (!get && action === "open") {
        await rateLimit(req, "proposal-open", 40, 600);
        const v = viewerSchema.parse(await body(req));
        const returning = await viewerSession(token);
        const p = await openProposal(token, v.name, returning === v.name);
        await viewerSession(token, v.name);
        return json(publicPayload(p));
      }
      await requireViewer(token);
      if (get && action === "full")
        return json(publicPayload(await publicFull(token)));
      if (get && action === "pdf") {
        const p = await publicFull(token);
        const { proposalPdf } = await import("@/lib/pdf/proposal");
        return download(
          await proposalPdf(p),
          `${p.code}.pdf`,
          "application/pdf",
        );
      }
      if (!get && action === "respond") {
        await rateLimit(req, "proposal-respond", 20, 600);
        const v = responseSchema.parse(await body(req));
        return json(publicPayload(await respond(token, v.action, v.message)));
      }
      throw new HttpError("Rota não encontrada", 404);
    }
    const user = await requireUser();
    if (area === "clients") {
      if (get && !key) return json(await listClients());
      const id = key ? idSchema.parse(key) : undefined;
      if (get && id && action === "document") {
        const [r] = await rows(
          "SELECT documento_caminho,documento_nome,documento_tipo FROM clientes WHERE id=?",
          [id],
        );
        assert(r?.documento_caminho, "Documento não encontrado", 404);
        return download(
          await storage().get(String(r.documento_caminho)),
          String(r.documento_nome),
          String(r.documento_tipo ?? "application/octet-stream"),
        );
      }
      if (!get && action === "delete" && id) {
        await deleteClient(id);
        return json({ ok: true });
      }
      if (!get) {
        assert(
          Number(req.headers.get("content-length") ?? 0) <= 4_400_000,
          "Arquivo muito grande",
          413,
        );
        const f = await req.formData();
        const file = f.get("document");
        return json(
          await saveClient(
            Object.fromEntries(f.entries()),
            id,
            file instanceof File && file.size ? file : undefined,
            f.get("removeDocument") === "1",
          ),
        );
      }
    }
    if (area === "notes") {
      if (get && !key) return json(await listNotes());
      const id = key ? idSchema.parse(key) : undefined;
      if (!get && action === "delete" && id) {
        await deleteNote(id);
        return json({ ok: true });
      }
      if (!get) return json({ id: await saveNote(await body(req), id) });
    }
    if (area === "products") {
      if (get && !key) return json(await listProducts());
      if (!get && key === "reorder") {
        const v = z
          .object({ ids: z.array(idSchema).min(1).max(1000) })
          .parse(await body(req));
        await reorderProducts(v.ids);
        return json({ ok: true });
      }
      const id = key ? idSchema.parse(key) : undefined;
      if (!get && action === "deactivate" && id) {
        await execute(
          "UPDATE produtos_servicos SET ativo=false,atualizado_em=? WHERE id=?",
          [timestamp(), id],
        );
        return json({ ok: true });
      }
      if (!get) return json({ id: await saveProduct(await body(req), id) });
    }
    if (area === "proposals") {
      if (get && !key) return json(await listProposals());
      const id = key ? idSchema.parse(key) : undefined;
      if (get && id) {
        await expireProposals();
        const p = await getProposal(id);
        if (action === "pdf") {
          const { proposalPdf } = await import("@/lib/pdf/proposal");
          return download(
            await proposalPdf(p),
            `${p.code}.pdf`,
            "application/pdf",
          );
        }
        return json(p);
      }
      if (!get && id && action) {
        const a = z
          .enum(["send", "cancel", "delete", "duplicate"])
          .parse(action);
        return json(await proposalAction(id, a));
      }
      if (!get) return json(await saveProposal(await body(req), id));
    }
    if (area === "agenda" && get) return json(agenda(await listClients()));
    if (area === "pdf") {
      const { capabilities, processPdf, pdfDownload, pdfTools } =
        await import("@/lib/pdf/processor");
      if (get && key === "capabilities") return json(await capabilities());
      if (get && key === "download") {
        const f = await pdfDownload(action, user.id);
        return download(f.data, f.name, f.mime);
      }
      if (!get) {
        assert(Object.hasOwn(pdfTools, key), "Ferramenta inválida");
        await rateLimit(req, "pdf", 20, 600);
        assert(
          Number(req.headers.get("content-length") ?? 0) <= 4_400_000,
          "Arquivo muito grande",
          413,
        );
        const form = await req.formData();
        const files = form
          .getAll("files")
          .filter((f): f is File => f instanceof File);
        const options = Object.fromEntries(
          [...form.entries()].filter(
            (e): e is [string, string] => typeof e[1] === "string",
          ),
        );
        return json(
          await processPdf(
            key as keyof typeof pdfTools,
            files,
            options,
            user.id,
          ),
        );
      }
    }
    throw new HttpError("Rota não encontrada", 404);
  });
}
export const GET = dispatch;
export const POST = dispatch;
