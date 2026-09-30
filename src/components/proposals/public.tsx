"use client";
import { useState, useEffect } from "react";
import type { PublicProposal } from "@/lib/server/proposals";
import { api } from "@/lib/client";
import { money, formatDate } from "@/lib/domain/dates";
import { labels } from "@/lib/domain/schemas";
import { Field, Textarea } from "@/components/ui/fields";
import { Confirm } from "@/components/ui/dialog";
export function PublicView({
  token,
  preview,
}: {
  token: string;
  preview: {
    code: string;
    title: string;
    status: string;
    validUntil: string | null;
  };
}) {
  const [proposal, setProposal] = useState<PublicProposal | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [action, setAction] = useState<"accept" | "decline" | null>(null);
  useEffect(() => {
    let live = true;
    api<PublicProposal>(`/api/public/${token}/full`)
      .then((p) => {
        if (live) setProposal(p);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [token]);
  return (
    <>
      <header>
        <p className="eyebrow">Proposta comercial · {preview.code}</p>
        <h1>{preview.title}</h1>
        <p>
          Validade: {formatDate(proposal?.validUntil ?? preview.validUntil)} ·{" "}
          {labels[proposal?.status ?? preview.status]}
        </p>
      </header>
      {!proposal ? (
        <section className="surface">
          <h2>Como podemos te chamar?</h2>
          <p>
            Informe seu nome para abrir a proposta. A visualização será
            registrada.
          </p>
          <form
            className="form"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              try {
                setProposal(
                  await api<PublicProposal>(`/api/public/${token}/open`, {
                    name,
                  }),
                );
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <Field
              label="Seu nome"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              minLength={2}
              maxLength={120}
              required
            />
            <p role="alert">{error}</p>
            <button className="primary" disabled={busy}>
              {busy ? "Abrindo…" : "Ver proposta"}
            </button>
          </form>
        </section>
      ) : (
        <>
          <section className="proposal-total">
            <span>Total</span>
            <strong>{money(proposal.total)}</strong>
          </section>
          <section className="surface">
            <h2>O que está incluso</h2>
            {proposal.items.map((i, index) => (
              <article className="proposal-line" key={index}>
                <div>
                  <h3>{i.name}</h3>
                  <p className="prewrap">{i.description}</p>
                  <p>
                    {i.quantity.toLocaleString("pt-BR")}{" "}
                    {i.priceType === "hora" ? "horas" : "unidades"} ·{" "}
                    {money(i.unitPrice)} cada
                  </p>
                </div>
                <strong>{money(i.lineTotal)}</strong>
              </article>
            ))}
            <div className="totals">
              <p>Subtotal: {money(proposal.subtotal)}</p>
              <p>
                Desconto
                {proposal.discountPercent
                  ? ` (${proposal.discountPercent}%)`
                  : ""}
                : {money(Number(proposal.subtotal) - Number(proposal.total))}
              </p>
              <strong>Total: {money(proposal.total)}</strong>
            </div>
          </section>
          {[
            ["Escopo", proposal.scope],
            ["Condições", proposal.conditions],
          ].map(([label, text]) =>
            text ? (
              <section className="surface" key={label}>
                <h2>{label}</h2>
                <p className="prewrap">{text}</p>
              </section>
            ) : null,
          )}
          {proposal.canRespond ? (
            <section className="surface form">
              <h2>Sua resposta</h2>
              <Textarea
                label="Mensagem (opcional)"
                value={message}
                maxLength={2000}
                onChange={(e) => setMessage(e.target.value)}
              />
              <div className="actions">
                <button disabled={busy} onClick={() => setAction("decline")}>
                  Recusar
                </button>
                <button
                  className="primary"
                  disabled={busy}
                  onClick={() => setAction("accept")}
                >
                  Aceitar proposta
                </button>
              </div>
            </section>
          ) : (
            <p className="surface" role="status">
              {proposal.status === "aceita"
                ? "Proposta aceita. Obrigado!"
                : proposal.status === "recusada"
                  ? "Proposta recusada."
                  : "Esta proposta expirou e não pode mais ser respondida."}
            </p>
          )}
          <a className="button" href={`/api/public/${token}/pdf`}>
            Baixar PDF
          </a>
          {action ? (
            <Confirm
              title={
                action === "accept"
                  ? "Aceitar esta proposta?"
                  : "Recusar esta proposta?"
              }
              busy={busy}
              onClose={() => setAction(null)}
              onConfirm={async () => {
                setBusy(true);
                setError("");
                try {
                  setProposal(
                    await api<PublicProposal>(`/api/public/${token}/respond`, {
                      action,
                      message,
                    }),
                  );
                  setAction(null);
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
      )}
    </>
  );
}
