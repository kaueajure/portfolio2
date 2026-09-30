import {
  STATUS_LABELS,
  PAYMENT_LABELS,
  formatMoney,
  formatDate,
  getSchedule,
  alertLabel,
  toISODate,
  MAX_DOC_BYTES,
  apiListClients,
  apiSaveClient,
  apiDeleteClient,
} from "./clients.js";

const listEl = document.getElementById("client-list");
const emptyEl = document.getElementById("client-empty");
const statsEl = document.getElementById("client-stats");
const searchEl = document.getElementById("client-search");
const statusFilterEl = document.getElementById("client-filter-status");
const dialog = document.getElementById("client-dialog");
const form = document.getElementById("client-form");
const dialogTitle = document.getElementById("client-dialog-title");
const documentCurrent = document.getElementById("document-current");
const documentInput = document.getElementById("field-document");
const saveBtn = form.querySelector('button[type="submit"]');
const statusSelect = document.getElementById("field-status");
const paymentSelect = document.getElementById("field-payment");
const soldValueInput = document.getElementById("field-sold-value");
const installmentCountInput = document.getElementById("field-installment-count");
const installmentValueInput = document.getElementById("field-installment-value");
const installmentHint = document.getElementById("installment-hint");

/** @type {Array<Record<string, any>>} */
let clients = [];
/** @type {File | null} */
let pendingFile = null;
/** @type {null | { name: string, url: string }} */
let existingDocument = null;
let removeDocument = false;
let saving = false;
let installmentManual = false;

const STATUS_REQUIRED = {
  orcamento: ["quoteValidUntil"],
  aprovado: ["approvalDate"],
  em_andamento: ["deliveryForecast"],
  entregue: ["deliveryDate"],
  cancelado: ["cancelReason"],
};

const PAYMENT_REQUIRED = {
  a_vista: [],
  mensal: ["monthlyValue", "dueDay", "monthlyStartDate"],
  parcelas: ["installmentCount", "installmentValue", "firstInstallmentDate"],
};

function setFieldValue(name, value) {
  const el = form.elements.namedItem(name);
  if (!el || !("value" in el)) return;
  el.value = value == null ? "" : String(value);
}

function openDialog(client = null) {
  form.reset();
  pendingFile = null;
  removeDocument = false;
  installmentManual = false;
  existingDocument = client?.document
    ? { name: client.document.name, url: client.document.url }
    : null;

  if (client) {
    dialogTitle.textContent = "Editar cliente";
    setFieldValue("id", client.id);
    setFieldValue("name", client.name);
    setFieldValue("phone", client.phone);
    setFieldValue("email", client.email);
    setFieldValue("purchaseDate", client.purchaseDate);
    setFieldValue("budgetValue", client.budgetValue);
    setFieldValue("soldValue", client.soldValue);
    setFieldValue("status", client.status);
    setFieldValue("paymentMethod", client.paymentMethod);
    setFieldValue("cashPaymentDate", client.cashPaymentDate);
    setFieldValue("monthlyValue", client.monthlyValue);
    setFieldValue("dueDay", client.dueDay);
    setFieldValue("monthlyStartDate", client.monthlyStartDate);
    setFieldValue("installmentCount", client.installmentCount);
    setFieldValue("installmentValue", client.installmentValue);
    setFieldValue("firstInstallmentDate", client.firstInstallmentDate);
    setFieldValue("installmentsPaid", client.installmentsPaid ?? 0);
    setFieldValue("quoteValidUntil", client.quoteValidUntil);
    setFieldValue("approvalDate", client.approvalDate);
    setFieldValue("deliveryForecast", client.deliveryForecast);
    setFieldValue("deliveryDate", client.deliveryDate);
    setFieldValue("cancelReason", client.cancelReason);
    setFieldValue("maintenanceDays", client.maintenanceDays);
    setFieldValue("renewalDays", client.renewalDays);
    setFieldValue("notes", client.notes);
    if (client.installmentValue != null) installmentManual = true;
  } else {
    dialogTitle.textContent = "Novo cliente";
    setFieldValue("id", "");
    setFieldValue("purchaseDate", toISODate(new Date()));
    setFieldValue("maintenanceDays", 90);
    setFieldValue("renewalDays", 365);
    setFieldValue("status", "orcamento");
    setFieldValue("paymentMethod", "a_vista");
    setFieldValue("installmentsPaid", 0);
  }

  syncReveals();
  maybeAutoInstallment();
  renderDocumentSlot();
  dialog.showModal();
  const nameInput = form.elements.namedItem("name");
  if (nameInput instanceof HTMLInputElement) nameInput.focus();
}

