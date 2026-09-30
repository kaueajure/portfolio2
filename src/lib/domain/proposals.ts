import Decimal from "decimal.js";
import type { ItemInput, Proposal } from "./schemas";
import { today } from "./dates";
export function totals(
  items: Pick<ItemInput, "unitPrice" | "quantity">[],
  fixed = 0,
  percent = 0,
) {
  if (fixed < 0 || percent < 0 || percent > 100)
    throw new Error("Desconto inválido");
  const lines = items.map((i) =>
    new Decimal(i.unitPrice)
      .mul(i.quantity)
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP),
  );
  const subtotal = lines.reduce((a, b) => a.plus(b), new Decimal(0));
  if (subtotal.gt("9999999999.99"))
    throw new Error("Total excede o limite permitido");
  const discount =
    percent > 0
      ? subtotal.mul(percent).div(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
      : Decimal.min(fixed, subtotal);
  return {
    lines: lines.map((n) => n.toFixed(2)),
    subtotal: subtotal.toFixed(2),
    discount: discount.toFixed(2),
    total: Decimal.max(0, subtotal.minus(discount)).toFixed(2),
    discountValue: percent > 0 ? "0.00" : discount.toFixed(2),
    discountPercent: percent,
  };
}
export function expired(
  p: Pick<Proposal, "status" | "validUntil">,
  date = today(),
) {
  return (
    !!p.validUntil &&
    p.validUntil < date &&
    !["aceita", "recusada", "cancelada"].includes(p.status)
  );
}
export function proposalCode(year: number, n: number) {
  if (!Number.isSafeInteger(n) || n < 1) throw new Error("Sequência inválida");
  return `PROP-${year}-${String(n).padStart(3, "0")}`;
}
export function canRespond(p: Pick<Proposal, "status" | "validUntil">) {
  return ["enviada", "visualizada"].includes(p.status) && !expired(p);
}
