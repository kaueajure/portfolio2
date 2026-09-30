const API = "../api/notes.php";
const CLIENTS_API = "../api/clients.php";

const listEl = document.getElementById("notes-list");
const emptyEl = document.getElementById("notes-empty");
const dialog = document.getElementById("note-dialog");
const form = document.getElementById("note-form");
const titleEl = document.getElementById("note-dialog-title");
const clientSelect = document.getElementById("note-client");
const saveBtn = form.querySelector('button[type="submit"]');

let notes = [];
let clients = [];

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
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso.replace(" ", "T")));
}

async function parseJson(res) {
  try {
    return await res.json();
  } catch {
    return { ok: false, error: "Resposta inválida." };
  }
}

function render() {
  if (!notes.length) {
    listEl.innerHTML = "";
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;
  listEl.innerHTML = notes
    .map(
      (note) => `
    <article class="note-card" data-id="${note.id}">
      <div class="note-card-head">
        <h3>${escapeHtml(note.title)}</h3>
        <span>${formatDate(note.updatedAt)}</span>
      </div>
      ${note.clientName ? `<p class="note-client">${escapeHtml(note.clientName)}</p>` : ""}
      <p class="note-body">${escapeHtml(note.content)}</p>
      <div class="note-actions">
        <button class="btn btn-ghost" type="button" data-edit>Editar</button>
        <button class="btn btn-ghost btn-danger" type="button" data-delete>Excluir</button>
      </div>
    </article>`
    )
    .join("");
}

function fillClients() {
  clientSelect.innerHTML =
    `<option value="">Sem cliente</option>` +
    clients
      .map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`)
      .join("");
}

function openDialog(note = null) {
  form.reset();
  if (note) {
    titleEl.textContent = "Editar nota";
    form.id.value = String(note.id);
    form.title.value = note.title;
    form.content.value = note.content;
    form.clientId.value = note.clientId ? String(note.clientId) : "";
  } else {
    titleEl.textContent = "Nova nota";
    form.id.value = "";
  }
  dialog.showModal();
  form.title.focus();
}

async function load() {
  const [notesRes, clientsRes] = await Promise.all([
    fetch(API, { headers: { Accept: "application/json" }, credentials: "same-origin" }),
    fetch(CLIENTS_API, { headers: { Accept: "application/json" }, credentials: "same-origin" }),
  ]);
  if (notesRes.status === 401 || clientsRes.status === 401) {
    window.location.href = "../login/";
    return;
  }
  const notesData = await parseJson(notesRes);
  const clientsData = await parseJson(clientsRes);
  if (!notesData.ok) {
    listEl.innerHTML = `<p class="panel-empty">${notesData.error || "Erro"}</p>`;
    return;
  }
  notes = notesData.notes || [];
  clients = clientsData.clients || [];
  fillClients();
  render();
}

document.querySelectorAll("[data-open-note]").forEach((btn) => {
  btn.addEventListener("click", () => openDialog());
});
document.querySelectorAll("[data-close-note]").forEach((btn) => {
  btn.addEventListener("click", () => dialog.close());
});
dialog.addEventListener("click", (e) => {
  if (e.target === dialog) dialog.close();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const isEdit = Boolean(form.id.value);
  const body = new URLSearchParams({
    action: isEdit ? "update" : "create",
    title: form.title.value.trim(),
    content: form.content.value.trim(),
    clientId: form.clientId.value,
    csrf: csrf(),
  });
  if (isEdit) body.set("id", form.id.value);

  saveBtn.disabled = true;
  try {
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
    const data = await parseJson(res);
    if (!res.ok || !data.ok) throw new Error(data.error || "Erro ao salvar");
    dialog.close();
    await load();
  } catch (err) {
    alert(err.message);
  } finally {
    saveBtn.disabled = false;
  }
});

listEl.addEventListener("click", async (event) => {
  const card = event.target.closest(".note-card");
  if (!card) return;
  const id = Number(card.dataset.id);
  const note = notes.find((n) => n.id === id);
  if (!note) return;

  if (event.target.closest("[data-edit]")) {
    openDialog(note);
    return;
  }
  if (event.target.closest("[data-delete]")) {
    if (!confirm(`Excluir a nota “${note.title}”?`)) return;
    const res = await fetch(API, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        "X-CSRF-Token": csrf(),
      },
      body: new URLSearchParams({ action: "delete", id: String(id), csrf: csrf() }),
      credentials: "same-origin",
    });
    const data = await parseJson(res);
    if (!res.ok || !data.ok) {
      alert(data.error || "Erro ao excluir");
      return;
    }
    await load();
  }
});

load();
