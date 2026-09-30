import "server-only";
import { spawn } from "node:child_process";
import {
  mkdir,
  writeFile,
  readFile,
  readdir,
  rm,
  stat,
  access,
} from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { PDFDocument, rgb, degrees } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import sharp from "sharp";
import { zipSync } from "fflate";
import { Document, Packer, Paragraph } from "docx";
import { assert, HttpError } from "../server/http";
import { validateFile } from "../server/storage";
import { pdfTools, type PdfTool } from "../domain/pdf";
export { pdfTools };
// Job files are runtime private data, never deployment assets.
const root = () =>
  path.resolve(
    /* turbopackIgnore: true */ process.env.PDF_JOB_PATH ?? "storage/pdf-jobs",
  );
export async function run(bin: string, args: string[], cwd?: string) {
  return new Promise<string>((resolve, reject) => {
    const proc = spawn(bin, args, {
      cwd,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, HOME: cwd ?? process.env.HOME },
    });
    let out = "";
    let size = 0;
    const timer = setTimeout(
      () => {
        proc.kill("SIGKILL");
      },
      Number(process.env.PDF_TIMEOUT_MS ?? 120000),
    );
    proc.stdout.on("data", (b: Buffer) => {
      size += b.length;
      if (size > 8 * 1024 * 1024) proc.kill("SIGKILL");
      else out += b.toString();
    });
    proc.stderr.resume();
    proc.once("error", () => {
      clearTimeout(timer);
      reject(new HttpError("Ferramenta de processamento indisponível.", 503));
    });
    proc.once("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(out);
      else
        reject(
          new HttpError(
            "Não foi possível processar o arquivo. Verifique o formato e a senha.",
          ),
        );
    });
  });
}
async function available(bin: string) {
  for (const dir of (process.env.PATH ?? "").split(path.delimiter)) {
    try {
      await access(path.join(dir, bin));
      return true;
    } catch {}
  }
  return false;
}
export async function capabilities() {
  const [gs, tess, office, text, qpdf] = await Promise.all(
    ["gs", "tesseract", "soffice", "pdftotext", "qpdf"].map(available),
  );
  let languages = "";
  if (tess)
    languages = await run("tesseract", ["--list-langs"]).catch(() => "");
  const language = languages.includes("\npor\n") ? "por+eng" : "eng";
  return {
    tools: {
      merge: true,
      split: true,
      images_to_pdf: true,
      file_to_pdf: office,
      pdf_to_images: gs,
      pdf_to_txt: text,
      pdf_to_docx: text,
      compress: gs,
      protect: qpdf,
      unlock: qpdf,
      watermark: true,
      ocr: gs && tess && languages.includes("eng"),
    },
    ocrLanguage: language,
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
async function cleanup() {
  await mkdir(root(), { recursive: true, mode: 0o700 });
  for (const entry of await readdir(/* turbopackIgnore: true */ root(), {
    withFileTypes: true,
  })) {
    if (!entry.isDirectory() || !/^[a-f0-9-]{36}$/.test(entry.name)) continue;
    const dir = path.join(/* turbopackIgnore: true */ root(), entry.name);
    if (
      Date.now() - (await stat(/* turbopackIgnore: true */ dir)).mtimeMs >
      3600000
    )
      await rm(dir, { recursive: true, force: true });
  }
}
async function loadPdf(file: string) {
  const pdf = await PDFDocument.load(await readFile(file));
  assert(pdf.getPageCount() <= 300, "Limite de 300 páginas por processamento");
  return pdf;
}
async function images(input: string, dir: string, format = "png") {
  await run(
    "gs",
    [
      "-dSAFER",
      "-dBATCH",
      "-dNOPAUSE",
      "-dQUIET",
      "-dLastPage=300",
      `-sDEVICE=${format === "jpg" ? "jpeg" : "png16m"}`,
      "-r150",
      `-sOutputFile=${dir}/page-%03d.${format}`,
      input,
    ],
    dir,
  );
  return (await readdir(dir))
    .filter((f) => f.startsWith("page-") && f.endsWith(`.${format}`))
    .sort()
    .map((f) => path.join(dir, f));
}
async function zipFiles(files: string[]) {
  const entries: Record<string, Uint8Array> = {};
  for (const f of files) entries[path.basename(f)] = await readFile(f);
  return zipSync(entries);
}
let active = 0;
export async function processPdf(
  tool: PdfTool,
  files: File[],
  options: Record<string, string>,
  userId: number,
) {
  assert(
    active < 2,
    "Há outros arquivos em processamento. Tente novamente em instantes.",
    429,
  );
  active++;
  let dir = "";
  try {
    const caps = await capabilities();
    assert(caps.tools[tool], "Ferramenta indisponível neste servidor.", 503);
    assert(files.length > 0 && files.length <= 20, "Envie de 1 a 20 arquivos");
    assert(
      files.reduce((n, f) => n + f.size, 0) <= 100 * 1024 * 1024,
      "Limite total de 100 MB.",
    );
    if (tool === "merge") assert(files.length >= 2, "Envie ao menos dois PDFs");
    else if (tool !== "images_to_pdf")
      assert(files.length === 1, "Envie um arquivo");
    await cleanup();
    const job = randomUUID();
    dir = path.join(/* turbopackIgnore: true */ root(), job);
    await mkdir(dir, { mode: 0o700 });
    const inputs: string[] = [];
    for (const [index, file] of files.entries()) {
      const v = await validateFile(file, 25 * 1024 * 1024);
      const extOk =
        tool === "images_to_pdf"
          ? ["png", "jpg", "jpeg", "webp", "gif"]
          : tool === "file_to_pdf"
            ? [
                "doc",
                "docx",
                "xls",
                "xlsx",
                "ppt",
                "pptx",
                "odt",
                "ods",
                "odp",
                "txt",
                "rtf",
                "csv",
              ]
            : ["pdf"];
      assert(
        extOk.includes(v.ext),
        "Tipo de arquivo incompatível com esta ferramenta",
      );
      const input = path.join(dir, `input-${index}.${v.ext}`);
      await writeFile(input, v.data, { mode: 0o600 });
      if (v.ext === "pdf" && tool !== "unlock") await loadPdf(input);
      inputs.push(input);
    }
    const input = inputs[0];
    let output = path.join(dir, "resultado.pdf");
    let mime = "application/pdf";
    if (tool === "merge") {
      const pdf = await PDFDocument.create();
      for (const file of inputs) {
        const source = await loadPdf(file);
        assert(
          pdf.getPageCount() + source.getPageCount() <= 300,
          "Limite de 300 páginas",
        );
        for (const p of await pdf.copyPages(source, source.getPageIndices()))
          pdf.addPage(p);
      }
      await writeFile(output, await pdf.save());
    }
    if (tool === "split") {
      const source = await loadPdf(input);
      if (options.ranges?.trim()) {
        const pdf = await PDFDocument.create();
        for (const p of await pdf.copyPages(
          source,
          parseRanges(options.ranges, source.getPageCount()),
        ))
          pdf.addPage(p);
        await writeFile(output, await pdf.save());
      } else {
        const entries: Record<string, Uint8Array> = {};
        for (const index of source.getPageIndices()) {
          const pdf = await PDFDocument.create();
          const [p] = await pdf.copyPages(source, [index]);
          pdf.addPage(p);
          entries[`pagina-${String(index + 1).padStart(3, "0")}.pdf`] =
            await pdf.save();
        }
        output = path.join(dir, "paginas.zip");
        mime = "application/zip";
        await writeFile(output, zipSync(entries));
      }
    }
    if (tool === "images_to_pdf") {
      const pdf = await PDFDocument.create();
      for (const file of inputs) {
        const buffer = await sharp(file, { limitInputPixels: 40000000 })
          .rotate()
          .png()
          .toBuffer();
        const img = await pdf.embedPng(buffer);
        const landscape = img.width > img.height;
        const page = pdf.addPage(landscape ? [842, 595] : [595, 842]);
        const scale = Math.min(
          page.getWidth() / img.width,
          page.getHeight() / img.height,
        );
        page.drawImage(img, {
          x: (page.getWidth() - img.width * scale) / 2,
          y: (page.getHeight() - img.height * scale) / 2,
          width: img.width * scale,
          height: img.height * scale,
        });
      }
      await writeFile(output, await pdf.save());
    }
    if (tool === "file_to_pdf") {
      await run(
        "soffice",
        [
          `-env:UserInstallation=file://${dir}/lo-profile`,
          "--headless",
          "--nologo",
          "--nodefault",
          "--nofirststartwizard",
          "--convert-to",
          "pdf",
          "--outdir",
          dir,
          input,
        ],
        dir,
      );
      output = path.join(dir, `${path.parse(input).name}.pdf`);
    }
    if (tool === "pdf_to_images") {
      const format = options.format === "jpg" ? "jpg" : "png";
      output = path.join(dir, "imagens.zip");
      mime = "application/zip";
      await writeFile(output, await zipFiles(await images(input, dir, format)));
    }
    if (tool === "pdf_to_txt" || tool === "pdf_to_docx") {
      const txt = path.join(dir, "texto.txt");
      await run("pdftotext", ["-layout", input, txt], dir);
      output = txt;
      mime = "text/plain; charset=utf-8";
      if (tool === "pdf_to_docx") {
        const text = await readFile(txt, "utf8");
        const doc = new Document({
          sections: [
            { children: text.split("\n").map((t) => new Paragraph(t)) },
          ],
        });
        output = path.join(dir, "texto.docx");
        mime =
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        await writeFile(output, await Packer.toBuffer(doc));
      }
    }
    if (tool === "compress") {
      await run(
        "gs",
        [
          "-dSAFER",
          "-dBATCH",
          "-dNOPAUSE",
          "-dQUIET",
          "-sDEVICE=pdfwrite",
          "-dPDFSETTINGS=/ebook",
          `-sOutputFile=${output}`,
          input,
        ],
        dir,
      );
    }
    if (tool === "protect" || tool === "unlock") {
      assert(
        (options.password?.length ?? 0) >= (tool === "protect" ? 4 : 1) &&
          (options.password?.length ?? 0) <= 128,
        "Senha inválida",
      );
      // qpdf supports AES-256; Ghostscript pdfwrite only supports older encryption.
      // A private job file keeps passwords out of process arguments and logs.
      const config = path.join(dir, "qpdf-job.json");
      await writeFile(
        config,
        JSON.stringify({
          inputFile: input,
          outputFile: output,
          ...(tool === "protect"
            ? {
                encrypt: {
                  userPassword: options.password,
                  ownerPassword: options.password,
                  "256bit": {},
                },
              }
            : { password: options.password, decrypt: "" }),
        }),
        { mode: 0o600 },
      );
      try {
        await run("qpdf", [`--job-json-file=${config}`], dir);
      } finally {
        await rm(config, { force: true });
      }
    }
    if (tool === "watermark") {
      assert(
        options.text?.trim() && options.text.length <= 80,
        "Use de 1 a 80 caracteres",
      );
      const pdf = await loadPdf(input);
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
      await writeFile(output, await pdf.save());
    }
    if (tool === "ocr") {
      const pages = await images(input, dir);
      const parts: string[] = [];
      for (const image of pages)
        parts.push(
          await run(
            "tesseract",
            [image, "stdout", "-l", caps.ocrLanguage],
            dir,
          ),
        );
      assert(parts.join("").trim(), "OCR não encontrou texto legível");
      output = path.join(dir, "ocr.txt");
      mime = "text/plain; charset=utf-8";
      await writeFile(output, parts.join("\n\n----\n\n"));
    }
    const s = await stat(output);
    if (mime === "application/pdf" && tool !== "protect") await loadPdf(output);
    assert(
      s.size > 0 && s.size <= 150 * 1024 * 1024,
      "Resultado inválido ou muito grande",
    );
    await writeFile(
      path.join(dir, "metadata.json"),
      JSON.stringify({
        userId,
        file: path.basename(output),
        mime,
        expires: Date.now() + 3600000,
      }),
      { mode: 0o600 },
    );
    return {
      job,
      fileName: path.basename(output),
      downloadUrl: `/api/pdf/download/${job}`,
    };
  } catch (e) {
    if (dir) await rm(dir, { recursive: true, force: true });
    throw e;
  } finally {
    active--;
  }
}
export async function pdfDownload(job: string, userId: number) {
  assert(/^[a-f0-9-]{36}$/.test(job), "Download inválido", 404);
  const dir = path.join(/* turbopackIgnore: true */ root(), job);
  let meta: { userId: number; file: string; mime: string; expires: number };
  try {
    meta = JSON.parse(
      await readFile(
        /* turbopackIgnore: true */ path.join(dir, "metadata.json"),
        "utf8",
      ),
    );
  } catch {
    throw new HttpError("Download expirado ou inexistente.", 404);
  }
  assert(
    meta.userId === userId && meta.expires > Date.now(),
    "Download expirado ou inexistente.",
    404,
  );
  return {
    data: await readFile(
      /* turbopackIgnore: true */ path.join(dir, path.basename(meta.file)),
    ),
    name: meta.file,
    mime: meta.mime,
  };
}