function closeDialog() {
  if (dialog.open) dialog.close();
}

function syncReveals() {
  const status = statusSelect.value;
  const payment = paymentSelect.value;

  form.querySelectorAll("[data-reveal]").forEach((block) => {
    const rule = block.getAttribute("data-reveal") || "";
    const [kind, value] = rule.split(":");
    const show =
      (kind === "status" && value === status) ||
      (kind === "payment" && value === payment);
    block.hidden = !show;

    block.querySelectorAll("input, select, textarea").forEach((input) => {
      if (!(input instanceof HTMLInputElement || input instanceof HTMLSelectElement || input instanceof HTMLTextAreaElement)) {
        return;
      }
      const requiredList =
        kind === "status"
          ? STATUS_REQUIRED[status] || []
          : PAYMENT_REQUIRED[payment] || [];
      const shouldRequire = show && requiredList.includes(input.name);
      input.required = shouldRequire;
      if (!show) {
        input.required = false;
      }
    });
  });
}

function maybeAutoInstallment() {
  if (paymentSelect.value !== "parcelas" || installmentManual) return;
  const sold = Number(soldValueInput.value);
  const count = Number(installmentCountInput.value);
  if (!sold || !count || count < 2) return;
  const value = Math.round((sold / count) * 100) / 100;
  installmentValueInput.value = String(value);
  if (installmentHint) {
    installmentHint.textContent = `Sugerido: ${formatMoney(sold)} ÷ ${count} = ${formatMoney(value)}`;
  }
}

