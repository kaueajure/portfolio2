import { formatMoney } from "./clients.js";

const API = "../api/proposals.php";
const PRODUCTS_API = "../api/products.php";
const CLIENTS_API = "../api/clients.php";

const idField = document.getElementById("proposal-id");
const statusEl = document.getElementById("edit-status");
const itemsList = document.getElementById("items-list");
const itemsEmpty = document.getElementById("items-empty");
const catalogList = document.getElementById("catalog-list");

let items = [];
let products = [];
let proposalMeta = { status: "rascunho", publicToken: null, code: null };

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

function setStatus(msg, isError = false) {
  statusEl.textContent = msg || "";
  statusEl.style.color = isError ? "#9a3030" : "";
}

function computeLive() {
  let subtotal = 0;
  for (const item of items) {
    subtotal += Number(item.unitPrice) * Number(item.quantity);
  }
  subtotal = Math.round(subtotal * 100) / 100;
  let pct = Math.max(0, Number(document.getElementById("field-discount-percent").value) || 0);
  let val = Math.max(0, Number(document.getElementById("field-discount-value").value) || 0);
  let discount = 0;
  if (pct > 0) {
    discount = Math.round(subtotal * (pct / 100) * 100) / 100;
  } else {
    discount = Math.min(val, subtotal);
  }
  const total = Math.max(0, Math.round((subtotal - discount) * 100) / 100);
  document.getElementById("live-subtotal").textContent = formatMoney(subtotal);
  document.getElementById("live-discount").textContent = formatMoney(discount);
  document.getElementById("live-total").textContent = formatMoney(total);
  document.getElementById("live-status").textContent = proposalMeta.status || "rascunho";
  return { subtotal, discount, total, pct, val };
}

function renderItems() {
  if (!items.length) {
    itemsList.innerHTML = "";
    itemsEmpty.hidden = false;
    computeLive();
    return;
  }
  itemsEmpty.hidden = true;
  itemsList.innerHTML = items
    .map((item, index) => {
      const unitLabel = item.priceType === "hora" ? "R$/h" : "R$";
      const qtyLabel = item.priceType === "hora" ? "Horas" : "Qtd";
      return `<article class="proposal-item-row" data-index="${index}">
        <div class="proposal-item-fields">
          <label class="field">
            <span>Nome</span>
            <input type="text" data-field="name" value="${escapeHtml(item.name)}" maxlength="160">
          </label>
          <label class="field">
            <span>Tipo</span>
            <select data-field="priceType">
              <option value="fixo" ${item.priceType === "fixo" ? "selected" : ""}>Fixo</option>
              <option value="hora" ${item.priceType === "hora" ? "selected" : ""}>Hora</option>
            </select>
          </label>
          <label class="field">
            <span>${qtyLabel}</span>
            <input type="number" data-field="quantity" min="0.01" step="0.01" value="${item.quantity}">
          </label>
          <label class="field">
            <span>${unitLabel}</span>
            <input type="number" data-field="unitPrice" min="0" step="0.01" value="${item.unitPrice}">
          </label>
          <label class="field field-span-2">
            <span>Descrição</span>
            <input type="text" data-field="description" value="${escapeHtml(item.description || "")}" maxlength="5000">
          </label>
        </div>
        <div class="proposal-item-side">
          <strong>${formatMoney(Number(item.unitPrice) * Number(item.quantity))}</strong>
          <div class="proposal-item-actions">
            <button class="btn btn-ghost" type="button" data-move-up ${index === 0 ? "disabled" : ""}>↑</button>
            <button class="btn btn-ghost" type="button" data-move-down ${index === items.length - 1 ? "disabled" : ""}>↓</button>
            <button class="btn btn-ghost btn-danger" type="button" data-remove>Remover</button>
          </div>
        </div>
      </article>`;
    })
    .join("");
  computeLive();
}

function renderCatalog() {
  if (!products.length) {
    catalogList.innerHTML = `<p class="panel-empty">Catálogo vazio.</p>`;
    return;
  }
  catalogList.innerHTML = products
    .map((p) => {
      const tipo = p.priceType === "hora" ? "/h" : "";
      return `<button type="button" class="catalog-item" data-product-id="${p.id}">
        <strong>${escapeHtml(p.name)}</strong>
        <span>${formatMoney(p.price)}${tipo}</span>
      </button>`;
    })
    .join("");
}

