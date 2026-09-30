import "server-only";
import { readFile, writeFile, mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { fileTypeFromBuffer } from "file-type";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
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
// Private documents are mounted at runtime; never trace them into the build.
const local: Storage = {
  async put(key, data) {
    await mkdir(process.env.STORAGE_PATH ?? "storage/private", {
      recursive: true,
      mode: 0o700,
    });
    await writeFile(
      path.join(
        /* turbopackIgnore: true */ process.env.STORAGE_PATH ??
          "storage/private",
        safeKey(key),
      ),
      data,
      { mode: 0o600 },
    );
  },
  async get(key) {
    return readFile(
      /* turbopackIgnore: true */
      path.join(
        /* turbopackIgnore: true */ process.env.STORAGE_PATH ??
          "storage/private",
        safeKey(key),
      ),
    );
  },
  async remove(key) {
    await unlink(
      path.join(
        /* turbopackIgnore: true */ process.env.STORAGE_PATH ??
          "storage/private",
        safeKey(key),
      ),
    ).catch((e) => {
      if (e.code !== "ENOENT") throw e;
    });
  },
};
let s3: S3Client | undefined;
function s3Client() {
  return (s3 ??= new S3Client({
    region: process.env.S3_REGION ?? "auto",
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: true,
  }));
}
const remote: Storage = {
  async put(key, data, mime) {
    await s3Client().send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: safeKey(key),
        Body: data,
        ContentType: mime,
      }),
    );
  },
  async get(key) {
    const r = await s3Client().send(
      new GetObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: safeKey(key),
      }),
    );
    assert(r.Body, "Arquivo indisponível", 404);
    return r.Body.transformToByteArray();
  },
  async remove(key) {
    await s3Client().send(
      new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: safeKey(key),
      }),
    );
  },
};
export const storage = () =>
  process.env.STORAGE_DRIVER === "s3" ? remote : local;
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
export async function validateFile(file: File, max = 20 * 1024 * 1024) {
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
