"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client";
import {
  type Proposal,
  type ProposalInput,
  type Client,
  type Product,
  labels,
  proposalStatuses,
} from "@/lib/domain/schemas";
import { totals } from "@/lib/domain/proposals";
import { money, formatDate } from "@/lib/domain/dates";
import { Field, Select, Textarea } from "@/components/ui/fields";
import { Confirm } from "@/components/ui/dialog";
export function Proposals({ initial }: { initial: Proposal[] }) {
  const [list, setList] = useState(initial);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<{
    p: Proposal;
    action: "cancel" | "delete";
  } | null>(null);
  const router = useRouter();
  async function action(p: Proposal, a: string) {
    setBusy(true);
    setMessage("");
    try {
      const result = await api<Proposal | null>(
        `/api/proposals/${p.id}/${a}`,
        {},
      );
      if (a === "duplicate" && result) {
        router.push(`/admin/propostas/${result.id}`);
        return;
      }
      setList(await api<Proposal[]>("/api/proposals"));
      setConfirm(null);
      setMessage("Proposta atualizada.");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function copy(p: Proposal) {
    setBusy(true);
    try {
      if (["rascunho", "recusada", "expirada"].includes(p.status)) {
        p = await api<Proposal>(`/api/proposals/${p.id}/send`, {});
        setList(await api<Proposal[]>("/api/proposals"));
      }
      await navigator.clipboard.writeText(p.publicUrl);
      setMessage("Link copiado. Já pode enviar ao cliente.");
    } catch (e) {
      setMessage(`${(e as Error).message} Link: ${p.publicUrl}`);
    } finally {
      setBusy(false);
    }
  }
  const filtered = list.filter(
    (p) =>
      (!filter || p.status === filter) &&
      `${p.code} ${p.title} ${p.clientName}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <header className="page-head">
        <h1>Propostas</h1>
        <div className="actions">
          <Link className="button" href="/admin/catalogo">
            Catálogo
          </Link>
          <Link className="button primary" href="/admin/propostas/nova">
            Nova proposta
          </Link>
        </div>
      </header>
      <div className="toolbar">
        <Field
          label="Buscar propostas"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          label="Status"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">Todos</option>
          {proposalStatuses.map((s) => (
            <option key={s} value={s}>
              {labels[s]}
            </option>
          ))}
        </Select>
      </div>
      <p role="status" className="prewrap">
        {message}
      </p>
      <div className="record-list">
        {filtered.map((p) => (
          <article key={p.id} className="surface record">
            <div>
              <span className="eyebrow">{p.code}</span>
              <h2>{p.title}</h2>
              <p>
                {p.clientName ?? "Sem cliente"} · {labels[p.status]} ·{" "}
                {money(p.total)}
              </p>
              <p>Validade: {formatDate(p.validUntil)}</p>
              <p>
                {p.viewers.length
                  ? `Visto por ${p.viewers[0].name}${p.viewers.length > 1 ? ` + ${p.viewers.length - 1}` : ""}`
                  : "Ainda não vista"}
              </p>
            </div>
            <div className="actions">
              <Link className="button" href={`/admin/propostas/${p.id}`}>
                Abrir
              </Link>
              {p.status !== "cancelada" ? (
                <button disabled={busy} onClick={() => copy(p)}>
                  Copiar link
                </button>
              ) : null}
              <button disabled={busy} onClick={() => action(p, "duplicate")}>
                Duplicar
              </button>
              <a className="button" href={`/api/proposals/${p.id}/pdf`}>
                PDF
              </a>
              {!["aceita", "cancelada"].includes(p.status) ? (
                <button
                  disabled={busy}
                  onClick={() => setConfirm({ p, action: "cancel" })}
                >
                  Cancelar
                </button>
              ) : null}
              {["rascunho", "cancelada"].includes(p.status) ? (
                <button
                  disabled={busy}
                  onClick={() => setConfirm({ p, action: "delete" })}
                >
                  Excluir
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
      {!filtered.length ? (
        <p className="empty">Nenhuma proposta encontrada.</p>
      ) : null}
      {confirm ? (
        <Confirm
          title={`${confirm.action === "delete" ? "Excluir" : "Cancelar"} proposta?`}
          busy={busy}
          onClose={() => setConfirm(null)}
          onConfirm={() => action(confirm.p, confirm.action)}
        >
          <p role="alert">{message}</p>
        </Confirm>
      ) : null}
    </>
  );
}
const empty: ProposalInput = {
  title: "",
  clientId: null,
  validUntil: null,
  scope: "",
  conditions: "",
  discountValue: 0,
  discountPercent: 0,
  items: [],
};
export function ProposalEditor({
  initial,
  clients,
  products,
}: {
  initial: Proposal | null;
  clients: Client[];
  products: Product[];
}) {
  const [meta, setMeta] = useState(initial);
  const [value, setValue] = useState<ProposalInput>(initial ?? empty);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const locked = meta && ["aceita", "cancelada"].includes(meta.status);
  const change = <K extends keyof ProposalInput>(key: K, v: ProposalInput[K]) =>
    setValue((s) => ({ ...s, [key]: v }));
  const computed = (() => {
    try {
      return totals(value.items, value.discountValue, value.discountPercent);
    } catch {
      return null;
    }
  })();
  async function save(share = false) {
    setBusy(true);
    setMessage("");
    try {
      let p = locked
        ? meta
        : await api<Proposal>(
            `/api/proposals${meta ? `/${meta.id}` : ""}`,
            value,
          );
      if (!p) return;
      if (share && ["rascunho", "recusada", "expirada"].includes(p.status))
        p = await api<Proposal>(`/api/proposals/${p.id}/send`, {});
      setMeta(p);
      setValue(p);
      window.history.replaceState(null, "", `/admin/propostas/${p.id}`);
      if (share) {
        setLink(p.publicUrl);
        try {
          await navigator.clipboard.writeText(p.publicUrl);
          setMessage("Link copiado.");
        } catch {
          setMessage("Proposta enviada. Copie o link abaixo.");
        }
      } else setMessage("Proposta salva.");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const move = (i: number, delta: number) => {
    const items = [...value.items];
    [items[i], items[i + delta]] = [items[i + delta], items[i]];
    change("items", items);
  };
  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">{meta?.code ?? "Rascunho"}</p>
          <h1>{meta ? "Proposta" : "Nova proposta"}</h1>
        </div>
        <div className="actions">
          <Link className="button" href="/admin/propostas">
            Voltar
          </Link>
          {meta ? (
            <a className="button" href={`/api/proposals/${meta.id}/pdf`}>
              PDF
            </a>
          ) : null}
          {meta?.status !== "cancelada" ? (
            <button disabled={busy} onClick={() => save(true)}>
              Enviar e copiar link
            </button>
          ) : null}
          {!locked ? (
            <button className="primary" disabled={busy} onClick={() => save()}>
              {busy ? "Salvando…" : "Salvar proposta"}
            </button>
          ) : null}
        </div>
      </header>
      <p role="status">{message}</p>
      {link ? (
        <Field
          label="Link público"
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
        />
      ) : null}
      <div className="editor-layout">
        <div>
          <fieldset disabled={busy || !!locked} className="surface form-grid">
            <legend>Dados da proposta</legend>
            <Field
              label="Título"
              value={value.title}
              maxLength={200}
              required
              onChange={(e) => change("title", e.target.value)}
            />
            <Select
              label="Cliente"
              value={value.clientId ?? ""}
              onChange={(e) =>
                change(
                  "clientId",
                  e.target.value ? Number(e.target.value) : null,
                )
              }
            >
              <option value="">Sem cliente</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Field
              label="Validade"
              type="date"
              value={value.validUntil ?? ""}
              onChange={(e) => change("validUntil", e.target.value || null)}
            />
            <Textarea
              label="Escopo"
              maxLength={20000}
              value={value.scope}
              onChange={(e) => change("scope", e.target.value)}
            />
            <Textarea
              label="Condições"
              maxLength={20000}
              value={value.conditions}
              onChange={(e) => change("conditions", e.target.value)}
            />
          </fieldset>
          <section>
            <header className="page-head">
              <h2>Itens</h2>
              <button
                disabled={busy || !!locked || value.items.length >= 100}
                onClick={() =>
                  change("items", [
                    ...value.items,
                    {
                      name: "Novo item",
                      description: "",
                      productId: null,
                      priceType: "fixo",
                      unitPrice: 0,
                      quantity: 1,
                    },
                  ])
                }
              >
                Item avulso
              </button>
            </header>
            {value.items.map((item, index) => (
              <fieldset
                key={index}
                disabled={busy || !!locked}
                className="surface item-editor"
              >
                <legend>Item {index + 1}</legend>
                <div className="form-grid">
                  <Field
                    label="Nome do item"
                    value={item.name}
                    maxLength={160}
                    onChange={(e) =>
                      change(
                        "items",
                        value.items.map((v, i) =>
                          i === index ? { ...v, name: e.target.value } : v,
                        ),
                      )
                    }
                  />
                  <Select
                    label="Tipo"
                    value={item.priceType}
                    onChange={(e) =>
                      change(
                        "items",
                        value.items.map((v, i) =>
                          i === index
                            ? {
                                ...v,
                                priceType: e.target.value as "fixo" | "hora",
                              }
                            : v,
                        ),
                      )
                    }
                  >
                    <option value="fixo">Fixo</option>
                    <option value="hora">Hora</option>
                  </Select>
                  {(["quantity", "unitPrice"] as const).map((key) => (
                    <Field
                      key={key}
                      label={
                        key === "quantity"
                          ? "Quantidade / horas"
                          : "Preço unitário (R$)"
                      }
                      type="number"
                      min={key === "quantity" ? ".01" : "0"}
                      step=".01"
                      value={item[key]}
                      onChange={(e) =>
                        change(
                          "items",
                          value.items.map((v, i) =>
                            i === index
                              ? { ...v, [key]: Number(e.target.value) }
                              : v,
                          ),
                        )
                      }
                    />
                  ))}
                  <Textarea
                    label="Descrição do item"
                    value={item.description}
                    maxLength={5000}
                    onChange={(e) =>
                      change(
                        "items",
                        value.items.map((v, i) =>
                          i === index
                            ? { ...v, description: e.target.value }
                            : v,
                        ),
                      )
                    }
                  />
                </div>
                <div className="actions">
                  <strong>
                    {computed ? money(computed.lines[index]) : "Valor inválido"}
                  </strong>
                  <button
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    aria-label={`Mover item ${index + 1} para cima`}
                  >
                    ↑
                  </button>
                  <button
                    disabled={index === value.items.length - 1}
                    onClick={() => move(index, 1)}
                    aria-label={`Mover item ${index + 1} para baixo`}
                  >
                    ↓
                  </button>
                  <button
                    onClick={() =>
                      change(
                        "items",
                        value.items.filter((_, i) => i !== index),
                      )
                    }
                  >
                    Remover item
                  </button>
                </div>
              </fieldset>
            ))}
            {!value.items.length ? (
              <p className="empty">
                Adicione um item avulso ou escolha no catálogo.
              </p>
            ) : null}
          </section>
        </div>
        <aside>
          <section className="surface">
            <h2>Catálogo</h2>
            <div className="catalog-list">
              {products
                .filter((p) => p.active)
                .map((p) => (
                  <button
                    key={p.id}
                    disabled={busy || !!locked || value.items.length >= 100}
                    onClick={() =>
                      change("items", [
                        ...value.items,
                        {
                          productId: p.id,
                          name: p.name,
                          description: p.description,
                          priceType: p.priceType,
                          unitPrice: p.price,
                          quantity: p.priceType === "hora" ? 8 : 1,
                        },
                      ])
                    }
                  >
                    {p.name} · {money(p.price)}
                  </button>
                ))}
            </div>
            {!products.some((p) => p.active) ? (
              <p>
                Catálogo vazio. <Link href="/admin/catalogo">Cadastrar</Link>
              </p>
            ) : null}
          </section>
          <fieldset disabled={busy || !!locked} className="surface form">
            <legend>Totais</legend>
            <Field
              label="Desconto (%)"
              type="number"
              min="0"
              max="100"
              step=".01"
              value={value.discountPercent}
              onChange={(e) =>
                setValue((v) => ({
                  ...v,
                  discountPercent: Number(e.target.value),
                  discountValue: 0,
                }))
              }
            />
            <Field
              label="Desconto (R$)"
              type="number"
              min="0"
              step=".01"
              value={value.discountValue}
              onChange={(e) =>
                setValue((v) => ({
                  ...v,
                  discountValue: Number(e.target.value),
                  discountPercent: 0,
                }))
              }
            />
            <p>Subtotal: {computed ? money(computed.subtotal) : "—"}</p>
            <p>Desconto: {computed ? money(computed.discount) : "—"}</p>
            <strong>
              Total: {computed ? money(computed.total) : "Valores inválidos"}
            </strong>
          </fieldset>
          <section className="surface">
            <p className="badge">{labels[meta?.status ?? "rascunho"]}</p>
            {meta?.clientResponse ? (
              <p>Resposta: {meta.clientResponse}</p>
            ) : null}
            <h2>Quem viu</h2>
            {meta?.viewers.length ? (
              <ul>
                {meta.viewers.map((v, i) => (
                  <li key={i}>
                    {v.name} · {formatDate(v.viewedAt)}{" "}
                    {v.viewedAt.slice(11, 16)}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Ainda não vista.</p>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
