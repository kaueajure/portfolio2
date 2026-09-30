export const STATUS_LABELS = {
  orcamento: "Orçamento",
  aprovado: "Aprovado",
  em_andamento: "Em andamento",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

export const PAYMENT_LABELS = {
  a_vista: "À vista",
  mensal: "Mensal",
  parcelas: "Parcelas",
};

export const API_CLIENTS = "../api/clients.php";
export const MAX_DOC_BYTES = 20 * 1024 * 1024;

function csrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "";
}

function authHeaders(extra = {}) {
  const headers = { Accept: "application/json", ...extra };
  const csrf = csrfToken();
  if (csrf) headers["X-CSRF-Token"] = csrf;
  return headers;
}

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function formatMoney(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  return currency.format(n);
}

export function formatDate(iso) {
  if (!iso) return "—";
  const d = parseLocalDate(iso);
  if (!d) return "—";
  return dateFmt.format(d);
}

export function parseLocalDate(iso) {
  if (!iso || typeof iso !== "string") return null;
  const [y, m, day] = iso.split("-").map(Number);
  if (!y || !m || !day) return null;
  return new Date(y, m - 1, day);
}

export function addDays(iso, days) {
  const d = parseLocalDate(iso);
  if (!d) return null;
  d.setDate(d.getDate() + Number(days || 0));
  return d;
}

export function toISODate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function daysUntil(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

export function alertLevel(daysLeft) {
  if (daysLeft === null || daysLeft === undefined) return null;
  if (daysLeft < 0) return "overdue";
  if (daysLeft <= 7) return "7";
  if (daysLeft <= 15) return "15";
  if (daysLeft <= 30) return "30";
  return "ok";
}

export function alertLabel(kind, daysLeft) {
  if (daysLeft === null) return "";
  if (daysLeft < 0) {
    const n = Math.abs(daysLeft);
    return `${kind} atrasada ${n}d`;
  }
  if (daysLeft === 0) return `${kind} vence hoje`;
  return `${kind} em ${daysLeft}d`;
}

export function getSchedule(client) {
  const maintenanceDate = addDays(client.purchaseDate, client.maintenanceDays);
  const renewalDate = addDays(client.purchaseDate, client.renewalDays);
  const maintenanceLeft = daysUntil(maintenanceDate);
  const renewalLeft = daysUntil(renewalDate);

  return {
    maintenanceDate,
    renewalDate,
    maintenanceLeft,
    renewalLeft,
    maintenanceAlert: alertLevel(maintenanceLeft),
    renewalAlert: alertLevel(renewalLeft),
  };
}

export async function apiListClients() {
  const res = await fetch(API_CLIENTS, {
    headers: authHeaders(),
    credentials: "same-origin",
  });
  const data = await parseJson(res);
  if (res.status === 401) {
    window.location.href = "../login/";
    throw new Error("Sessão expirada.");
  }
  if (!res.ok || !data.ok) {
    throw new Error(data.error || "Não foi possível carregar os clientes.");
  }
  return data.clients || [];
}

export async function apiSaveClient(formData, { isEdit }) {
  if (isEdit) {
    formData.append("_method", "PUT");
  }
  const csrf = csrfToken();
  if (csrf) formData.append("csrf", csrf);

  const res = await fetch(API_CLIENTS, {
    method: "POST",
    body: formData,
    headers: authHeaders(),
    credentials: "same-origin",
  });
  const data = await parseJson(res);
  if (res.status === 401) {
    window.location.href = "../login/";
    throw new Error("Sessão expirada.");
  }
  if (!res.ok || !data.ok) {
    throw new Error(data.error || "Não foi possível salvar o cliente.");
  }
  return data.client;
}

export async function apiDeleteClient(id) {
  const res = await fetch(`${API_CLIENTS}?id=${encodeURIComponent(id)}`, {
    method: "POST",
    headers: authHeaders({
      "Content-Type": "application/x-www-form-urlencoded",
    }),
    body: new URLSearchParams({
      _method: "DELETE",
      id: String(id),
      csrf: csrfToken(),
    }),
    credentials: "same-origin",
  });
  const data = await parseJson(res);
  if (res.status === 401) {
    window.location.href = "../login/";
    throw new Error("Sessão expirada.");
  }
  if (!res.ok || !data.ok) {
    throw new Error(data.error || "Não foi possível excluir o cliente.");
  }
}

async function parseJson(res) {
  try {
    return await res.json();
  } catch {
    return { ok: false, error: "Resposta inválida do servidor (PHP/MySQL)." };
  }
}
