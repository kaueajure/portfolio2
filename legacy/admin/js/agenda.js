let allItems = [];

const listEl = document.getElementById("agenda-list");
const emptyEl = document.getElementById("agenda-empty");
const filterEl = document.getElementById("agenda-filter");

function levelLabel(level, days) {
  if (level === "overdue") return `atrasado ${Math.abs(days)}d`;
  if (days === 0) return "hoje";
  return `em ${days}d`;
}

function formatDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function filtered() {
  const mode = filterEl.value;
  return allItems.filter((item) => {
    if (mode === "all") return true;
    if (mode === "overdue") return item.daysLeft < 0;
    if (mode === "7") return item.daysLeft <= 7;
    return item.daysLeft <= 30;
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
    .map(
      (item) => `
    <article class="agenda-item">
      <div>
        <strong>${escapeHtml(item.clientName)}</strong>
        <span>${escapeHtml(item.label)}${item.value != null ? ` · R$ ${Number(item.value).toFixed(2)}` : ""}</span>
        ${item.phone ? `<span class="agenda-phone">${escapeHtml(item.phone)}</span>` : ""}
      </div>
      <div class="agenda-meta">
        <time>${formatDate(item.date)}</time>
        <span class="badge badge-alert-${item.level}">${levelLabel(item.level, item.daysLeft)}</span>
      </div>
    </article>`
    )
    .join("");
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
    listEl.innerHTML = `<p class="panel-empty">${data.error || "Erro"}</p>`;
    return;
  }
  allItems = data.agenda || [];
  render();
}

filterEl.addEventListener("change", render);
load();
