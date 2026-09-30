import { test, expect } from "@playwright/test";
import { PDFDocument, StandardFonts } from "pdf-lib";
const origin = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const credentials = {
  email: "test@example.test",
  password: "Test-only-password-123!",
};

test("portfolio responsive, navigation and login", async ({ page }) => {
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Kauê Ajure.",
    );
    await page.evaluate(() => document.fonts.ready);
    const fits = await page.locator("h1").evaluate((el) => {
      const r = document.createRange();
      r.selectNodeContents(el);
      return r.getBoundingClientRect().right <= innerWidth;
    });
    expect(fits).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    for (const id of ["projetos", "sobre", "stack", "codigo", "contato"])
      await expect(page.locator(`#${id}`)).toBeAttached();
  }
  await page.goto("/admin/clientes");
  await expect(page).toHaveURL(/login/);
  await page.getByLabel("E-mail", { exact: true }).fill(credentials.email);
  await page.getByLabel("Senha", { exact: true }).fill(credentials.password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/admin\/dashboard/);
  for (const route of [
    "clientes",
    "notas",
    "catalogo",
    "agenda",
    "pdf",
    "propostas",
  ]) {
    await page.goto(`/admin/${route}`);
    await expect(page.locator("main")).toBeVisible();
    await expect(
      page.getByText("Algo deu errado", { exact: false }),
    ).toHaveCount(0);
  }
});

test("API: authentication, uploads, catalog, proposal acceptance and legacy client synchronization", async ({
  request,
  playwright,
}) => {
  expect((await request.get("/api/clients")).status()).toBe(401);
  expect(
    (await request.post("/api/auth/login", { data: credentials })).status(),
  ).toBe(403);
  const login = await request.post("/api/auth/login", {
    data: credentials,
    headers: { origin },
  });
  expect(login.status(), await login.text()).toBe(200);
  const headers = { origin };
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  pdf.addPage().drawText("Proposal integration test", { font, size: 24 });
  const buffer = Buffer.from(await pdf.save());
  const response = await request.post("/api/clients", {
    headers,
    multipart: {
      name: "Cliente teste integrado",
      purchaseDate: "2026-09-29",
      status: "orcamento",
      paymentMethod: "a_vista",
      quoteValidUntil: "2027-12-31",
      budgetValue: "100",
      soldValue: "0",
      document: { name: "documento.pdf", mimeType: "application/pdf", buffer },
    },
  });
  expect(response.status(), await response.text()).toBe(200);
  const client = await response.json();
  expect(
    (await request.get(`/api/clients/${client.id}/document`)).status(),
  ).toBe(200);
  const productRes = await request.post("/api/products", {
    headers,
    data: {
      name: "Integração",
      priceType: "hora",
      price: 150,
      description: "Serviço real de teste",
    },
  });
  expect(productRes.status(), await productRes.text()).toBe(200);
  const product = await productRes.json();
  const note = await request.post("/api/notes", {
    headers,
    data: {
      title: "Nota de teste",
      content: "Conteúdo integral",
      clientId: client.id,
    },
  });
  expect(note.status(), await note.text()).toBe(200);
  const proposalRes = await request.post("/api/proposals", {
    headers,
    data: {
      title: "Proposta integrada",
      clientId: client.id,
      validUntil: "2027-12-31",
      scope: "Implementação e integração",
      conditions: "Pagamento à vista",
      discountPercent: 10,
      items: [
        {
          productId: product.id,
          name: "Integração",
          priceType: "hora",
          unitPrice: 150,
          quantity: 2,
        },
      ],
    },
  });
  expect(proposalRes.status(), await proposalRes.text()).toBe(200);
  const proposal = await proposalRes.json();
  expect(proposal.total).toBe("270.00");
  const publicClient = await playwright.request.newContext({
    baseURL: origin,
    extraHTTPHeaders: headers,
  });
  try {
    expect(
      (
        await publicClient.get(`/api/public/${proposal.publicToken}/preview`)
      ).status(),
    ).toBe(404);
    expect(
      (
        await request.post(`/api/proposals/${proposal.id}/send`, { headers })
      ).status(),
    ).toBe(200);
    expect(
      (
        await publicClient.get(`/api/public/${proposal.publicToken}/pdf`)
      ).status(),
    ).toBe(403);
    const opened = await publicClient.post(
      `/api/public/${proposal.publicToken}/open`,
      { data: { name: "Cliente Teste" } },
    );
    expect(opened.status(), await opened.text()).toBe(200);
    expect(await opened.json()).not.toHaveProperty("publicToken");
    const generated = await publicClient.get(
      `/api/public/${proposal.publicToken}/pdf`,
    );
    expect(generated.status(), await generated.text()).toBe(200);
    expect(
      (await PDFDocument.load(await generated.body())).getPageCount(),
    ).toBeGreaterThan(0);
    const accepted = await publicClient.post(
      `/api/public/${proposal.publicToken}/respond`,
      { data: { action: "accept", message: "Aprovado no teste" } },
    );
    expect(accepted.status(), await accepted.text()).toBe(200);
    const clients = await (await request.get("/api/clients")).json();
    expect(
      clients.find((c: { id: number }) => c.id === client.id),
    ).toMatchObject({ status: "aprovado", soldValue: 270 });
    expect(
      (
        await publicClient.post(`/api/public/${proposal.publicToken}/respond`, {
          data: { action: "decline" },
        })
      ).status(),
    ).toBe(409);
  } finally {
    await publicClient.dispose();
  }
  const job = await request.post("/api/pdf/watermark", {
    headers,
    multipart: {
      files: { name: "input.pdf", mimeType: "application/pdf", buffer },
      text: "Confidencial — ação",
    },
  });
  expect(job.status(), await job.text()).toBe(200);
  expect((await request.get((await job.json()).downloadUrl)).status()).toBe(
    200,
  );
  await request.post(`/api/notes/${(await note.json()).id}/delete`, {
    headers,
  });
  await request.post(`/api/products/${product.id}/deactivate`, { headers });
  await request.post(`/api/proposals/${proposal.id}/delete`, { headers });
  await request.post(`/api/clients/${client.id}/delete`, { headers });
  await request.post("/api/auth/logout", { headers });
  expect((await request.get("/api/clients")).status()).toBe(401);
});

