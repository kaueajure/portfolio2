import "server-only";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { fileTypeFromBuffer } from "file-type";
import { assert } from "./http";

export interface Storage {
  put(key: string, data: Uint8Array, mime: string): Promise<void>;
  get(key: string): Promise<Uint8Array>;
  remove(key: string): Promise<void>;
}
function safeKey(key: string) {
  assert(
    /^[a-zA-Z0-9_.-]+$/.test(key) && !key.includes(".."),
    "Arquivo inválido",
  );
  return key;
}
const bucket = "private-documents";
let client: ReturnType<typeof createClient> | undefined;
function supabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  assert(url && key, "Supabase Storage não configurado", 503);
  return (client ??= createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  }));
}
export const storage = (): Storage => ({
  async put(key, data, mime) {
    const { error } = await supabase()
      .storage.from(bucket)
      .upload(safeKey(key), data, { contentType: mime, upsert: false });
    if (error) throw error;
  },
  async get(key) {
    const { data, error } = await supabase()
      .storage.from(bucket)
      .download(safeKey(key));
    if (error || !data) throw error ?? new Error("Arquivo indisponível");
    return new Uint8Array(await data.arrayBuffer());
  },
  async remove(key) {
    const { error } = await supabase()
      .storage.from(bucket)
      .remove([safeKey(key)]);
    if (error) throw error;
  },
});
const allowed: Record<string, string[]> = {
  pdf: ["application/pdf"],
  png: ["image/png"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  webp: ["image/webp"],
  gif: ["image/gif"],
  zip: ["application/zip"],
  rar: ["application/x-rar-compressed"],
  "7z": ["application/x-7z-compressed"],
  doc: ["application/x-cfb", "application/msword"],
  xls: ["application/x-cfb", "application/vnd.ms-excel"],
  ppt: ["application/x-cfb", "application/vnd.ms-powerpoint"],
  docx: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  pptx: [
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
  odt: ["application/vnd.oasis.opendocument.text"],
  ods: ["application/vnd.oasis.opendocument.spreadsheet"],
  odp: ["application/vnd.oasis.opendocument.presentation"],
  rtf: ["application/rtf", "text/rtf"],
  txt: ["text/plain"],
  csv: ["text/plain", "text/csv"],
};
export async function validateFile(file: File, max = 4 * 1024 * 1024) {
  assert(
    file.size > 0 && file.size <= max,
    `Arquivo deve ter até ${max / 1024 / 1024} MB.`,
  );
  const ext = path.extname(file.name).slice(1).toLowerCase();
  assert(allowed[ext], "Tipo de arquivo não permitido.");
  const data = new Uint8Array(await file.arrayBuffer());
  let mime = (await fileTypeFromBuffer(data))?.mime;
  if (!mime && ["txt", "csv", "rtf"].includes(ext)) {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(data);
    assert(
      !/[\x00-\x08\x0e-\x1f]/.test(text) &&
        !/<\?(?:php|=)|<\s*(?:html|script|svg|!doctype)/i.test(text),
      "Conteúdo não permitido.",
    );
    mime =
      ext === "rtf" && text.startsWith("{\\rtf")
        ? "application/rtf"
        : "text/plain";
  }
  assert(
    mime && allowed[ext].includes(mime),
    "Conteúdo incompatível com a extensão.",
  );
  return {
    data,
    mime,
    ext,
    name: path
      .basename(file.name)
      .replace(/[\r\n"\\]/g, "_")
      .slice(0, 255),
  };
}
export async function saveDocument(file: File) {
  const v = await validateFile(file);
  assert(v.ext !== "odp", "Tipo de documento não permitido");
  const key = `${randomBytes(16).toString("hex")}.${v.ext}`;
  await storage().put(key, v.data, v.mime);
  return {
    documento_caminho: key,
    documento_nome: v.name,
    documento_tipo: v.mime,
  };
}
