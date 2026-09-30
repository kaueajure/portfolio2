import { addDate, daysUntil, today } from "./dates";
import type { Client } from "./schemas";
export function alertLevel(n: number) {
  return n < 0
    ? "overdue"
    : n <= 7
      ? "7"
      : n <= 15
        ? "15"
        : n <= 30
          ? "30"
          : "ok";
}
export function agenda(clients: Client[], base = today()) {
  return clients
    .flatMap((c) => {
      const events = [
        {
          type: "manutencao",
          label: "Manutenção",
          date: addDate(c.purchaseDate, c.maintenanceDays),
          value: null as number | null,
        },
        {
          type: "renovacao",
          label: "Renovação",
          date: addDate(c.purchaseDate, c.renewalDays),
          value: null as number | null,
        },
      ];
      // Preserves PHP DateTime::modify month overflow (31 Jan + 1 month => March).
      if (
        c.paymentMethod === "parcelas" &&
        c.firstInstallmentDate &&
        c.installmentCount &&
        c.installmentsPaid < c.installmentCount
      )
        events.push({
          type: "parcela",
          label: `Parcela ${c.installmentsPaid + 1}/${c.installmentCount}`,
          date: addDate(c.firstInstallmentDate, 0, c.installmentsPaid),
          value: c.installmentValue,
        });
      return events.map((e) => ({
        ...e,
        clientId: c.id,
        clientName: c.name,
        phone: c.phone,
        status: c.status,
        daysLeft: daysUntil(e.date, base),
        level: alertLevel(daysUntil(e.date, base)),
      }));
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}
export type AgendaEvent = ReturnType<typeof agenda>[number];
