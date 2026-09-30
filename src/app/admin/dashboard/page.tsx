import { requirePageUser } from "@/lib/server/page-auth";
import Link from "next/link";
import { listClients } from "@/lib/server/clients";
import { rows } from "@/lib/server/db";
import { agenda } from "@/lib/domain/agenda";
import { labels } from "@/lib/domain/schemas";
import { money } from "@/lib/domain/dates";
import { Events } from "@/components/admin/agenda";
export default async function Page() {
  await requirePageUser();
  const [clients, [notes]] = await Promise.all([
    listClients(),
    rows<{ n: number }>("SELECT COUNT(*) AS n FROM notas"),
  ]);
  const events = agenda(clients);
  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Visão geral</p>
          <h1>Dashboard</h1>
        </div>
        <Link className="button" href="/admin/clientes">
          Gerenciar clientes
        </Link>
      </header>
      <div className="stats">
        {[
          [clients.length, "Clientes"],
          [notes.n, "Notas"],
          [events.filter((e) => e.daysLeft <= 7).length, "Urgentes"],
          [events.filter((e) => e.daysLeft < 0).length, "Atrasados"],
          [
            money(
              clients
                .filter((c) => c.status !== "cancelado")
                .reduce((n, c) => n + c.soldValue, 0),
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
      <section className="surface">
        <h2>Status dos clientes</h2>
        <dl className="status-list">
          {[
            "orcamento",
            "aprovado",
            "em_andamento",
            "entregue",
            "cancelado",
          ].map((s) => (
            <div key={s}>
              <dt>{labels[s]}</dt>
              <dd>{clients.filter((c) => c.status === s).length}</dd>
            </div>
          ))}
        </dl>
      </section>
      <header className="page-head">
        <h2>Próximos 30 dias e atrasados</h2>
        <Link href="/admin/agenda">Ver agenda →</Link>
      </header>
      <Events items={events.filter((e) => e.daysLeft <= 30).slice(0, 8)} />
    </>
  );
}
