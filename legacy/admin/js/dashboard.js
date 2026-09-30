import { formatMoney } from "./clients.js";

const money = formatMoney;
const statsEl = document.getElementById("dash-stats");
const statusEl = document.getElementById("dash-status");
const upcomingEl = document.getElementById("dash-upcoming");

const STATUS_LABELS = {
  orcamento: "Orçamento",
  aprovado: "Aprovado",
  em_andamento: "Em andamento",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

function levelLabel(level, days) {
  if (level === "overdue") return `atrasado ${Math.abs(days)}d`;
  if (days === 0) return "hoje";
  return `em ${days}d`;
}

async function load() {
  const res = await fetch("../api/dashboard.php", {
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });
  if (res.status === 401) {
    window.location.href = "../login/";
    return;
  }
  const data = await res.json();
  if (!data.ok) {
    statsEl.innerHTML = `<p class="panel-empty">${data.error || "Erro ao carregar."}</p>`;
    return;
  }

  const d = data.dashboard;
  statsEl.innerHTML = `
    <article class="stat-card"><strong>${d.clients}</strong><span>Clientes</span></article>
    <article class="stat-card"><strong>${d.urgent}</strong><span>Urgentes ≤7d</span></article>
    <article class="stat-card"><strong>${d.overdue}</strong><span>Atrasados</span></article>
    <article class="stat-card"><strong>${money(d.pipeline)}</strong><span>Valor vendido</span></article>
    <article class="stat-card"><strong>${d.notes}</strong><span>Notas</span></article>
  `;

  statusEl.innerHTML = Object.entries(d.byStatus)
    .map(
      ([key, count]) =>
        `<li><span>${STATUS_LABELS[key] || key}</span><strong>${count}</strong></li>`
    )
    .join("");

  if (!d.upcoming.length) {
    upcomingEl.innerHTML = `<p class="panel-empty">Nada nos próximos 30 dias.</p>`;
    return;
  }

  upcomingEl.innerHTML = d.upcoming
    .map(
      (item) => `
      <article class="agenda-item">
        <div>
          <strong>${escapeHtml(item.clientName)}</strong>
          <span>${escapeHtml(item.label)}</span>
        </div>
        <div class="agenda-meta">
          <time>${formatDate(item.date)}</time>
          <span class="badge badge-alert-${item.level}">${levelLabel(item.level, item.daysLeft)}</span>
        </div>
      </article>`
    )
    .join("");
}

function formatDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(y, m - 1, d));
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

load();
