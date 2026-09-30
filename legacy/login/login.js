const API = "../api/auth.php";

const form = document.getElementById("login-form");
const lead = document.getElementById("login-lead");
const errorEl = document.getElementById("login-error");
const title = document.getElementById("login-title");
const submitBtn = document.getElementById("login-submit");
const emailInput = document.getElementById("field-email");
const passwordStep = document.getElementById("step-password");
const setupStep = document.getElementById("step-setup");
const passwordInput = document.getElementById("field-password");
const newPasswordInput = document.getElementById("field-new-password");
const confirmInput = document.getElementById("field-password-confirm");

const setupToken = new URLSearchParams(window.location.search).get("setup") || "";
const isSetupMode = Boolean(setupToken);

let busy = false;

function showError(message) {
  if (!message) {
    errorEl.hidden = true;
    errorEl.textContent = "";
    return;
  }
  errorEl.hidden = false;
  errorEl.textContent = message;
}

function showLead(message) {
  if (!message) {
    lead.hidden = true;
    lead.textContent = "";
    return;
  }
  lead.hidden = false;
  lead.textContent = message;
}

function applyMode() {
  if (isSetupMode) {
    title.textContent = "Criar senha";
    showLead("Use este link apenas se estiver redefinindo o acesso com o token de configuração.");
    passwordStep.hidden = true;
    setupStep.hidden = false;
    passwordInput.required = false;
    newPasswordInput.required = true;
    confirmInput.required = true;
    submitBtn.textContent = "Salvar senha e entrar";
    return;
  }

  title.textContent = "Entrar";
  showLead("");
  passwordStep.hidden = false;
  setupStep.hidden = true;
  passwordInput.required = true;
  newPasswordInput.required = false;
  confirmInput.required = false;
  submitBtn.textContent = "Entrar";
}

async function parseJson(res) {
  try {
    return await res.json();
  } catch {
    return { ok: false, error: "Resposta inválida do servidor." };
  }
}

async function post(action, body) {
  const data = new URLSearchParams({ action, ...body });
  const res = await fetch(`${API}?action=${encodeURIComponent(action)}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: data,
    credentials: "same-origin",
  });
  const json = await parseJson(res);
  return { res, json };
}

async function ensureLoggedOutOrRedirect() {
  const res = await fetch(`${API}?action=me`, {
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });
  const json = await parseJson(res);
  if (json.authenticated) {
    window.location.href = "../admin/";
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (busy) return;

  const email = emailInput.value.trim().toLowerCase();
  if (!email) {
    showError("Informe o e-mail.");
    return;
  }

  busy = true;
  submitBtn.disabled = true;
  showError("");

  try {
    if (isSetupMode) {
      const password = newPasswordInput.value;
      const passwordConfirm = confirmInput.value;
      if (password.length < 12) {
        showError("A senha deve ter no mínimo 12 caracteres.");
        return;
      }
      if (password !== passwordConfirm) {
        showError("As senhas não coincidem.");
        return;
      }

      const { res, json } = await post("setup", {
        email,
        password,
        passwordConfirm,
        setupToken,
      });
      if (!res.ok || !json.ok) {
        showError(json.error || "Não foi possível salvar a senha.");
        return;
      }
      window.location.href = json.redirect || "../admin/dashboard.php";
      return;
    }

    const password = passwordInput.value;
    if (!password) {
      showError("Informe a senha.");
      return;
    }

    const { res, json } = await post("login", { email, password });
    if (!res.ok || !json.ok) {
      showError(json.error || "E-mail ou senha incorretos.");
      return;
    }
    window.location.href = json.redirect || "../admin/dashboard.php";
  } catch {
    showError("Falha de conexão. Tente novamente.");
  } finally {
    busy = false;
    submitBtn.disabled = false;
  }
});

applyMode();
ensureLoggedOutOrRedirect();
