export const timeZone = "America/Sao_Paulo";
export function today(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function timestamp(now = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(now);
}
export function addDate(iso: string, days = 0, months = 0) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function daysUntil(date: string, base = today()) {
  return Math.round(
    (Date.parse(`${date}T12:00:00Z`) - Date.parse(`${base}T12:00:00Z`)) /
      86400000,
  );
}
export function formatDate(iso: string | null | undefined) {
  return iso ? iso.slice(0, 10).split("-").reverse().join("/") : "—";
}
export const money = (value: string | number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(value),
  );
