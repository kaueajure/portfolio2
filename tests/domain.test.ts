import { describe, it, expect } from "vitest";
import { totals, expired, proposalCode } from "../src/lib/domain/proposals";
import {
  clientSchema,
  proposalSchema,
  dateSchema,
} from "../src/lib/domain/schemas";
import { agenda, alertLevel } from "../src/lib/domain/agenda";
import { addDate, today } from "../src/lib/domain/dates";
import { parseRanges } from "../src/lib/pdf/processor";
const valid = {
  name: "Cliente",
  purchaseDate: "2026-01-31",
  status: "orcamento",
  quoteValidUntil: "2026-02-28",
  paymentMethod: "a_vista",
};
describe("Propostas e dinheiro", () => {
  it("arredonda linhas antes de somar e evita erro binário", () =>
    expect(
      totals([
        { unitPrice: 0.1, quantity: 3 },
        { unitPrice: 1.05, quantity: 1.1 },
      ]).subtotal,
    ).toBe("1.46"));
  it("dá prioridade ao percentual", () =>
    expect(totals([{ unitPrice: 100, quantity: 2 }], 50, 10)).toMatchObject({
      discountValue: "0.00",
      discount: "20.00",
      total: "180.00",
    }));
  it("limita desconto fixo sem total negativo", () =>
    expect(totals([{ unitPrice: 10, quantity: 1 }], 30).total).toBe("0.00"));
  it("rejeita percentual inválido", () =>
    expect(() => totals([], 0, 101)).toThrow());
  it("gera códigos sequenciais sem limite de três dígitos", () => {
    expect(proposalCode(2026, 1)).toBe("PROP-2026-001");
    expect(proposalCode(2026, 1000)).toBe("PROP-2026-1000");
  });
  it("expira só depois da validade e preserva respostas", () => {
    expect(
      expired({ validUntil: "2026-09-29", status: "enviada" }, "2026-09-29"),
    ).toBe(false);
    expect(
      expired(
        { validUntil: "2026-09-28", status: "visualizada" },
        "2026-09-29",
      ),
    ).toBe(true);
    expect(
      expired({ validUntil: "2026-01-01", status: "aceita" }, "2026-09-29"),
    ).toBe(false);
  });
});
describe("Datas e agenda legada", () => {
  it("usa São Paulo na virada do dia", () =>
    expect(today(new Date("2026-01-01T01:00:00Z"))).toBe("2025-12-31"));
  it("preserva overflow de mês do PHP", () =>
    expect(addDate("2026-01-31", 0, 1)).toBe("2026-03-03"));
  it("calcula manutenção, renovação e próxima parcela", () => {
    const c = clientSchema.parse({
      ...valid,
      paymentMethod: "parcelas",
      installmentCount: 3,
      installmentValue: 100,
      firstInstallmentDate: "2026-01-31",
      installmentsPaid: 1,
    });
    const events = agenda(
      [{ ...c, id: 1, document: null, createdAt: "", updatedAt: "" }],
      "2026-02-01",
    );
    expect(events.find((e) => e.type === "parcela")?.date).toBe("2026-03-03");
    expect(events.find((e) => e.type === "manutencao")?.date).toBe(
      "2026-05-01",
    );
    expect(events.find((e) => e.type === "renovacao")?.date).toBe("2027-01-31");
  });
  it.each([
    [-1, "overdue"],
    [0, "7"],
    [7, "7"],
    [8, "15"],
    [15, "15"],
    [16, "30"],
    [30, "30"],
    [31, "ok"],
  ])("classifica %s dias", (n, label) =>
    expect(alertLevel(Number(n))).toBe(label),
  );
});
describe("Validações críticas", () => {
  it("não aceita datas inexistentes", () =>
    expect(dateSchema.safeParse("2026-02-30").success).toBe(false));
  it("exige campo do status", () =>
    expect(
      clientSchema.safeParse({ ...valid, status: "entregue" }).success,
    ).toBe(false));
  it("exige mensalidade e vencimento válidos", () =>
    expect(
      clientSchema.safeParse({
        ...valid,
        paymentMethod: "mensal",
        monthlyValue: 100,
        dueDay: 29,
        monthlyStartDate: "2026-01-01",
      }).success,
    ).toBe(false));
  it("rejeita parcelas pagas acima do total", () =>
    expect(
      clientSchema.safeParse({
        ...valid,
        paymentMethod: "parcelas",
        installmentCount: 2,
        installmentValue: 10,
        firstInstallmentDate: "2026-01-01",
        installmentsPaid: 3,
      }).success,
    ).toBe(false));
  it("não permite mais de 100 itens", () =>
    expect(
      proposalSchema.safeParse({
        title: "Teste",
        items: Array.from({ length: 101 }, () => ({
          name: "Item",
          priceType: "fixo",
          unitPrice: 1,
          quantity: 1,
        })),
      }).success,
    ).toBe(false));
  it("valida intervalos PDF sem alocações arbitrárias", () => {
    expect(parseRanges("3-1,2", 5)).toEqual([0, 1, 2]);
    expect(() => parseRanges("1-999999999", 5)).toThrow();
  });
});
