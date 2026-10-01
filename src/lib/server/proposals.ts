import "server-only";
import { randomBytes } from "node:crypto";
import {
  proposalSchema,
  type Proposal,
  type ProposalInput,
} from "../domain/schemas";
import { totals, expired, proposalCode, canRespond } from "../domain/proposals";
import { today, timestamp } from "../domain/dates";
import {
  rows,
  execute,
  insert,
  update,
  transaction,
  type Connection,
  type Row,
} from "./db";
import { assert, appUrl } from "./http";
import { checkClient } from "./catalog-notes";
export async function expireProposals(c?: Connection) {
  await execute(
    "UPDATE propostas SET status='expirada',atualizada_em=? WHERE status IN ('enviada','visualizada') AND validade<?",
    [timestamp(), today()],
    c,
  );
}
export async function getProposal(
  id: number,
  c?: Connection,
): Promise<Proposal> {
  const [p] = await rows(
    "SELECT p.*,c.nome AS cliente_nome FROM propostas p LEFT JOIN clientes c ON c.id=p.cliente_id WHERE p.id=?",
    [id],
    c,
  );
  assert(p, "Proposta não encontrada", 404);
  const items = await rows(
    "SELECT * FROM proposta_itens WHERE proposta_id=? ORDER BY ordem,id",
    [id],
    c,
  );
  const viewers = await rows<{ name: string; viewedAt: string }>(
    "SELECT nome AS name,visualizada_em AS viewedAt FROM proposta_visualizacoes WHERE proposta_id=? ORDER BY visualizada_em DESC,id DESC LIMIT 50",
    [id],
    c,
  );
  return mapProposal(p, items, viewers);
}
function mapProposal(
  p: Row,
  items: Row[],
  viewers: Proposal["viewers"],
): Proposal {
  const id = Number(p.id);
  return {
    id,
    code: String(p.codigo),
    publicToken: String(p.token_publico),
    publicUrl: `${appUrl()}/proposta/${p.token_publico}`,
    title: String(p.titulo),
    clientId: p.cliente_id ? Number(p.cliente_id) : null,
    clientName: p.cliente_nome ? String(p.cliente_nome) : null,
    status: p.status as Proposal["status"],
    validUntil: p.validade ? String(p.validade) : null,
    discountValue: Number(p.desconto_valor),
    discountPercent: Number(p.desconto_percentual),
    subtotal: String(p.subtotal),
    total: String(p.total),
    conditions: String(p.condicoes ?? ""),
    scope: String(p.escopo ?? ""),
    viewedAt: p.visualizada_em ? String(p.visualizada_em) : null,
    respondedAt: p.respondida_em ? String(p.respondida_em) : null,
    clientResponse: p.resposta_cliente ? String(p.resposta_cliente) : null,
    viewers,
    items: items.map((i) => ({
      productId: i.produto_id ? Number(i.produto_id) : null,
      name: String(i.nome_snapshot),
      description: String(i.descricao_snapshot ?? ""),
      priceType: i.tipo_preco as "fixo" | "hora",
      unitPrice: Number(i.preco_unitario),
      quantity: Number(i.quantidade),
      lineTotal: String(i.total_linha),
    })),
  };
}
export async function listProposals() {
  await expireProposals();
  const [proposals, items, viewers] = await Promise.all([
    rows(
      "SELECT p.*,c.nome AS cliente_nome FROM propostas p LEFT JOIN clientes c ON c.id=p.cliente_id ORDER BY p.atualizada_em DESC,p.id DESC",
    ),
    rows("SELECT * FROM proposta_itens ORDER BY proposta_id,ordem,id"),
    rows<{ proposalId: number; name: string; viewedAt: string }>(
      "SELECT proposta_id AS proposalId,nome AS name,visualizada_em AS viewedAt FROM (SELECT v.*,ROW_NUMBER() OVER (PARTITION BY proposta_id ORDER BY visualizada_em DESC,id DESC) AS rn FROM proposta_visualizacoes v) ranked WHERE rn<=50 ORDER BY proposta_id,visualizada_em DESC,id DESC",
    ),
  ]);
  const itemsByProposal = new Map<number, Row[]>();
  const viewersByProposal = new Map<number, Proposal["viewers"]>();
  for (const item of items) {
    const id = Number(item.proposta_id);
    const group = itemsByProposal.get(id) ?? [];
    group.push(item);
    itemsByProposal.set(id, group);
  }
  for (const viewer of viewers) {
    const group = viewersByProposal.get(viewer.proposalId) ?? [];
    group.push({ name: viewer.name, viewedAt: viewer.viewedAt });
    viewersByProposal.set(viewer.proposalId, group);
  }
  return proposals.map((p) =>
    mapProposal(
      p,
      itemsByProposal.get(Number(p.id)) ?? [],
      viewersByProposal.get(Number(p.id)) ?? [],
    ),
  );
}
async function nextCode(c: Connection) {
  const year = Number(today().slice(0, 4));
  await execute(
    "INSERT INTO app_proposal_sequences(year,number) VALUES (?,0) ON CONFLICT (year) DO NOTHING",
    [year],
    c,
  );
  const [seq] = await rows<{ number: number }>(
    "SELECT number FROM app_proposal_sequences WHERE year=? FOR UPDATE",
    [year],
    c,
  );
  const [last] = await rows<{ n: number }>(
    "SELECT COALESCE(MAX(CAST(split_part(codigo,'-',3) AS INTEGER)),0) AS n FROM propostas WHERE codigo LIKE ?",
    [`PROP-${year}-%`],
    c,
  );
  const n = Math.max(Number(last.n), seq.number) + 1;
  await execute(
    "UPDATE app_proposal_sequences SET number=? WHERE year=?",
    [n, year],
    c,
  );
  return proposalCode(year, n);
}
async function persist(
  v: ProposalInput,
  id: number | undefined,
  c: Connection,
) {
  await checkClient(v.clientId, c);
  const t = totals(v.items, v.discountValue, v.discountPercent);
  const data = {
    cliente_id: v.clientId,
    titulo: v.title,
    validade: v.validUntil,
    condicoes: v.conditions,
    escopo: v.scope,
    desconto_valor: t.discountValue,
    desconto_percentual: t.discountPercent,
    subtotal: t.subtotal,
    total: t.total,
    atualizada_em: timestamp(),
  };
  if (id) {
    const [old] = await rows(
      "SELECT status FROM propostas WHERE id=? FOR UPDATE",
      [id],
      c,
    );
    assert(old, "Proposta não encontrada", 404);
    assert(
      !["aceita", "cancelada"].includes(String(old.status)),
      "Proposta não pode mais ser editada.",
    );
    await update("propostas", id, data, c);
  } else
    id = (
      await insert(
        "propostas",
        {
          ...data,
          codigo: await nextCode(c),
          token_publico: randomBytes(32).toString("hex"),
          status: "rascunho",
          criada_em: timestamp(),
        },
        c,
      )
    ).insertId;
  await execute("DELETE FROM proposta_itens WHERE proposta_id=?", [id], c);
  for (const [order, item] of v.items.entries()) {
    if (item.productId)
      assert(
        (
          await rows(
            "SELECT id FROM produtos_servicos WHERE id=?",
            [item.productId],
            c,
          )
        ).length,
        "Produto não encontrado",
        404,
      );
    await insert(
      "proposta_itens",
      {
        proposta_id: id,
        produto_id: item.productId,
        nome_snapshot: item.name,
        descricao_snapshot: item.description,
        tipo_preco: item.priceType,
        preco_unitario: item.unitPrice,
        quantidade: item.quantity,
        total_linha: t.lines[order],
        ordem: order,
      },
      c,
    );
  }
  return getProposal(id, c);
}
export async function saveProposal(input: unknown, id?: number) {
  const v = proposalSchema.parse(input);
  return transaction((c) => persist(v, id, c));
}
export async function proposalAction(
  id: number,
  action: "send" | "cancel" | "delete" | "duplicate",
) {
  return transaction(async (c) => {
    const [row] = await rows(
      "SELECT * FROM propostas WHERE id=? FOR UPDATE",
      [id],
      c,
    );
    assert(row, "Proposta não encontrada", 404);
    if (action === "duplicate") {
      const p = await getProposal(id, c);
      return persist(
        proposalSchema.parse({
          ...p,
          title: `${p.title.slice(0, 192)} (cópia)`,
        }),
        undefined,
        c,
      );
    }
    if (action === "delete") {
      assert(
        ["rascunho", "cancelada"].includes(String(row.status)),
        "Somente rascunhos e canceladas podem ser excluídos.",
      );
      await execute("DELETE FROM propostas WHERE id=?", [id], c);
      return null;
    }
    if (action === "cancel") {
      assert(
        row.status !== "aceita",
        "Proposta aceita não pode ser cancelada.",
      );
      await update(
        "propostas",
        id,
        { status: "cancelada", atualizada_em: timestamp() },
        c,
      );
    } else {
      assert(
        ["rascunho", "enviada", "visualizada", "recusada", "expirada"].includes(
          String(row.status),
        ),
        "Status não permite envio.",
      );
      assert(
        Number(row.total) > 0 &&
          (
            await rows(
              "SELECT id FROM proposta_itens WHERE proposta_id=? LIMIT 1",
              [id],
              c,
            )
          ).length,
        "Adicione itens e um total maior que zero.",
      );
      await update(
        "propostas",
        id,
        {
          status: "enviada",
          visualizada_em: null,
          respondida_em: null,
          resposta_cliente: null,
          atualizada_em: timestamp(),
        },
        c,
      );
    }
    return getProposal(id, c);
  });
}
export async function publicPreview(token: string) {
  await expireProposals();
  const [r] = await rows(
    "SELECT id,codigo,titulo,status,validade FROM propostas WHERE token_publico=?",
    [token],
  );
  assert(
    r && !["rascunho", "cancelada"].includes(String(r.status)),
    "Proposta indisponível.",
    404,
  );
  return {
    code: String(r.codigo),
    title: String(r.titulo),
    status: r.status as Proposal["status"],
    validUntil: r.validade ? String(r.validade) : null,
  };
}
export function publicPayload(p: Proposal) {
  return {
    code: p.code,
    title: p.title,
    status: p.status,
    validUntil: p.validUntil,
    items: p.items.map((i) => ({
      name: i.name,
      description: i.description,
      priceType: i.priceType,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      lineTotal: i.lineTotal,
    })),
    subtotal: p.subtotal,
    discountValue: p.discountValue,
    discountPercent: p.discountPercent,
    total: p.total,
    scope: p.scope,
    conditions: p.conditions,
    clientName: p.clientName,
    canRespond: canRespond(p),
    isExpired: expired(p),
  };
}
export type PublicProposal = ReturnType<typeof publicPayload>;
async function lockPublic(token: string, c: Connection) {
  const [r] = await rows(
    "SELECT * FROM propostas WHERE token_publico=? FOR UPDATE",
    [token],
    c,
  );
  assert(
    r && !["rascunho", "cancelada"].includes(String(r.status)),
    "Proposta indisponível.",
    404,
  );
  return r;
}
export async function openProposal(
  token: string,
  name: string,
  returning: boolean,
) {
  await expireProposals();
  return transaction(async (c) => {
    const r = await lockPublic(token, c);
    if (!returning || r.status === "enviada")
      await insert(
        "proposta_visualizacoes",
        { proposta_id: r.id, nome: name, visualizada_em: timestamp() },
        c,
      );
    if (r.status === "enviada" || !r.visualizada_em)
      await update(
        "propostas",
        Number(r.id),
        {
          status: r.status === "enviada" ? "visualizada" : r.status,
          visualizada_em: timestamp(),
          atualizada_em: timestamp(),
        },
        c,
      );
    return getProposal(Number(r.id), c);
  });
}
export async function publicFull(token: string) {
  await expireProposals();
  const [r] = await rows(
    "SELECT id,status FROM propostas WHERE token_publico=?",
    [token],
  );
  assert(
    r && !["rascunho", "cancelada"].includes(String(r.status)),
    "Proposta indisponível.",
    404,
  );
  return getProposal(Number(r.id));
}
export async function respond(
  token: string,
  action: "accept" | "decline",
  message: string,
) {
  await expireProposals();
  return transaction(async (c) => {
    const r = await lockPublic(token, c);
    assert(
      canRespond({
        status: r.status as Proposal["status"],
        validUntil: r.validade ? String(r.validade) : null,
      }),
      "Esta proposta não pode mais ser respondida.",
      409,
    );
    const status = action === "accept" ? "aceita" : "recusada";
    await update(
      "propostas",
      Number(r.id),
      {
        status,
        respondida_em: timestamp(),
        resposta_cliente: message,
        atualizada_em: timestamp(),
      },
      c,
    );
    if (action === "accept" && r.cliente_id)
      await execute(
        "UPDATE clientes SET valor_orcamento=?,valor_vendido=?,status='aprovado',data_aprovacao=?,validade_orcamento=COALESCE(?,validade_orcamento),atualizado_em=? WHERE id=?",
        [r.total, r.total, today(), r.validade, timestamp(), r.cliente_id],
        c,
      );
    return getProposal(Number(r.id), c);
  });
}
