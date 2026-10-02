import "server-only";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, rgb, degrees } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import sharp from "sharp";
import { zipSync } from "fflate";
import { Document, Packer, Paragraph } from "docx";
import { createClient } from "@supabase/supabase-js";
import { rows, execute } from "../server/db";
import { assert, HttpError } from "../server/http";
import { validateFile } from "../server/storage";
import { pdfTools, type PdfTool } from "../domain/pdf";
export { pdfTools };
const supported = new Set<PdfTool>([
  "merge",
  "split",
  "images_to_pdf",
  "pdf_to_txt",
  "pdf_to_docx",
  "watermark",
]);
export async function capabilities() {
  return {
    tools: Object.fromEntries(
      Object.keys(pdfTools).map((tool) => [
        tool,
        supported.has(tool as PdfTool),
      ]),
    ) as Record<PdfTool, boolean>,
    ocrLanguage: "",
  };
}
export function parseRanges(raw: string, count: number) {
  assert(raw.length <= 2000, "Intervalo muito longo");
  const result = new Set<number>();
  for (const part of raw.split(",")) {
    assert(
      /^\s*\d+(\s*-\s*\d+)?\s*$/.test(part),
      "Intervalo inválido. Ex.: 1-3,5",
    );
    const [a, b = a] = part.trim().split("-").map(Number);
    const lo = Math.min(a, b),
      hi = Math.max(a, b);
    assert(lo >= 1 && hi <= count, "Página fora do intervalo");
    for (let n = lo; n <= hi; n++) result.add(n - 1);
  }
  return [...result];
}
function client() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  assert(url && key, "Supabase Storage não configurado", 503);
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
async function loadPdf(data: Uint8Array) {
  const pdf = await PDFDocument.load(data);
  assert(pdf.getPageCount() <= 300, "Limite de 300 páginas por processamento");
  return pdf;
}
export async function extractPdfText(data: Uint8Array) {
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const task = getDocument({
    data: new Uint8Array(data),
    useSystemFonts: true,
    disableFontFace: true,
  });
  const pdf = await task.promise;
  try {
    assert(pdf.numPages <= 300, "Limite de 300 páginas por processamento");
    const pages: string[] = [];
    for (let index = 1; index <= pdf.numPages; index++) {
      const page = await pdf.getPage(index);
      const content = await page.getTextContent();
      let text = "";
      for (const item of content.items) {
        if (!("str" in item)) continue;
        text += item.str;
        text += item.hasEOL ? "\n" : " ";
      }
      pages.push(text.trim());
      page.cleanup();
    }
    const result = pages.join("\n\n----\n\n").trim();
    assert(
      result,
      "PDF não contém texto extraível. Para páginas digitalizadas é necessário OCR externo.",
    );
    return result;
  } finally {
    await task.destroy();
  }
}
export async function processPdf(
  tool: PdfTool,
  files: File[],
  options: Record<string, string>,
  userId: number,
) {
  assert(
    supported.has(tool),
    "Esta ferramenta requer um serviço externo de processamento PDF.",
    503,
  );
  assert(files.length > 0 && files.length <= 20, "Envie de 1 a 20 arquivos");
  assert(
    files.reduce((n, f) => n + f.size, 0) <= 4 * 1024 * 1024,
    "Limite total de 4 MB.",
    413,
  );
  if (tool === "merge") assert(files.length >= 2, "Envie ao menos dois PDFs");
  else if (tool !== "images_to_pdf")
    assert(files.length === 1, "Envie um arquivo");
  const inputs = [];
  for (const file of files) {
    const validated = await validateFile(file, 4 * 1024 * 1024);
    assert(
      tool === "images_to_pdf"
        ? ["png", "jpg", "jpeg", "webp", "gif"].includes(validated.ext)
        : validated.ext === "pdf",
      "Tipo de arquivo incompatível com esta ferramenta",
    );
    inputs.push(validated.data);
  }
  let output: Uint8Array;
  let name = "resultado.pdf";
  let mime = "application/pdf";
  if (tool === "merge") {
    const pdf = await PDFDocument.create();
    for (const input of inputs) {
      const source = await loadPdf(input);
      assert(
        pdf.getPageCount() + source.getPageCount() <= 300,
        "Limite de 300 páginas",
      );
      for (const page of await pdf.copyPages(source, source.getPageIndices()))
        pdf.addPage(page);
    }
    output = await pdf.save();
  } else if (tool === "split") {
    const source = await loadPdf(inputs[0]);
    if (options.ranges?.trim()) {
      const pdf = await PDFDocument.create();
      for (const page of await pdf.copyPages(
        source,
        parseRanges(options.ranges, source.getPageCount()),
      ))
        pdf.addPage(page);
      output = await pdf.save();
    } else {
      const entries: Record<string, Uint8Array> = {};
      for (const index of source.getPageIndices()) {
        const pdf = await PDFDocument.create();
        const [page] = await pdf.copyPages(source, [index]);
        pdf.addPage(page);
        entries[`pagina-${String(index + 1).padStart(3, "0")}.pdf`] =
          await pdf.save();
      }
      output = zipSync(entries);
      name = "paginas.zip";
      mime = "application/zip";
    }
  } else if (tool === "pdf_to_txt" || tool === "pdf_to_docx") {
    const text = await extractPdfText(inputs[0]);
    if (tool === "pdf_to_txt") {
      output = new TextEncoder().encode(text);
      name = "texto.txt";
      mime = "text/plain; charset=utf-8";
    } else {
      const doc = new Document({
        sections: [
          { children: text.split("\n").map((line) => new Paragraph(line)) },
        ],
      });
      output = new Uint8Array(await Packer.toBuffer(doc));
      name = "texto.docx";
      mime =
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }
  } else if (tool === "images_to_pdf") {
    const pdf = await PDFDocument.create();
    for (const input of inputs) {
      const buffer = await sharp(input, { limitInputPixels: 40000000 })
        .rotate()
        .png()
        .toBuffer();
      const image = await pdf.embedPng(buffer);
      const page = pdf.addPage(
        image.width > image.height ? [842, 595] : [595, 842],
      );
      const scale = Math.min(
        page.getWidth() / image.width,
        page.getHeight() / image.height,
      );
      page.drawImage(image, {
        x: (page.getWidth() - image.width * scale) / 2,
        y: (page.getHeight() - image.height * scale) / 2,
        width: image.width * scale,
        height: image.height * scale,
      });
    }
    output = await pdf.save();
  } else {
    assert(
      options.text?.trim() && options.text.length <= 80,
      "Use de 1 a 80 caracteres",
    );
    const pdf = await loadPdf(inputs[0]);
    pdf.registerFontkit(fontkit);
    const font = await pdf.embedFont(
      await readFile(path.resolve("public/fonts/DejaVuSans.ttf")),
    );
    for (const page of pdf.getPages()) {
      const size = Math.min(
        28,
        (page.getWidth() * 0.7) / font.widthOfTextAtSize(options.text, 1),
      );
      page.drawText(options.text, {
        x: page.getWidth() * 0.15,
        y: page.getHeight() * 0.45,
        font,
        size,
        color: rgb(0.3, 0.4, 0.5),
        opacity: 0.25,
        rotate: degrees(25),
      });
    }
    output = await pdf.save();
  }
  assert(
    output.length > 0 && output.length <= 4 * 1024 * 1024,
    "Resultado inválido ou muito grande",
    413,
  );
  if (mime === "application/pdf") await loadPdf(output);
  const job = randomUUID();
  const key = `${job}.${name.split(".").at(-1)}`;
  const store = client().storage.from("private-pdf-jobs");
  const { error } = await store.upload(key, output, {
    contentType: mime.split(";")[0],
    upsert: false,
  });
  if (error) throw error;
  try {
    await execute(
      "INSERT INTO app_pdf_jobs(id,user_id,object_key,file_name,mime,expires_at) VALUES (?,?,?,?,?,(CURRENT_TIMESTAMP AT TIME ZONE 'UTC') + INTERVAL '1 hour')",
      [job, userId, key, name, mime],
    );
  } catch (error) {
    await store.remove([key]);
    throw error;
  }
  return { job, fileName: name, downloadUrl: `/api/pdf/download/${job}` };
}
export async function pdfDownload(job: string, userId: number) {
  assert(/^[a-f0-9-]{36}$/.test(job), "Download inválido", 404);
  const [meta] = await rows<{
    object_key: string;
    file_name: string;
    mime: string;
  }>(
    "SELECT object_key,file_name,mime FROM app_pdf_jobs WHERE id=? AND user_id=? AND expires_at>(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')",
    [job, userId],
  );
  if (!meta) throw new HttpError("Download expirado ou inexistente.", 404);
  const { data, error } = await client()
    .storage.from("private-pdf-jobs")
    .download(meta.object_key);
  if (error || !data)
    throw new HttpError("Download expirado ou inexistente.", 404);
  return {
    data: new Uint8Array(await data.arrayBuffer()),
    name: meta.file_name,
    mime: meta.mime,
  };
}
