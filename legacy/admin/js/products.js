const API = "../api/products.php";

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

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

async function parseJson(res) {
  try {
    return await res.json();
  } catch {
    return { ok: false, error: "Resposta inválida." };
  }
}

export async function loadProductsAdmin() {
  const listEl = document.getElementById("products-admin-list");
  if (!listEl) return;
  const res = await fetch(`${API}?all=1`, {
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
  const products = data.products || [];
  if (!products.length) {
    listEl.innerHTML = `<p class="panel-empty">Nenhum produto no catálogo.</p>`;
    return;
  }
  listEl.innerHTML = products
    .map((p) => {
      const tipo = p.priceType === "hora" ? "/h" : "";
      return `<article class="product-admin-row ${p.active ? "" : "is-inactive"}" data-id="${p.id}">
        <div>
          <strong>${escapeHtml(p.name)}</strong>
          <span>${money.format(p.price)}${tipo}${p.active ? "" : " · inativo"}</span>
        </div>
        <div class="product-admin-actions">
          <button class="btn btn-ghost" type="button" data-edit-product>Editar</button>
          ${p.active ? `<button class="btn btn-ghost btn-danger" type="button" data-deactivate-product>Desativar</button>` : ""}
        </div>
      </article>`;
    })
    .join("");

  listEl._products = products;
}

export function bindProductsDialog() {
  const dialog = document.getElementById("products-dialog");
  const form = document.getElementById("product-form");
  if (!dialog || !form) return;

  document.querySelectorAll("[data-open-products]").forEach((btn) => {
    btn.addEventListener("click", () => {
      dialog.showModal();
      loadProductsAdmin();
    });
  });
  document.querySelectorAll("[data-close-products]").forEach((btn) => {
    btn.addEventListener("click", () => dialog.close());
  });
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });

  document.getElementById("product-form-reset")?.addEventListener("click", () => {
    form.reset();
    document.getElementById("product-id").value = "";
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const idInput = document.getElementById("product-id");
    const nameInput = document.getElementById("product-name");
    const typeInput = document.getElementById("product-price-type");
    const priceInput = document.getElementById("product-price");
    const descInput = document.getElementById("product-description");
    const isEdit = Boolean(idInput.value);
    const body = new URLSearchParams({
      action: isEdit ? "update" : "create",
      name: nameInput.value.trim(),
      priceType: typeInput.value,
      price: priceInput.value,
      description: descInput.value.trim(),
      active: "1",
      csrf: csrf(),
    });
    if (isEdit) body.set("id", idInput.value);

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
    if (!res.ok || !data.ok) {
      alert(data.error || "Erro ao salvar");
      return;
    }
    form.reset();
    idInput.value = "";
    await loadProductsAdmin();
  });

  document.getElementById("products-admin-list")?.addEventListener("click", async (event) => {
    const row = event.target.closest(".product-admin-row");
    if (!row) return;
    const listEl = document.getElementById("products-admin-list");
    const products = listEl._products || [];
    const product = products.find((p) => String(p.id) === row.dataset.id);
    if (!product) return;

    if (event.target.closest("[data-edit-product]")) {
      document.getElementById("product-id").value = String(product.id);
      document.getElementById("product-name").value = product.name;
      document.getElementById("product-price-type").value = product.priceType;
      document.getElementById("product-price").value = String(product.price);
      document.getElementById("product-description").value = product.description || "";
      return;
    }
    if (event.target.closest("[data-deactivate-product]")) {
      if (!confirm(`Desativar “${product.name}”?`)) return;
      const res = await fetch(API, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
          "X-CSRF-Token": csrf(),
        },
        body: new URLSearchParams({ action: "delete", id: String(product.id), csrf: csrf() }),
        credentials: "same-origin",
      });
      const data = await parseJson(res);
      if (!res.ok || !data.ok) {
        alert(data.error || "Erro");
        return;
      }
      await loadProductsAdmin();
    }
  });
}
