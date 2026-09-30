import { formatMoney } from "./clients.js";
import { bindProductsDialog, loadProductsAdmin } from "./products.js";

const API = "../api/proposals.php";

const STATUS_LABELS = {
  rascunho: "Rascunho",
  enviada: "Enviada",
  visualizada: "Visualizada",
  aceita: "Aceita",
  recusada: "Recusada",
  expirada: "Expirada",
  cancelada: "Cancelada",
};

const listEl = document.getElementById("proposals-list");
const emptyEl = document.getElementById("proposals-empty");
const searchEl = document.getElementById("proposal-search");
const statusEl = document.getElementById("proposal-filter-status");

let proposals = [];

function csrf() {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "";
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR").format(new Date(y, m - 1, d));
}

function publicAbsoluteUrl(token) {
  const base = `${window.location.origin}${window.location.pathname.replace(/\/admin\/.*$/, "")}`;
  return `${base}/proposta/?t=${encodeURIComponent(token)}`;
}

function filtered() {
  const q = searchEl.value.trim().toLowerCase();
  const st = statusEl.value;
  return proposals.filter((p) => {
    if (st && p.status !== st) return false;
    if (!q) return true;
    const hay = `${p.code} ${p.title} ${p.clientName || ""}`.toLowerCase();
    return hay.includes(q);
  });
}

function render() {
  const items = filtered();
  if (!items.length) {
    listEl.innerHTML = "";
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;
  listEl.innerHTML = items
    .map((p) => {
      const canLink = p.publicToken && p.status !== "cancelada";
      return `<article class="proposal-card" data-id="${p.id}">
        <div class="proposal-card-main">
          <div class="proposal-card-head">
            <strong>${escapeHtml(p.title)}</strong>
            <span class="badge badge-proposal-${escapeHtml(p.status)}">${STATUS_LABELS[p.status] || p.status}</span>
          </div>
          <div class="proposal-card-meta">
            <span>${escapeHtml(p.code)}</span>
            ${p.clientName ? `<span>${escapeHtml(p.clientName)}</span>` : ""}
            <span>Validade ${formatDate(p.validUntil)}</span>
            ${p.viewerCount ? `<span>Visto por ${escapeHtml(p.lastViewer || "—")}${p.viewerCount > 1 ? ` +${p.viewerCount - 1}` : ""}</span>` : `<span>Ainda não vista</span>`}
          </div>
        </div>
        <div class="proposal-card-side">
          <strong>${formatMoney(p.total)}</strong>
          <div class="proposal-card-actions">
            <a class="btn btn-ghost" href="proposta-editar.php?id=${p.id}">Abrir</a>
            ${canLink ? `<button class="btn btn-ghost" type="button" data-copy>Copiar link</button>` : ""}
            <button class="btn btn-ghost" type="button" data-duplicate>Duplicar</button>
            <a class="btn btn-ghost" href="${API}?action=pdf&id=${p.id}" target="_blank" rel="noopener">PDF</a>
            ${p.status !== "aceita" && p.status !== "cancelada" ? `<button class="btn btn-ghost btn-danger" type="button" data-cancel>Cancelar</button>` : ""}
            ${p.status === "rascunho" || p.status === "cancelada" ? `<button class="btn btn-ghost btn-danger" type="button" data-delete>Excluir</button>` : ""}
          </div>
        </div>
      </article>`;
    })
    .join("");
}

async function parseJson(res) {
  try {
    return await res.json();
  } catch {
    return { ok: false, error: "Resposta inválida." };
  }
}

async function post(action, fields = {}) {
  const body = new URLSearchParams({ action, csrf: csrf(), ...fields });
  const res = await fetch(API, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      "X-CSRF-Token": csrf(),
    },
    body,
    credentials: "same-origin",
  });
  if (res.status === 401) {
    window.location.href = "../login/";
    return { ok: false };
  }
  return parseJson(res);
}

async function load() {
  const qs = new URLSearchParams();
  if (statusEl.value) qs.set("status", statusEl.value);
  if (searchEl.value.trim()) qs.set("q", searchEl.value.trim());
  const res = await fetch(`${API}?${qs}`, {
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });
  if (res.status === 401) {
    window.location.href = "../login/";
    return;
  }
  const data = await parseJson(res);
  if (!data.ok) {
    listEl.innerHTML = `<p class="panel-empty">${escapeHtml(data.error || "Erro")}</p>`;
    return;
  }
  proposals = data.proposals || [];
  render();
}

let searchTimer;
searchEl.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(load, 250);
});
statusEl.addEventListener("change", load);

listEl.addEventListener("click", async (event) => {
  const card = event.target.closest(".proposal-card");
  if (!card) return;
  const id = card.dataset.id;
  const proposal = proposals.find((p) => String(p.id) === String(id));
  if (!proposal) return;

  if (event.target.closest("[data-copy]")) {
    // Libera o link se ainda for rascunho e copia — sem passo extra
    if (["rascunho", "recusada", "expirada"].includes(proposal.status)) {
      const data = await post("send", { id: String(id) });
      if (!data.ok) {
        alert(data.error || "Não foi possível liberar o link.");
        return;
      }
      proposal.status = data.proposal.status;
      proposal.publicToken = data.proposal.publicToken;
      await load();
    }
    const url = publicAbsoluteUrl(proposal.publicToken);
    try {
      await navigator.clipboard.writeText(url);
      alert("Link copiado. Já pode enviar ao cliente.");
    } catch {
      prompt("Copie o link:", url);
    }
    return;
  }
  if (event.target.closest("[data-duplicate]")) {
    const data = await post("duplicate", { id: String(id) });
    if (!data.ok) {
      alert(data.error || "Erro ao duplicar");
      return;
    }
    window.location.href = `proposta-editar.php?id=${data.proposal.id}`;
    return;
  }
  if (event.target.closest("[data-cancel]")) {
    if (!confirm("Cancelar esta proposta?")) return;
    const data = await post("cancel", { id: String(id) });
    if (!data.ok) {
      alert(data.error || "Erro ao cancelar");
      return;
    }
    await load();
    return;
  }
  if (event.target.closest("[data-delete]")) {
    if (!confirm("Excluir permanentemente?")) return;
    const data = await post("delete", { id: String(id) });
    if (!data.ok) {
      alert(data.error || "Erro ao excluir");
      return;
    }
    await load();
  }
});

bindProductsDialog();
load();
loadProductsAdmin();
