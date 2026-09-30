import { test, expect } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import sharp from "sharp";
import { processPdf, pdfDownload, capabilities } from "@/lib/pdf/processor";
import { unzipSync } from "fflate";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

test("all twelve PDF tools process real files and private downloads", async (context) => {
  const root = await mkdtemp(path.join(tmpdir(), "portfolio-pdf-test-"));
  process.env.PDF_JOB_PATH = root;
  try {
    const caps = await capabilities();
    if (!Object.values(caps.tools).every(Boolean))
      context.skip(
        "Instale os binários PDF para executar este teste de integração.",
      );
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    pdf
      .addPage([595, 842])
      .drawText("PORTFOLIO TEST DOCUMENT", { font, size: 26, x: 40, y: 720 });
    pdf.addPage();
    const source = new File([new Uint8Array(await pdf.save())], "source.pdf", {
      type: "application/pdf",
    });
    const run = async (
      tool: Parameters<typeof processPdf>[0],
      files = [source],
      options: Record<string, string> = {},
    ) => {
      const job = await processPdf(tool, files, options, 1).catch(
        (error: Error) => {
          throw new Error(`${tool}: ${error.message}`, { cause: error });
        },
      );
      await expect(pdfDownload(job.job, 2)).rejects.toThrow();
      return pdfDownload(job.job, 1);
    };
    const merged = await run("merge", [source, source]);
    expect((await PDFDocument.load(merged.data)).getPageCount()).toBe(4);
    const split = await run("split");
    expect(Object.keys(unzipSync(split.data))).toHaveLength(2);
    const selected = await run("split", [source], { ranges: "2" });
    expect((await PDFDocument.load(selected.data)).getPageCount()).toBe(1);
    const img = await sharp({
      create: { width: 100, height: 100, channels: 3, background: "#fff" },
    })
      .png()
      .toBuffer();
    expect(
      (
        await PDFDocument.load(
          (
            await run("images_to_pdf", [
              new File([new Uint8Array(img)], "image.png"),
            ])
          ).data,
        )
      ).getPageCount(),
    ).toBe(1);
    expect(
      (
        await PDFDocument.load(
          (
            await run("file_to_pdf", [
              new File(["Office conversion test"], "test.txt"),
            ])
          ).data,
        )
      ).getPageCount(),
    ).toBeGreaterThan(0);
    expect(
      Object.keys(unzipSync((await run("pdf_to_images")).data)),
    ).toHaveLength(2);
    expect((await run("pdf_to_txt")).data.toString()).toContain("PORTFOLIO");
    expect(Object.keys(unzipSync((await run("pdf_to_docx")).data))).toContain(
      "word/document.xml",
    );
    expect((await run("compress")).data.length).toBeGreaterThan(0);
    expect(
      (await run("watermark", [source], { text: "Ação confidencial" })).data
        .length,
    ).toBeGreaterThan(0);
    const protectedPdf = await run("protect", [source], {
      password: "testing-123",
    });
    await expect(PDFDocument.load(protectedPdf.data)).rejects.toThrow();
    const unlocked = await run(
      "unlock",
      [new File([new Uint8Array(protectedPdf.data)], "protected.pdf")],
      { password: "testing-123" },
    );
    expect((await PDFDocument.load(unlocked.data)).getPageCount()).toBe(2);
    expect((await run("ocr")).data.toString()).toContain("PORTFOLIO");
  } finally {
    await rm(root, { recursive: true, force: true });
    delete process.env.PDF_JOB_PATH;
  }
}, 120000);