function renderDocumentSlot() {
  if (pendingFile) {
    documentCurrent.hidden = false;
    documentCurrent.innerHTML = `
      <span>${escapeHtml(pendingFile.name)} <small>(novo)</small></span>
      <button type="button" class="btn btn-ghost" data-clear-doc style="min-height:2rem;padding:0.3rem 0.7rem;font-size:0.75rem">Remover</button>
    `;
  } else if (!removeDocument && existingDocument) {
    documentCurrent.hidden = false;
    documentCurrent.innerHTML = `
      <span>${escapeHtml(existingDocument.name)}</span>
      <span class="badge-row">
        <a href="${escapeAttr(existingDocument.url)}" download>Baixar</a>
        <button type="button" class="btn btn-ghost" data-clear-doc style="min-height:2rem;padding:0.3rem 0.7rem;font-size:0.75rem">Remover</button>
      </span>
    `;
  } else {
    documentCurrent.hidden = true;
    documentCurrent.innerHTML = "";
    return;
  }

  documentCurrent.querySelector("[data-clear-doc]")?.addEventListener("click", () => {
    pendingFile = null;
    existingDocument = null;
    removeDocument = true;
    documentInput.value = "";
    renderDocumentSlot();
  });
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(str) {
  return escapeHtml(str).replaceAll("'", "&#39;");
}

function filteredClients() {
  const q = (searchEl.value || "").trim().toLowerCase();
  const status = statusFilterEl.value;

  return clients.filter((client) => {
    if (status && client.status !== status) return false;
    if (!q) return true;
    return (
      String(client.name).toLowerCase().includes(q) ||
      String(client.phone).toLowerCase().includes(q) ||
      String(client.email || "").toLowerCase().includes(q)
    );
  });
}

function renderStats(list) {
  const urgent = list.filter((c) => {
    const s = getSchedule(c);
    return (
      s.maintenanceAlert === "7" ||
      s.maintenanceAlert === "overdue" ||
      s.renewalAlert === "7" ||
      s.renewalAlert === "overdue"
    );
  }).length;

  const pipeline = list
    .filter((c) => c.status !== "cancelado")
    .reduce((sum, c) => sum + Number(c.soldValue || 0), 0);

  const active = list.filter((c) =>
    ["aprovado", "em_andamento", "entregue"].includes(c.status)
  ).length;

  statsEl.innerHTML = `
    <article class="stat-card"><strong>${list.length}</strong><span>Clientes</span></article>
    <article class="stat-card"><strong>${active}</strong><span>Ativos</span></article>
    <article class="stat-card"><strong>${urgent}</strong><span>Urgentes ≤7d</span></article>
    <article class="stat-card"><strong>${formatMoney(pipeline)}</strong><span>Valor vendido</span></article>
  `;
}

function badgeAlert(level, label) {
  if (!level) return "";
  return `<span class="badge badge-alert-${level}">${escapeHtml(label)}</span>`;
}

function paymentSummary(client) {
  if (client.paymentMethod === "parcelas" && client.installmentCount) {
    const paid = client.installmentsPaid ?? 0;
    return `${paid}/${client.installmentCount} parcelas · ${formatMoney(client.installmentValue)}`;
  }
  if (client.paymentMethod === "mensal" && client.monthlyValue != null) {
    return `Mensal ${formatMoney(client.monthlyValue)} · dia ${client.dueDay}`;
  }
  if (client.paymentMethod === "a_vista" && client.cashPaymentDate) {
    return `À vista em ${formatDate(client.cashPaymentDate)}`;
  }
  return PAYMENT_LABELS[client.paymentMethod] || client.paymentMethod;
}

function statusSummary(client) {
  if (client.status === "orcamento" && client.quoteValidUntil) {
    return `Válido até ${formatDate(client.quoteValidUntil)}`;
  }
  if (client.status === "aprovado" && client.approvalDate) {
    return `Aprovado em ${formatDate(client.approvalDate)}`;
  }
  if (client.status === "em_andamento" && client.deliveryForecast) {
    return `Entrega prevista ${formatDate(client.deliveryForecast)}`;
  }
  if (client.status === "entregue" && client.deliveryDate) {
    return `Entregue em ${formatDate(client.deliveryDate)}`;
  }
  if (client.status === "cancelado" && client.cancelReason) {
    return `Motivo: ${client.cancelReason}`;
  }
  return "";
}

function renderList() {
  const list = filteredClients();
  renderStats(clients);

  if (!clients.length) {
    listEl.innerHTML = "";
    emptyEl.hidden = false;
    return;
  }

  emptyEl.hidden = true;

  if (!list.length) {
    listEl.innerHTML = `<p class="panel-empty">Nenhum cliente encontrado com esses filtros.</p>`;
    return;
  }

  listEl.innerHTML = list
    .map((client) => {
      const schedule = getSchedule(client);
      const discount =
        Number(client.budgetValue) > Number(client.soldValue)
          ? Number(client.budgetValue) - Number(client.soldValue)
          : 0;

      const maintLabel = alertLabel("Manutenção", schedule.maintenanceLeft);
      const renewLabel = alertLabel("Renovação", schedule.renewalLeft);
      const statusExtra = statusSummary(client);
      const payExtra = paymentSummary(client);

      const docBtn = client.document
        ? `<a class="btn btn-ghost" href="${escapeAttr(client.document.url)}" download="${escapeAttr(client.document.name)}">Baixar orçamento</a>`
        : `<span class="btn btn-ghost" style="opacity:0.45;pointer-events:none">Sem documento</span>`;

      return `
        <article class="client-card" data-id="${escapeAttr(client.id)}">
          <div>
            <div class="client-card-head">
              <h3>${escapeHtml(client.name)}</h3>
              <span class="badge badge-status-${escapeAttr(client.status)}">${STATUS_LABELS[client.status] || client.status}</span>
            </div>
            <div class="client-meta">
              <span>${client.phone ? `Tel. <strong>${escapeHtml(client.phone)}</strong>` : `<strong>Sem telefone</strong>`}${client.email ? ` · ${escapeHtml(client.email)}` : ""}</span>
              <span>Compra <strong>${formatDate(client.purchaseDate)}</strong> · ${escapeHtml(payExtra)}</span>
              <span>Orçamento <strong>${formatMoney(client.budgetValue)}</strong> → vendido <strong>${formatMoney(client.soldValue)}</strong>${
                discount > 0
                  ? ` <em style="color:var(--muted);font-style:normal">(−${formatMoney(discount)})</em>`
                  : ""
              }</span>
              ${statusExtra ? `<p class="client-extra">${escapeHtml(statusExtra)}</p>` : ""}
            </div>
          </div>

          <div class="client-dates">
            <div class="date-row">
              <span class="label">Próxima manutenção</span>
              <span class="value">${formatDate(toISODate(schedule.maintenanceDate))}</span>
              <div class="badge-row">${badgeAlert(schedule.maintenanceAlert, maintLabel)}</div>
            </div>
            <div class="date-row">
              <span class="label">Próxima renovação</span>
              <span class="value">${formatDate(toISODate(schedule.renewalDate))}</span>
              <div class="badge-row">${badgeAlert(schedule.renewalAlert, renewLabel)}</div>
            </div>
          </div>

          <div class="client-actions">
            ${docBtn}
            <button class="btn btn-ghost" type="button" data-edit>Editar</button>
            <button class="btn btn-ghost btn-danger" type="button" data-delete>Excluir</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function showLoadError(message) {
  emptyEl.hidden = true;
  listEl.innerHTML = `<p class="panel-empty">${escapeHtml(message)}</p>`;
  statsEl.innerHTML = "";
}

async function refreshClients() {
  try {
    clients = await apiListClients();
    renderList();
  } catch (err) {
    clients = [];
    showLoadError(err.message || "Erro ao carregar clientes.");
  }
}

function appendIfValue(formData, key, value) {
  if (value === undefined || value === null) return;
  const str = String(value).trim();
  if (str === "") return;
  formData.append(key, str);
}

async function handleSubmit(event) {
  event.preventDefault();
  if (saving) return;

  const idEl = form.elements.namedItem("id");
  const currentId = idEl && "value" in idEl ? String(idEl.value) : "";
  const isEdit = Boolean(currentId);
  const formData = new FormData();

  if (isEdit) formData.append("id", currentId);

  const keys = [
    "name",
    "phone",
    "email",
    "purchaseDate",
    "budgetValue",
    "soldValue",
    "status",
    "paymentMethod",
    "cashPaymentDate",
    "monthlyValue",
    "dueDay",
    "monthlyStartDate",
    "installmentCount",
    "installmentValue",
    "firstInstallmentDate",
    "installmentsPaid",
    "quoteValidUntil",
    "approvalDate",
    "deliveryForecast",
    "deliveryDate",
    "cancelReason",
    "maintenanceDays",
    "renewalDays",
    "notes",
  ];

  keys.forEach((key) => {
    const el = form.elements.namedItem(key);
    if (!el || !("value" in el)) return;
    appendIfValue(formData, key, el.value);
  });

  // Campos obrigatórios condicionais sempre enviados quando o bloco está ativo
  const status = statusSelect.value;
  const payment = paymentSelect.value;
  (STATUS_REQUIRED[status] || []).forEach((key) => {
    const el = form.elements.namedItem(key);
    if (el && "value" in el) formData.set(key, el.value);
  });
  (PAYMENT_REQUIRED[payment] || []).forEach((key) => {
    const el = form.elements.namedItem(key);
    if (el && "value" in el) formData.set(key, el.value);
  });
  if (payment === "parcelas") {
    const paidEl = form.elements.namedItem("installmentsPaid");
    formData.set(
      "installmentsPaid",
      paidEl && "value" in paidEl ? String(paidEl.value || "0") : "0"
    );
  }

  if (pendingFile) {
    formData.append("document", pendingFile);
  }
  if (removeDocument && !pendingFile) {
    formData.append("removeDocument", "1");
  }

  saving = true;
  saveBtn.disabled = true;
  saveBtn.textContent = "Salvando…";

  try {
    await apiSaveClient(formData, { isEdit });
    closeDialog();
    await refreshClients();
  } catch (err) {
    alert(err.message || "Erro ao salvar.");
  } finally {
    saving = false;
    saveBtn.disabled = false;
    saveBtn.textContent = "Salvar cliente";
  }
}

document.querySelectorAll("[data-open-client-form]").forEach((btn) => {
  btn.addEventListener("click", () => openDialog());
});

document.querySelectorAll("[data-close-dialog]").forEach((btn) => {
  btn.addEventListener("click", () => closeDialog());
});

dialog.addEventListener("click", (event) => {
  if (event.target === dialog) closeDialog();
});

form.addEventListener("submit", handleSubmit);

statusSelect.addEventListener("change", syncReveals);
paymentSelect.addEventListener("change", () => {
  installmentManual = false;
  syncReveals();
  maybeAutoInstallment();
});

soldValueInput.addEventListener("input", maybeAutoInstallment);
installmentCountInput.addEventListener("input", () => {
  installmentManual = false;
  maybeAutoInstallment();
});
installmentValueInput.addEventListener("input", () => {
  installmentManual = true;
});

documentInput.addEventListener("change", () => {
  const file = documentInput.files?.[0];
  if (!file) return;

  if (file.size > MAX_DOC_BYTES) {
    alert("Arquivo muito grande. Máximo: 20 MB.");
    documentInput.value = "";
    return;
  }

  pendingFile = file;
  removeDocument = false;
  renderDocumentSlot();
});

listEl.addEventListener("click", async (event) => {
  const card = event.target.closest(".client-card");
  if (!card) return;
  const id = Number(card.dataset.id);
  const client = clients.find((c) => Number(c.id) === id);
  if (!client) return;

  if (event.target.closest("[data-edit]")) {
    openDialog(client);
    return;
  }

  if (event.target.closest("[data-delete]")) {
    const ok = confirm(`Excluir o cliente “${client.name}”?`);
    if (!ok) return;
    try {
      await apiDeleteClient(id);
      await refreshClients();
    } catch (err) {
      alert(err.message || "Erro ao excluir.");
    }
  }
});

searchEl.addEventListener("input", renderList);
statusFilterEl.addEventListener("change", renderList);

refreshClients();
