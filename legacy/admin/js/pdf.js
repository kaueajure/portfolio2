const API = "../api/pdf_tools.php";

function csrfToken() {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "";
}

const statusEl = document.getElementById("pdf-status");

function setStatus(message, isError = false) {
  statusEl.textContent = message || "";
  statusEl.classList.toggle("is-error", Boolean(isError));
}

function formatFileLabel(input) {
  const files = input.files;
  if (!files || !files.length) return "Nenhum arquivo";
  if (files.length === 1) return files[0].name;
  return `${files.length} arquivos selecionados`;
}

function bindFilePickers(root = document) {
  root.querySelectorAll(".file-picker").forEach((picker) => {
    const input = picker.querySelector('input[type="file"]');
    const nameEl = picker.querySelector(".file-picker-name");
    if (!input || !nameEl) return;

    const sync = () => {
      const label = formatFileLabel(input);
      nameEl.textContent = label;
      picker.classList.toggle("has-file", Boolean(input.files?.length));
      nameEl.title = label;
    };

    input.addEventListener("change", sync);
    sync();
  });
}

async function parseJson(res) {
  try {
    return await res.json();
  } catch {
    return { ok: false, error: "Resposta inválida do servidor." };
  }
}

async function loadCapabilities() {
  const res = await fetch(`${API}?action=capabilities`, {
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });
  if (res.status === 401) {
    window.location.href = "../login/";
    return;
  }
  const data = await parseJson(res);
  const caps = data.capabilities || {};

  document.querySelectorAll("[data-cap]").forEach((el) => {
    const key = el.getAttribute("data-cap");
    if (caps[key] === false) {
      el.hidden = false;
      const card = el.closest(".pdf-card");
      const form = card?.querySelector("form");
      if (form) {
        form.querySelectorAll("input, select, button").forEach((field) => {
          field.disabled = true;
        });
      }
      card?.classList.add("is-disabled");
    }
  });
}

document.querySelectorAll(".pdf-form").forEach((form) => {
  const modeSelect = form.querySelector('select[name="mode"]');
  const rangesField = form.querySelector("[data-split-ranges]");
  if (modeSelect && rangesField) {
    modeSelect.addEventListener("change", () => {
      rangesField.hidden = modeSelect.value !== "range";
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const action = form.getAttribute("data-action");
    if (!action) return;

    const btn = form.querySelector(".pdf-submit");
    const original = btn?.textContent || "Enviar";
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Processando…";
    }
    setStatus("Processando arquivo…");

    try {
      const body = new FormData(form);
      body.set("action", action);
      body.set("csrf", csrfToken());

      const res = await fetch(`${API}?action=${encodeURIComponent(action)}`, {
        method: "POST",
        body,
        headers: {
          Accept: "application/json",
          "X-CSRF-Token": csrfToken(),
        },
        credentials: "same-origin",
      });

      if (res.status === 401) {
        window.location.href = "../login/";
        return;
      }

      const data = await parseJson(res);
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Falha ao processar.");
      }

      setStatus(`Pronto: ${data.fileName}. O download vai começar.`);
      const link = document.createElement("a");
      link.href = data.downloadUrl;
      link.download = data.fileName || "download";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setStatus(err.message || "Erro ao processar.", true);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = original;
      }
    }
  });
});

bindFilePickers();
loadCapabilities();
