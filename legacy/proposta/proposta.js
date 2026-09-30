const API = "../api/proposal_public.php";

const params = new URLSearchParams(window.location.search);
const token = (params.get("t") || "").replace(/[^a-f0-9]/g, "");
const storageKey = `proposta_viewer_${token}`;

const loadingEl = document.getElementById("proposta-loading");
const errorEl = document.getElementById("proposta-error");
const viewEl = document.getElementById("proposta-view");
const gateDialog = document.getElementById("gate-dialog");
const gateForm = document.getElementById("gate-form");
const gateName = document.getElementById("gate-name");
const gateError = document.getElementById("gate-error");
const gateLead = document.getElementById("gate-lead");

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

let viewerName = "";

function formatMoney(v) {
  return money.format(Number(v) || 0);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatDate(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
}

const STATUS_BANNER = {
  aceita: { text: "Proposta aceita. Obrigado!", className: "is-accepted" },
  recusada: { text: "Proposta recusada.", className: "is-declined" },
  expirada: { text: "Esta proposta expirou e não pode mais ser respondida.", className: "is-expired" },
  cancelada: { text: "Esta proposta foi cancelada.", className: "is-expired" },
};

function showError(msg) {
  loadingEl.hidden = true;
  viewEl.hidden = true;
  gateDialog.close();
  errorEl.hidden = false;
  errorEl.textContent = msg;
}

function qtyLabel(item) {
  const q = Number(item.quantity).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  if (item.priceType === "hora") {
    return `${q} h · ${formatMoney(item.unitPrice)}/h`;
  }
  const unit = Number(item.quantity) === 1 ? "unidade" : "unidades";
  return `${q} ${unit} · ${formatMoney(item.unitPrice)} cada`;
}

function render(proposal) {
  loadingEl.hidden = true;
  errorEl.hidden = true;
  viewEl.hidden = false;
  gateDialog.close();

  document.title = `${proposal.title} — Kauê Ajure`;
  document.getElementById("prop-code").textContent = proposal.code;
  document.getElementById("prop-title").textContent = proposal.title;
  document.getElementById("prop-total").textContent = formatMoney(proposal.total);

  const validEl = document.getElementById("prop-valid");
  if (proposal.validUntil) {
    validEl.hidden = false;
    validEl.textContent = `Válida até ${formatDate(proposal.validUntil)}`;
  } else {
    validEl.hidden = true;
  }

  const banner = document.getElementById("prop-banner");
  const bannerCfg = STATUS_BANNER[proposal.status];
  if (bannerCfg || proposal.isExpired) {
    banner.hidden = false;
    const cfg = bannerCfg || STATUS_BANNER.expirada;
    banner.textContent = cfg.text;
    banner.className = `proposta-status-banner ${cfg.className}`;
  } else {
    banner.hidden = true;
  }

  document.getElementById("prop-items").innerHTML = (proposal.items || [])
    .map((item) => {
      const desc = item.description
        ? `<span class="proposta-line-meta">${escapeHtml(item.description)}</span>`
        : "";
      return `<li class="proposta-line">
        <div class="proposta-line-main">
          <strong>${escapeHtml(item.name)}</strong>
          <span class="proposta-line-meta">${escapeHtml(qtyLabel(item))}</span>
          ${desc}
        </div>
        <span class="proposta-line-total">${formatMoney(item.lineTotal)}</span>
      </li>`;
    })
    .join("");

  document.getElementById("prop-subtotal").textContent = formatMoney(proposal.subtotal);

  const discRow = document.getElementById("prop-discount-row");
  const hasDisc = proposal.discountPercent > 0 || proposal.discountValue > 0;
  discRow.hidden = !hasDisc;
  if (hasDisc) {
    const amount =
      proposal.discountPercent > 0
        ? (proposal.subtotal * proposal.discountPercent) / 100
        : proposal.discountValue;
    document.getElementById("prop-discount-label").textContent =
      proposal.discountPercent > 0
        ? `Desconto (${proposal.discountPercent.toLocaleString("pt-BR")}%)`
        : "Desconto";
    document.getElementById("prop-discount").textContent = `− ${formatMoney(amount)}`;
  }

  const scopeSec = document.getElementById("prop-scope-section");
  if (proposal.scope) {
    scopeSec.hidden = false;
    document.getElementById("prop-scope").textContent = proposal.scope;
  } else {
    scopeSec.hidden = true;
  }

  const condSec = document.getElementById("prop-conditions-section");
  if (proposal.conditions) {
    condSec.hidden = false;
    document.getElementById("prop-conditions").textContent = proposal.conditions;
  } else {
    condSec.hidden = true;
  }

  document.getElementById("prop-actions").hidden = !proposal.canRespond;

  const pdf = document.getElementById("prop-pdf");
  if (proposal.pdfUrl) {
    pdf.hidden = false;
    pdf.href = proposal.pdfUrl;
  } else {
    pdf.hidden = true;
  }

  const viewerEl = document.getElementById("prop-viewer");
  if (viewerName || proposal.viewerName) {
    viewerEl.hidden = false;
    viewerEl.textContent = `Visualizando como ${viewerName || proposal.viewerName}`;
  }
}

async function openProposal(name, returning = false) {
  gateError.hidden = true;
  const body = new URLSearchParams({
    t: token,
    name,
    returning: returning ? "1" : "0",
  });
  const res = await fetch(`${API}?action=open`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.error || "Não foi possível abrir a proposta.");
  }
  viewerName = name;
  try {
    sessionStorage.setItem(storageKey, name);
  } catch {
    /* ignore */
  }
  render(data.proposal);
}

