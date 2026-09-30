import "server-only";
import { PDFDocument, rgb, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFile } from "node:fs/promises";
import type { Proposal } from "../domain/schemas";
import { money, formatDate } from "../domain/dates";
export async function proposalPdf(p: Proposal) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(
    await readFile("public/fonts/DejaVuSans.ttf"),
    { subset: true },
  );
  let page: PDFPage;
  let y = 0;
  const addPage = () => {
    page = pdf.addPage([595, 842]);
    y = 790;
    page.drawText("Kauê Ajure · Proposta comercial", {
      x: 42,
      y,
      font,
      size: 12,
      color: rgb(0.21, 0.4, 0.53),
    });
    y -= 40;
  };
  addPage();
  const line = (value: string, size = 10, gap = 17) => {
    const words = value
      .replace(/[\x00-\x1f]/g, " ")
      .split(/\s+/)
      .flatMap((word) => {
        const parts: string[] = [];
        let part = "";
        for (const char of word) {
          if (part && font.widthOfTextAtSize(part + char, size) > 510) {
            parts.push(part);
            part = "";
          }
          part += char;
        }
        if (part) parts.push(part);
        return parts;
      });
    let row = "";
    for (const word of words) {
      if (font.widthOfTextAtSize(`${row} ${word}`, size) > 510 && row) {
        if (y < 55) addPage();
        page.drawText(row, { x: 42, y, font, size });
        y -= gap;
        row = word;
      } else row = row ? `${row} ${word}` : word;
    }
    if (y < 55) addPage();
    page.drawText(row, { x: 42, y, font, size });
    y -= gap;
  };
  line(p.title, 19, 28);
  line(`Código: ${p.code}`);
  if (p.clientName) line(`Cliente: ${p.clientName}`);
  line(`Validade: ${formatDate(p.validUntil)}`);
  y -= 20;
  for (const item of p.items) {
    if (y < 120) addPage();
    line(item.name, 12, 20);
    if (item.description) line(item.description, 9, 15);
    line(
      `${item.priceType === "hora" ? "Hora" : "Fixo"} · Quantidade: ${item.quantity.toLocaleString("pt-BR")} · Unitário: ${money(item.unitPrice)} · Total: ${money(item.lineTotal)}`,
      9,
      18,
    );
    y -= 15;
  }
  line(`Subtotal: ${money(p.subtotal)}`);
  line(
    `Desconto${p.discountPercent ? ` (${p.discountPercent}%)` : ""}: ${money(Number(p.subtotal) - Number(p.total))}`,
  );
  line(`Total: ${money(p.total)}`, 16, 30);
  for (const [title, text] of [
    ["Escopo", p.scope],
    ["Condições", p.conditions],
  ]) {
    if (text) {
      y -= 15;
      line(title, 13, 22);
      for (const paragraph of text.split("\n")) line(paragraph, 10, 17);
    }
  }
  const pages = pdf.getPages();
  for (const [index, p] of pages.entries())
    p.drawText(`${index + 1} / ${pages.length}`, {
      x: 510,
      y: 25,
      font,
      size: 8,
      color: rgb(0.4, 0.4, 0.4),
    });
  return pdf.save();
}
