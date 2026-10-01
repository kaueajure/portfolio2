import { test, expect } from "vitest";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { capabilities, parseRanges, extractPdfText } from "@/lib/pdf/processor";

test("PDF ranges reject invalid pages and deduplicate selections", () => {
  expect(parseRanges("1-3,2,5", 5)).toEqual([0, 1, 2, 4]);
  expect(() => parseRanges("0", 5)).toThrow();
  expect(() => parseRanges("6", 5)).toThrow();
  expect(() => parseRanges("1;2", 5)).toThrow();
});

test("serverless capabilities only advertise implemented PDF tools", async () => {
  const { tools } = await capabilities();
  expect(
    Object.entries(tools)
      .filter(([, enabled]) => enabled)
      .map(([tool]) => tool),
  ).toEqual([
    "merge",
    "split",
    "images_to_pdf",
    "pdf_to_txt",
    "pdf_to_docx",
    "watermark",
  ]);
});

test("extracts selectable text without system binaries", async () => {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  pdf
    .addPage()
    .drawText("PORTFOLIO TEXT TEST", { font, size: 18, x: 40, y: 700 });
  expect(await extractPdfText(await pdf.save())).toContain(
    "PORTFOLIO TEXT TEST",
  );
});