function addFromProduct(product) {
  items.push({
    productId: product.id,
    name: product.name,
    description: product.description || "",
    priceType: product.priceType,
    unitPrice: product.price,
    quantity: product.priceType === "hora" ? 8 : 1,
  });
  renderItems();
}

function addCustom() {
  items.push({
    productId: null,
    name: "Novo item",
    description: "",
    priceType: "fixo",
    unitPrice: 0,
    quantity: 1,
  });
  renderItems();
}

async function parseJson(res) {
  try {
    return await res.json();
  } catch {
    return { ok: false, error: "Resposta inválida." };
  }
}

async function post(action, fields) {
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

function headerFields() {
  const live = computeLive();
  return {
    title: document.getElementById("field-title").value.trim(),
    clientId: document.getElementById("field-client").value,
    validUntil: document.getElementById("field-valid-until").value,
    scope: document.getElementById("field-scope").value.trim(),
    conditions: document.getElementById("field-conditions").value.trim(),
    discountPercent: String(live.pct > 0 ? live.pct : 0),
    discountValue: String(live.pct > 0 ? 0 : live.val),
    items: JSON.stringify(
      items.map((item) => ({
        productId: item.productId,
        name: item.name,
        description: item.description || "",
        priceType: item.priceType,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
      }))
    ),
  };
}

function fillForm(proposal) {
  idField.value = String(proposal.id);
  document.getElementById("field-title").value = proposal.title || "";
  document.getElementById("field-client").value = proposal.clientId ? String(proposal.clientId) : "";
  document.getElementById("field-valid-until").value = proposal.validUntil || "";
  document.getElementById("field-scope").value = proposal.scope || "";
  document.getElementById("field-conditions").value = proposal.conditions || "";
  document.getElementById("field-discount-percent").value = String(proposal.discountPercent || 0);
  document.getElementById("field-discount-value").value = String(proposal.discountValue || 0);
  items = (proposal.items || []).map((item) => ({
    productId: item.productId,
    name: item.name,
    description: item.description || "",
    priceType: item.priceType,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
  }));
  proposalMeta = {
    status: proposal.status,
    publicToken: proposal.publicToken,
    code: proposal.code,
  };
  document.getElementById("edit-code").hidden = false;
  document.getElementById("edit-code").textContent = proposal.code;
  document.getElementById("edit-page-title").textContent = "Editar proposta";
  document.getElementById("btn-pdf").hidden = false;
  // Link disponível assim que a proposta existe (não cancelada)
  document.getElementById("btn-copy-link").hidden = proposal.status === "cancelada";
  renderViewers(proposal.viewers || []);
  renderItems();
}

function renderViewers(viewers) {
  const box = document.getElementById("proposal-viewers");
  const list = document.getElementById("proposal-viewers-list");
  if (!box || !list) return;
  if (!viewers.length) {
    box.hidden = true;
    list.innerHTML = "";
    return;
  }
  box.hidden = false;
  list.innerHTML = viewers
    .map((v) => {
      const when = v.viewedAt
        ? new Intl.DateTimeFormat("pt-BR", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(String(v.viewedAt).replace(" ", "T")))
        : "";
      return `<li><strong>${escapeHtml(v.name)}</strong><span>${escapeHtml(when)}</span></li>`;
    })
    .join("");
}

function publicAbsoluteUrl(token) {
  const base = `${window.location.origin}${window.location.pathname.replace(/\/admin\/.*$/, "")}`;
  return `${base}/proposta/?t=${encodeURIComponent(token)}`;
}

async function save() {
  const fields = headerFields();
  if (!fields.title) {
    setStatus("Informe o título.", true);
    return;
  }
  setStatus("Salvando…");
  const id = idField.value;
  let data;
  if (id) {
    data = await post("update", { id, ...fields });
    if (data.ok) {
      data = await post("set_items", {
        id,
        items: fields.items,
        discountPercent: fields.discountPercent,
        discountValue: fields.discountValue,
      });
    }
  } else {
    data = await post("create", fields);
  }
  if (!data.ok) {
    setStatus(data.error || "Erro ao salvar", true);
    return;
  }
  fillForm(data.proposal);
  history.replaceState({}, "", `proposta-editar.php?id=${data.proposal.id}`);
  setStatus("Salvo.");
}

async function loadClients() {
  const res = await fetch(CLIENTS_API, {
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });
  const data = await parseJson(res);
  const select = document.getElementById("field-client");
  const clients = data.clients || [];
  select.innerHTML =
    `<option value="">Sem cliente</option>` +
    clients.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
}

async function loadProducts() {
  const res = await fetch(PRODUCTS_API, {
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });
  const data = await parseJson(res);
  products = data.products || [];
  renderCatalog();
}

async function loadProposal() {
  const id = idField.value;
  if (!id) return;
  const res = await fetch(`${API}?action=get&id=${encodeURIComponent(id)}`, {
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });
  if (res.status === 401) {
    window.location.href = "../login/";
    return;
  }
  const data = await parseJson(res);
  if (!data.ok) {
    setStatus(data.error || "Proposta não encontrada", true);
    return;
  }
  fillForm(data.proposal);
}

itemsList.addEventListener("input", (event) => {
  const row = event.target.closest(".proposal-item-row");
  if (!row) return;
  const index = Number(row.dataset.index);
  const field = event.target.getAttribute("data-field");
  if (!field || !items[index]) return;
  if (field === "quantity" || field === "unitPrice") {
    items[index][field] = Number(event.target.value) || 0;
  } else {
    items[index][field] = event.target.value;
  }
  const side = row.querySelector(".proposal-item-side strong");
  if (side) {
    side.textContent = formatMoney(Number(items[index].unitPrice) * Number(items[index].quantity));
  }
  computeLive();
});

itemsList.addEventListener("change", (event) => {
  const row = event.target.closest(".proposal-item-row");
  if (!row) return;
  const index = Number(row.dataset.index);
  const field = event.target.getAttribute("data-field");
  if (field === "priceType" && items[index]) {
    items[index].priceType = event.target.value;
    renderItems();
  }
});

itemsList.addEventListener("click", (event) => {
  const row = event.target.closest(".proposal-item-row");
  if (!row) return;
  const index = Number(row.dataset.index);
  if (event.target.closest("[data-remove]")) {
    items.splice(index, 1);
    renderItems();
    return;
  }
  if (event.target.closest("[data-move-up]") && index > 0) {
    const tmp = items[index - 1];
    items[index - 1] = items[index];
    items[index] = tmp;
    renderItems();
    return;
  }
  if (event.target.closest("[data-move-down]") && index < items.length - 1) {
    const tmp = items[index + 1];
    items[index + 1] = items[index];
    items[index] = tmp;
    renderItems();
  }
});

catalogList.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-product-id]");
  if (!btn) return;
  const product = products.find((p) => String(p.id) === btn.dataset.productId);
  if (product) addFromProduct(product);
});

