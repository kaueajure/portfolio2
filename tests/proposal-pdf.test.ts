import { test, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { proposalPdf } from "@/lib/pdf/proposal";
import type { Proposal } from "@/lib/domain/schemas";
test("commercial PDF supports Unicode, long words and multiple pages", async () => {
  const p: Proposal = {
    id: 1,
    code: "PROP-2026-001",
    publicToken: "a".repeat(64),
    publicUrl: "https://example.test",
    title: "Proposta — Ação e integração",
    clientId: 1,
    clientName: "João da Conceição",
    status: "rascunho",
    validUntil: "2027-12-31",
    discountValue: 0,
    discountPercent: 10,
    subtotal: "10000.00",
    total: "9000.00",
    scope: "Escopo em português.\n" + "UmaPalavraMuitoLonga".repeat(80),
    conditions: "Condições: pagamento à vista.",
    viewedAt: null,
    respondedAt: null,
    clientResponse: null,
    viewers: [],
    items: Array.from({ length: 100 }, (_, i) => ({
      productId: null,
      name: `Item ${i + 1} — implementação`,
      description: "Autenticação e integração de informações.",
      priceType: "fixo",
      unitPrice: 100,
      quantity: 1,
      lineTotal: "100.00",
    })),
  };
  const pdf = await PDFDocument.load(await proposalPdf(p));
  expect(pdf.getPageCount()).toBeGreaterThan(5);
  for (const page of pdf.getPages())
    expect(page.getSize()).toEqual({ width: 595, height: 842 });
});