async function boot() {
  if (!token || token.length !== 64) {
    showError("Link inválido. Peça um novo link da proposta.");
    return;
  }

  try {
    const res = await fetch(`${API}?action=preview&t=${encodeURIComponent(token)}`, {
      headers: { Accept: "application/json" },
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.error || "Não foi possível carregar a proposta.");
    }

    const preview = data.preview;
    gateLead.textContent = preview.title
      ? `Para ver “${preview.title}”, diga seu nome.`
      : "Antes de abrir a proposta, diga seu nome.";

    let saved = "";
    try {
      saved = sessionStorage.getItem(storageKey) || "";
    } catch {
      saved = "";
    }

    loadingEl.hidden = true;

    if (saved) {
      await openProposal(saved, true);
      return;
    }

    gateDialog.showModal();
    gateName.focus();
  } catch (err) {
    showError(err.message || "Falha ao carregar.");
  }
}

gateForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = gateName.value.trim();
  if (name.length < 2) {
    gateError.hidden = false;
    gateError.textContent = "Digite seu nome para continuar.";
    return;
  }
  const btn = gateForm.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = "Abrindo…";
  try {
    await openProposal(name, false);
  } catch (err) {
    gateError.hidden = false;
    gateError.textContent = err.message;
  } finally {
    btn.disabled = false;
    btn.textContent = "Ver proposta";
  }
});

// Evita fechar o dialog sem nome (Esc / clique fora)
gateDialog.addEventListener("cancel", (event) => {
  event.preventDefault();
});

async function respond(action) {
  const errEl = document.getElementById("prop-action-error");
  errEl.hidden = true;
  const btnAccept = document.getElementById("prop-accept");
  const btnDecline = document.getElementById("prop-decline");
  btnAccept.disabled = true;
  btnDecline.disabled = true;

  try {
    const body = new URLSearchParams({
      t: token,
      name: viewerName,
      message: document.getElementById("prop-message").value.trim(),
    });
    const res = await fetch(`${API}?action=${action}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.error || "Não foi possível enviar a resposta.");
    }
    render(data.proposal);
  } catch (err) {
    errEl.hidden = false;
    errEl.textContent = err.message;
  } finally {
    btnAccept.disabled = false;
    btnDecline.disabled = false;
  }
}

document.getElementById("prop-accept").addEventListener("click", () => {
  if (!confirm("Confirmar aceite desta proposta?")) return;
  respond("accept");
});
document.getElementById("prop-decline").addEventListener("click", () => {
  if (!confirm("Confirmar recusa desta proposta?")) return;
  respond("decline");
});

boot();