test("browser: create and edit client, send proposal, identify viewer and accept", async ({
  page,
  browser,
}) => {
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill(credentials.email);
  await page.getByLabel("Senha", { exact: true }).fill(credentials.password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/admin\/dashboard/);
  await page.goto("/admin/clientes");
  await page.getByRole("button", { name: "Novo cliente", exact: true }).click();
  const name = `Cliente navegador ${Date.now()}`;
  await page.getByLabel("Nome do cliente / empresa").fill(name);
  await page.getByLabel("Validade do orçamento").fill("2027-12-31");
  await page
    .getByRole("button", { name: "Salvar cliente", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const card = page
    .locator("article")
    .filter({ has: page.getByRole("heading", { name, exact: true }) });
  await card.getByRole("button", { name: "Editar", exact: true }).click();
  await page.getByLabel("Telefone", { exact: true }).fill("11999999999");
  await page
    .getByRole("button", { name: "Salvar cliente", exact: true })
    .click();
  await expect(card).toContainText("11999999999");
  await page.goto("/admin/propostas/nova");
  await page
    .getByLabel("Título", { exact: true })
    .fill("Proposta pelo navegador");
  await page
    .getByLabel("Cliente", { exact: true })
    .selectOption({ label: name });
  await page.getByLabel("Validade", { exact: true }).fill("2027-12-31");
  await page.getByRole("button", { name: "Item avulso", exact: true }).click();
  await page
    .getByLabel("Nome do item", { exact: true })
    .fill("Desenvolvimento");
  await page.getByLabel("Preço unitário (R$)", { exact: true }).fill("450");
  await page
    .getByRole("button", { name: "Salvar proposta", exact: true })
    .click();
  await expect(page.getByRole("status")).toHaveText("Proposta salva.");
  await page
    .getByRole("button", { name: "Enviar e copiar link", exact: true })
    .click();
  await expect(page.getByLabel("Link público")).toBeVisible();
  const publicUrl = await page.getByLabel("Link público").inputValue();
  const viewer = await browser.newContext();
  const publicPage = await viewer.newPage();
  try {
    await publicPage.goto(publicUrl);
    await publicPage.getByLabel("Seu nome").fill("Visitante navegador");
    await publicPage
      .getByRole("button", { name: "Ver proposta", exact: true })
      .click();
    await expect(
      publicPage.getByRole("heading", { name: "O que está incluso" }),
    ).toBeVisible();
    await publicPage
      .getByRole("button", { name: "Aceitar proposta", exact: true })
      .click();
    await publicPage
      .getByRole("button", { name: "Confirmar", exact: true })
      .click();
    await expect(publicPage.getByRole("status")).toContainText(
      "Proposta aceita",
    );
  } finally {
    await viewer.close();
  }
  await page.reload();
  await expect(
    page.getByText("Visitante navegador", { exact: false }),
  ).toBeVisible();
  await page.goto("/admin/clientes");
  await expect(
    page
      .locator("article")
      .filter({ has: page.getByRole("heading", { name, exact: true }) }),
  ).toContainText("Aprovado");
});

test("API: proposal snapshots, duplication, transitions, concurrent codes and validation", async ({
  request,
  playwright,
}) => {
  const headers = { origin };
  const login = await request.post("/api/auth/login", {
    headers,
    data: credentials,
  });
  expect(login.status()).toBe(200);
  const draft = {
    title: "Estados de proposta",
    items: [
      { name: "Snapshot", priceType: "fixo", unitPrice: 100, quantity: 1 },
    ],
    validUntil: "2027-12-31",
  };
  const created = await Promise.all(
    Array.from({ length: 4 }, () =>
      request.post("/api/proposals", { headers, data: draft }),
    ),
  );
  for (const r of created) expect(r.status(), await r.text()).toBe(200);
  const proposals = await Promise.all(created.map((r) => r.json()));
  expect(new Set(proposals.map((p) => p.code)).size).toBe(4);
  expect(new Set(proposals.map((p) => p.publicToken)).size).toBe(4);
  const original = proposals[0];
  const duplicate = await request.post(
    `/api/proposals/${original.id}/duplicate`,
    { headers },
  );
  expect(duplicate.status()).toBe(200);
  const copy = await duplicate.json();
  expect(copy.status).toBe("rascunho");
  expect(copy.items).toEqual(original.items);
  expect(copy.publicToken).not.toBe(original.publicToken);
  expect(
    (
      await request.post(`/api/proposals/${copy.id}/cancel`, { headers })
    ).status(),
  ).toBe(200);
  expect(
    (
      await request.post(`/api/proposals/${copy.id}/delete`, { headers })
    ).status(),
  ).toBe(200);
  const p = proposals[1];
  expect(
    (await request.post(`/api/proposals/${p.id}/send`, { headers })).status(),
  ).toBe(200);
  expect(
    (await request.post(`/api/proposals/${p.id}/delete`, { headers })).status(),
  ).toBe(400);
  const viewer = await playwright.request.newContext({
    baseURL: origin,
    extraHTTPHeaders: headers,
  });
  try {
    await viewer.post(`/api/public/${p.publicToken}/open`, {
      data: { name: "Recusa teste" },
    });
    expect(
      (
        await viewer.post(`/api/public/${p.publicToken}/respond`, {
          data: { action: "decline", message: "Não agora" },
        })
      ).status(),
    ).toBe(200);
    expect(
      (await (await request.get(`/api/proposals/${p.id}`)).json()).status,
    ).toBe("recusada");
    await request.post(`/api/proposals/${p.id}`, {
      headers,
      data: { ...draft, validUntil: "2020-01-01" },
    });
    await request.post(`/api/proposals/${p.id}/send`, { headers });
    expect(
      (await (await request.get(`/api/proposals/${p.id}`)).json()).status,
    ).toBe("expirada");
    expect(
      (
        await viewer.post(`/api/public/${p.publicToken}/respond`, {
          data: { action: "accept" },
        })
      ).status(),
    ).toBe(409);
  } finally {
    await viewer.dispose();
  }
  const invalid = await request.post("/api/clients", {
    headers,
    multipart: {
      name: "Inválido",
      purchaseDate: "2026-09-30",
      status: "cancelado",
      paymentMethod: "mensal",
      monthlyValue: "-1",
      dueDay: "31",
    },
  });
  expect(invalid.status()).toBe(400);
  expect((await request.get("/api/clients/1/unexpected")).status()).toBe(404);
  for (const p of proposals) {
    await request.post(`/api/proposals/${p.id}/cancel`, { headers });
    await request.post(`/api/proposals/${p.id}/delete`, { headers });
  }
});

test("mobile navigation and opt-in audio", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: /SOM OFF/ }).click();
  await expect(page.getByRole("button", { name: /SOM ON/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: /SOM ON/ }).click();
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page
    .getByRole("navigation", { name: "Navegação principal" })
    .getByRole("link", { name: "Contato", exact: true })
    .click();
  await expect(page).toHaveURL(/#contato$/);
  await expect(
    page.getByRole("button", { name: "Menu", exact: true }),
  ).toHaveAttribute("aria-expanded", "false");
});
