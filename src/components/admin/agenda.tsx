"use client";
import { useState } from "react";
import type { AgendaEvent } from "@/lib/domain/agenda";
import { formatDate, money } from "@/lib/domain/dates";
import { Select } from "@/components/ui/fields";
export function Events({ items }: { items: AgendaEvent[] }) {
  return (
    <div className="record-list">
      {items.map((e) => (
        <article key={`${e.clientId}-${e.type}`} className="surface record">
          <div>
            <h3>{e.clientName}</h3>
            <p>
              {e.label}
              {e.value !== null ? ` · ${money(e.value)}` : ""}
            </p>
            <p>{e.phone}</p>
          </div>
          <div>
            <time>{formatDate(e.date)}</time>
            <p className={e.daysLeft <= 7 ? "urgent" : ""}>
              {e.daysLeft < 0
                ? `Atrasado ${-e.daysLeft} dias`
                : e.daysLeft === 0
                  ? "Vence hoje"
                  : `Em ${e.daysLeft} dias`}
            </p>
          </div>
        </article>
      ))}
      {!items.length ? (
        <p className="empty">Nenhum evento neste período.</p>
      ) : null}
    </div>
  );
}
export function Agenda({ items }: { items: AgendaEvent[] }) {
  const [filter, setFilter] = useState("30");
  return (
    <>
      <h1>Agenda</h1>
      <Select
        label="Período"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      >
        <option value="30">Próximos 30 dias e atrasados</option>
        <option value="7">Próximos 7 dias e atrasados</option>
        <option value="overdue">Só atrasados</option>
        <option value="all">Todos</option>
      </Select>
      <Events
        items={items.filter(
          (e) =>
            filter === "all" ||
            (filter === "overdue"
              ? e.daysLeft < 0
              : e.daysLeft <= Number(filter)),
        )}
      />
    </>
  );
}
