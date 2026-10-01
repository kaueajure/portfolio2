"use client";
import { useState } from "react";
import { api } from "@/lib/client";
import { type Client, labels, statuses } from "@/lib/domain/schemas";
import { money, formatDate, today } from "@/lib/domain/dates";
import { agenda } from "@/lib/domain/agenda";
import { Field, Select, Textarea } from "@/components/ui/fields";
import { Dialog, Confirm } from "@/components/ui/dialog";
const statusFields: Record<string, [string, string]> = {
  orcamento: ["quoteValidUntil", "Validade do orçamento"],
  aprovado: ["approvalDate", "Data de aprovação"],
  em_andamento: ["deliveryForecast", "Previsão de entrega"],
  entregue: ["deliveryDate", "Data de entrega"],
  cancelado: ["cancelReason", "Motivo do cancelamento"],
};
export function Clients({ initial }: { initial: Client[] }) {
  const [clients, setClients] = useState(initial);
  const [edit, setEdit] = useState<Client | null | undefined>();
  const [remove, setRemove] = useState<Client | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const refresh = async () => setClients(await api<Client[]>("/api/clients"));
  const events = agenda(clients);
  const urgent = new Set(
    events
      .filter((e) => e.type !== "parcela" && e.daysLeft <= 7)
      .map((e) => e.clientId),
  );
  const filtered = clients.filter(
    (c) =>
      (!filter || c.status === filter) &&
      `${c.name} ${c.phone} ${c.email}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Relacionamento e operação</p>
          <h1>Clientes</h1>
        </div>
        <button
          className="primary"
          onClick={() => {
            setEdit(null);
            setMessage("");
          }}
        >
          Novo cliente
        </button>
      </header>
      <div className="stats">
        {[
          [clients.length, "Clientes"],
          [
            clients.filter((c) =>
              ["aprovado", "em_andamento", "entregue"].includes(c.status),
            ).length,
            "Ativos",
          ],
          [urgent.size, "Urgentes ≤ 7 dias"],
          [
            money(
              clients
                .filter((c) => c.status !== "cancelado")
                .reduce((a, c) => a + c.soldValue, 0),
            ),
            "Valor vendido",
          ],
        ].map(([v, l]) => (
          <article key={l}>
            <strong>{v}</strong>
            <span>{l}</span>
          </article>
        ))}
      </div>
      <div className="toolbar">
        <Field
          label="Buscar clientes"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          label="Filtrar status"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">Todos</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {labels[s]}
            </option>
          ))}
        </Select>
      </div>
      <p role="status">{message}</p>
      <div className="record-list">
        {filtered.map((c) => (
          <article className="surface record" key={c.id}>
            <div>
              <h2>{c.name}</h2>
              <span className="badge">{labels[c.status]}</span>
              <p>
                {c.phone || "Sem telefone"} · {c.email || "Sem e-mail"}
              </p>
              <p>
                Compra: {formatDate(c.purchaseDate)} · {labels[c.paymentMethod]}
              </p>
              <p>
                Orçamento {money(c.budgetValue)} → vendido {money(c.soldValue)}
              </p>
              {c.paymentMethod === "parcelas" ? (
                <p>
                  {c.installmentsPaid}/{c.installmentCount} parcelas ·{" "}
                  {money(c.installmentValue ?? 0)}
                </p>
              ) : null}
              {c.paymentMethod === "mensal" ? (
                <p>
                  {money(c.monthlyValue ?? 0)} / mês · dia {c.dueDay}
                </p>
              ) : null}
              <p>
                {statusFields[c.status][1]}:{" "}
                {c.status === "cancelado"
                  ? c.cancelReason
                  : formatDate(
                      c[statusFields[c.status][0] as keyof Client] as string,
                    )}
              </p>
              {events
                .filter((e) => e.clientId === c.id && e.type !== "parcela")
                .map((e) => (
                  <p key={e.type}>
                    {e.label}: {formatDate(e.date)} ·{" "}
                    {e.daysLeft < 0
                      ? `${-e.daysLeft} dias de atraso`
                      : `em ${e.daysLeft} dias`}
                  </p>
                ))}
            </div>
            <div className="actions">
              {c.document ? (
                <a className="button" href={c.document.url}>
                  Baixar documento
                </a>
              ) : null}
              <button
                onClick={() => {
                  setEdit(c);
                  setMessage("");
                }}
              >
                Editar
              </button>
              <button className="danger" onClick={() => setRemove(c)}>
                Excluir
              </button>
            </div>
          </article>
        ))}
      </div>
      {!filtered.length ? (
        <p className="empty">Nenhum cliente encontrado.</p>
      ) : null}
      {edit !== undefined ? (
        <ClientForm
          client={edit}
          onClose={() => setEdit(undefined)}
          onSaved={async () => {
            await refresh();
            setEdit(undefined);
            setMessage("Cliente salvo.");
          }}
        />
      ) : null}
      {remove ? (
        <Confirm
          title={`Excluir ${remove.name}?`}
          busy={busy}
          onClose={() => setRemove(null)}
          onConfirm={async () => {
            setBusy(true);
            try {
              await api(`/api/clients/${remove.id}/delete`, {});
              await refresh();
              setRemove(null);
              setMessage("Cliente excluído.");
            } catch (e) {
              setMessage((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <p role="alert">{message}</p>
        </Confirm>
      ) : null}
    </>
  );
}
function ClientForm({
  client,
  onClose,
  onSaved,
}: {
  client: Client | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [status, setStatus] = useState(client?.status ?? "orcamento");
  const [payment, setPayment] = useState(client?.paymentMethod ?? "a_vista");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sold, setSold] = useState(client?.soldValue ?? 0);
  const [count, setCount] = useState(client?.installmentCount ?? 2);
  const [installment, setInstallment] = useState(client?.installmentValue ?? 0);
  const [manual, setManual] = useState(!!client?.installmentValue);
  const [removeDoc, setRemoveDoc] = useState(false);
  const val = (key: keyof Client, fallback: string | number = "") => {
    const v = client?.[key];
    return typeof v === "number" || typeof v === "string" ? v : fallback;
  };
  return (
    <Dialog
      title={client ? "Editar cliente" : "Novo cliente"}
      onClose={onClose}
      busy={busy}
    >
      <form
        className="form"
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          if (removeDoc) f.set("removeDocument", "1");
          setBusy(true);
          setError("");
          try {
            await api(`/api/clients${client ? `/${client.id}` : ""}`, f);
            await onSaved();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <fieldset disabled={busy}>
          <legend>Dados do cliente</legend>
          <div className="form-grid">
            <Field
              label="Nome do cliente / empresa"
              name="name"
              defaultValue={val("name")}
              required
              maxLength={120}
            />
            <Field
              label="Telefone"
              name="phone"
              type="tel"
              defaultValue={val("phone")}
              maxLength={30}
            />
            <Field
              label="E-mail"
              name="email"
              type="email"
              defaultValue={val("email")}
              maxLength={120}
            />
            <Field
              label="Data da compra"
              name="purchaseDate"
              type="date"
              defaultValue={val("purchaseDate", today())}
              required
            />
            <Field
              label="Valor do orçamento (R$)"
              name="budgetValue"
              type="number"
              min="0"
              step="0.01"
              defaultValue={val("budgetValue", 0)}
              required
            />
            <Field
              label="Valor vendido (R$)"
              name="soldValue"
              type="number"
              min="0"
              step="0.01"
              value={sold}
              onChange={(e) => {
                const v = Number(e.target.value);
                setSold(v);
                if (!manual)
                  setInstallment(Math.round((v / count) * 100) / 100);
              }}
              required
            />
          </div>
        </fieldset>
        <fieldset disabled={busy}>
          <legend>Status e pagamento</legend>
          <div className="form-grid">
            <Select
              label="Status"
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as Client["status"])}
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {labels[s]}
                </option>
              ))}
            </Select>
            <Field
              key={status}
              label={statusFields[status][1]}
              name={statusFields[status][0]}
              type={status === "cancelado" ? "text" : "date"}
              defaultValue={val(statusFields[status][0] as keyof Client)}
              maxLength={255}
              required
            />
            <Select
              label="Forma de pagamento"
              name="paymentMethod"
              value={payment}
              onChange={(e) =>
                setPayment(e.target.value as Client["paymentMethod"])
              }
            >
              {["a_vista", "mensal", "parcelas"].map((p) => (
                <option key={p} value={p}>
                  {labels[p]}
                </option>
              ))}
            </Select>
            {payment === "a_vista" ? (
              <Field
                label="Data do pagamento"
                name="cashPaymentDate"
                type="date"
                defaultValue={val("cashPaymentDate")}
              />
            ) : null}
            {payment === "mensal" ? (
              <>
                <Field
                  label="Valor mensal (R$)"
                  name="monthlyValue"
                  type="number"
                  min="0.01"
                  step="0.01"
                  defaultValue={val("monthlyValue")}
                  required
                />
                <Field
                  label="Dia do vencimento"
                  name="dueDay"
                  type="number"
                  min="1"
                  max="28"
                  defaultValue={val("dueDay")}
                  required
                />
                <Field
                  label="Início da mensalidade"
                  name="monthlyStartDate"
                  type="date"
                  defaultValue={val("monthlyStartDate")}
                  required
                />
              </>
            ) : null}
            {payment === "parcelas" ? (
              <>
                <Field
                  label="Quantidade de parcelas"
                  name="installmentCount"
                  type="number"
                  min="2"
                  max="120"
                  value={count}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setCount(v);
                    if (!manual && v >= 2)
                      setInstallment(Math.round((sold / v) * 100) / 100);
                  }}
                  required
                />
                <Field
                  label="Valor da parcela (R$)"
                  name="installmentValue"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={installment}
                  onChange={(e) => {
                    setManual(true);
                    setInstallment(Number(e.target.value));
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => {
                    setManual(false);
                    setInstallment(Math.round((sold / count) * 100) / 100);
                  }}
                >
                  Calcular pelo valor vendido
                </button>
                <Field
                  label="Data da primeira parcela"
                  name="firstInstallmentDate"
                  type="date"
                  defaultValue={val("firstInstallmentDate")}
                  required
                />
                <Field
                  label="Parcelas já pagas"
                  name="installmentsPaid"
                  type="number"
                  min="0"
                  max={count}
                  defaultValue={val("installmentsPaid", 0)}
                  required
                />
              </>
            ) : null}
          </div>
        </fieldset>
        <fieldset disabled={busy}>
          <legend>Manutenção, documentos e observações</legend>
          <div className="form-grid">
            <Field
              label="Manutenção (dias)"
              name="maintenanceDays"
              type="number"
              min="0"
              max="36500"
              defaultValue={val("maintenanceDays", 90)}
              required
            />
            <Field
              label="Renovação (dias)"
              name="renewalDays"
              type="number"
              min="0"
              max="36500"
              defaultValue={val("renewalDays", 365)}
              required
            />
            <Field label="Documento (até 4 MB)" name="document" type="file" />
            {client?.document ? (
              <label>
                <input
                  type="checkbox"
                  checked={removeDoc}
                  onChange={(e) => setRemoveDoc(e.target.checked)}
                />{" "}
                Remover {client.document.name}
              </label>
            ) : null}
            <Textarea
              label="Observações"
              name="notes"
              maxLength={5000}
              defaultValue={val("notes")}
            />
          </div>
        </fieldset>
        <p role="alert">{error}</p>
        <div className="actions">
          <button type="button" disabled={busy} onClick={onClose}>
            Cancelar
          </button>
          <button className="primary" disabled={busy}>
            {busy ? "Salvando…" : "Salvar cliente"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
