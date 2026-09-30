"use client";
import { useState } from "react";
import { api } from "@/lib/client";
import type { Client, Note, Product } from "@/lib/domain/schemas";
import { money, formatDate } from "@/lib/domain/dates";
import { Field, Select, Textarea } from "@/components/ui/fields";
import { Dialog, Confirm } from "@/components/ui/dialog";
export function Notes({
  initial,
  clients,
}: {
  initial: Note[];
  clients: Client[];
}) {
  const [notes, setNotes] = useState(initial);
  const [edit, setEdit] = useState<Note | null | undefined>();
  const [remove, setRemove] = useState<Note | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const refresh = async () => setNotes(await api<Note[]>("/api/notes"));
  return (
    <>
      <header className="page-head">
        <h1>Notas</h1>
        <button
          className="primary"
          onClick={() => {
            setEdit(null);
            setError("");
          }}
        >
          Nova nota
        </button>
      </header>
      <div className="card-grid">
        {notes.map((n) => (
          <article key={n.id} className="surface">
            <h2>{n.title}</h2>
            <p>
              {n.clientName} · {formatDate(n.updatedAt)}
            </p>
            <p className="prewrap">{n.content}</p>
            <div className="actions">
              <button
                onClick={() => {
                  setEdit(n);
                  setError("");
                }}
              >
                Editar
              </button>
              <button onClick={() => setRemove(n)}>Excluir</button>
            </div>
          </article>
        ))}
      </div>
      {!notes.length ? (
        <p className="empty">Nenhuma nota. Crie a primeira.</p>
      ) : null}
      <p role="status">{error}</p>
      {edit !== undefined ? (
        <Dialog
          title={edit ? "Editar nota" : "Nova nota"}
          onClose={() => setEdit(undefined)}
          busy={busy}
        >
          <form
            className="form"
            onSubmit={async (e) => {
              e.preventDefault();
              const v = Object.fromEntries(new FormData(e.currentTarget));
              setBusy(true);
              try {
                await api(`/api/notes${edit ? `/${edit.id}` : ""}`, v);
                await refresh();
                setEdit(undefined);
                setError("Nota salva.");
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <Field
              label="Título"
              name="title"
              defaultValue={edit?.title}
              required
              maxLength={160}
            />
            <Select
              label="Cliente (opcional)"
              name="clientId"
              defaultValue={edit?.clientId ?? ""}
            >
              <option value="">Sem cliente</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Textarea
              label="Conteúdo"
              name="content"
              defaultValue={edit?.content}
              required
              maxLength={20000}
            />
            <p role="alert">{error}</p>
            <button className="primary" disabled={busy}>
              {busy ? "Salvando…" : "Salvar nota"}
            </button>
          </form>
        </Dialog>
      ) : null}
      {remove ? (
        <Confirm
          title={`Excluir ${remove.title}?`}
          busy={busy}
          onClose={() => setRemove(null)}
          onConfirm={async () => {
            setBusy(true);
            try {
              await api(`/api/notes/${remove.id}/delete`, {});
              await refresh();
              setRemove(null);
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <p role="alert">{error}</p>
        </Confirm>
      ) : null}
    </>
  );
}
export function Catalog({ initial }: { initial: Product[] }) {
  const [products, setProducts] = useState(initial);
  const [edit, setEdit] = useState<Product | null | undefined>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const refresh = async () =>
    setProducts(await api<Product[]>("/api/products"));
  const move = async (index: number, delta: number) => {
    const copy = [...products];
    [copy[index], copy[index + delta]] = [copy[index + delta], copy[index]];
    setBusy(true);
    try {
      await api("/api/products/reorder", { ids: copy.map((p) => p.id) });
      await refresh();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <header className="page-head">
        <h1>Catálogo</h1>
        <button
          className="primary"
          onClick={() => {
            setEdit(null);
            setMessage("");
          }}
        >
          Novo produto ou serviço
        </button>
      </header>
      <p role="status">{message}</p>
      <div className="record-list">
        {products.map((p, i) => (
          <article className="surface record" key={p.id}>
            <div>
              <h2>{p.name}</h2>
              <p>
                {money(p.price)}
                {p.priceType === "hora" ? " / hora" : ""} ·{" "}
                {p.active ? "Ativo" : "Inativo"}
              </p>
              <p>{p.description}</p>
            </div>
            <div className="actions">
              <button
                disabled={busy || i === 0}
                onClick={() => move(i, -1)}
                aria-label={`Mover ${p.name} para cima`}
              >
                ↑
              </button>
              <button
                disabled={busy || i === products.length - 1}
                onClick={() => move(i, 1)}
                aria-label={`Mover ${p.name} para baixo`}
              >
                ↓
              </button>
              <button
                disabled={busy}
                onClick={() => {
                  setEdit(p);
                  setMessage("");
                }}
              >
                Editar
              </button>
              {p.active ? (
                <button
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await api(`/api/products/${p.id}/deactivate`, {});
                      await refresh();
                    } catch (e) {
                      setMessage((e as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Desativar
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
      {!products.length ? (
        <p className="empty">Catálogo vazio. Cadastre um produto ou serviço.</p>
      ) : null}
      {edit !== undefined ? (
        <Dialog
          title={edit ? "Editar produto" : "Novo produto"}
          onClose={() => setEdit(undefined)}
          busy={busy}
        >
          <form
            className="form"
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const v = {
                ...Object.fromEntries(f),
                active: f.get("active") === "on",
              };
              setBusy(true);
              try {
                await api(`/api/products${edit ? `/${edit.id}` : ""}`, v);
                await refresh();
                setEdit(undefined);
                setMessage("Produto salvo.");
              } catch (e) {
                setMessage((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <Field
              label="Nome"
              name="name"
              maxLength={160}
              defaultValue={edit?.name}
              required
            />
            <Select
              label="Tipo de preço"
              name="priceType"
              defaultValue={edit?.priceType ?? "fixo"}
            >
              <option value="fixo">Preço fixo</option>
              <option value="hora">Por hora</option>
            </Select>
            <Field
              label="Preço (R$)"
              name="price"
              type="number"
              min="0"
              step="0.01"
              max="99999999.99"
              defaultValue={edit?.price ?? 0}
              required
            />
            <Textarea
              label="Descrição"
              name="description"
              maxLength={5000}
              defaultValue={edit?.description}
            />
            <Field
              label="Ordem"
              name="order"
              type="number"
              min="0"
              defaultValue={edit?.order ?? 0}
            />
            <label>
              <input
                type="checkbox"
                name="active"
                defaultChecked={edit?.active ?? true}
              />{" "}
              Ativo
            </label>
            <p role="alert">{message}</p>
            <button disabled={busy} className="primary">
              {busy ? "Salvando…" : "Salvar produto"}
            </button>
          </form>
        </Dialog>
      ) : null}
    </>
  );
}