document.getElementById("btn-add-custom").addEventListener("click", addCustom);
document.getElementById("btn-save").addEventListener("click", save);
document.getElementById("field-discount-percent").addEventListener("input", () => {
  if (Number(document.getElementById("field-discount-percent").value) > 0) {
    document.getElementById("field-discount-value").value = "0";
  }
  computeLive();
});
document.getElementById("field-discount-value").addEventListener("input", () => {
  if (Number(document.getElementById("field-discount-value").value) > 0) {
    document.getElementById("field-discount-percent").value = "0";
  }
  computeLive();
});

document.getElementById("btn-copy-link").addEventListener("click", async () => {
  // Um gesto: salva → libera público se precisar → copia o link
  await save();
  const id = idField.value;
  if (!id || !proposalMeta.publicToken) {
    if (!statusEl.textContent.includes("Erro") && !statusEl.textContent.includes("Não")) {
      setStatus("Salve a proposta com itens e total maior que zero antes de compartilhar.", true);
    }
    return;
  }
  if (proposalMeta.status === "cancelada") {
    setStatus("Proposta cancelada não pode ser compartilhada.", true);
    return;
  }
  if (["rascunho", "recusada", "expirada"].includes(proposalMeta.status)) {
    const data = await post("send", { id });
    if (!data.ok) {
      setStatus(data.error || "Não foi possível liberar o link.", true);
      return;
    }
    fillForm(data.proposal);
  }
  const url = publicAbsoluteUrl(proposalMeta.publicToken);
  try {
    await navigator.clipboard.writeText(url);
    setStatus("Link copiado. Já pode enviar ao cliente.");
  } catch {
    prompt("Copie o link:", url);
  }
});

document.getElementById("btn-pdf").addEventListener("click", () => {
  const id = idField.value;
  if (!id) return;
  window.open(`${API}?action=pdf&id=${encodeURIComponent(id)}`, "_blank");
});

await Promise.all([loadClients(), loadProducts(), loadProposal()]);
computeLive();
