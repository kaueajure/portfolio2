import "server-only";
import { clientSchema, type Client, type ClientInput } from "../domain/schemas";
import { timestamp } from "../domain/dates";
import { rows, insert, update, execute, transaction, type Row } from "./db";
import { assert } from "./http";
import { saveDocument, storage } from "./storage";
export const clientMap: Record<keyof ClientInput, string> = {
  name: "nome",
  phone: "telefone",
  email: "email",
  purchaseDate: "data_compra",
  budgetValue: "valor_orcamento",
  soldValue: "valor_vendido",
  status: "status",
  paymentMethod: "forma_pagamento",
  cashPaymentDate: "data_pagamento_vista",
  monthlyValue: "valor_mensal",
  dueDay: "dia_vencimento",
  monthlyStartDate: "data_inicio_mensalidade",
  installmentCount: "qtd_parcelas",
  installmentValue: "valor_parcela",
  firstInstallmentDate: "data_primeira_parcela",
  installmentsPaid: "parcelas_pagas",
  quoteValidUntil: "validade_orcamento",
  approvalDate: "data_aprovacao",
  deliveryForecast: "previsao_entrega",
  deliveryDate: "data_entrega",
  cancelReason: "motivo_cancelamento",
  maintenanceDays: "dias_manutencao",
  renewalDays: "dias_renovacao",
  notes: "observacoes",
};
export function mapClient(row: Row): Client {
  const data = Object.fromEntries(
    Object.entries(clientMap).map(([k, v]) => [k, row[v]]),
  );
  for (const k of [
    "budgetValue",
    "soldValue",
    "monthlyValue",
    "dueDay",
    "installmentCount",
    "installmentValue",
    "installmentsPaid",
    "maintenanceDays",
    "renewalDays",
  ])
    if (data[k] != null) data[k] = Number(data[k]);
  for (const k of ["phone", "email", "notes", "cancelReason"]) data[k] ??= "";
  return {
    ...data,
    id: Number(row.id),
    createdAt: String(row.criado_em),
    updatedAt: String(row.atualizado_em),
    document: row.documento_caminho
      ? {
          name: String(row.documento_nome),
          mime: String(row.documento_tipo),
          url: `/api/clients/${row.id}/document`,
        }
      : null,
  } as Client;
}
export async function listClients() {
  return (
    await rows("SELECT * FROM clientes ORDER BY atualizado_em DESC,id DESC")
  ).map(mapClient);
}
export async function saveClient(
  input: unknown,
  id?: number,
  file?: File,
  remove = false,
) {
  const v = clientSchema.parse(input);
  const data: Record<string, unknown> = Object.fromEntries(
    Object.entries(clientMap).map(([key, column]) => [
      column,
      v[key as keyof ClientInput],
    ]),
  );
  const paymentColumns = [
    "data_pagamento_vista",
    "valor_mensal",
    "dia_vencimento",
    "data_inicio_mensalidade",
    "qtd_parcelas",
    "valor_parcela",
    "data_primeira_parcela",
  ];
  const keep =
    v.paymentMethod === "a_vista"
      ? ["data_pagamento_vista"]
      : v.paymentMethod === "mensal"
        ? ["valor_mensal", "dia_vencimento", "data_inicio_mensalidade"]
        : ["qtd_parcelas", "valor_parcela", "data_primeira_parcela"];
  for (const key of paymentColumns) if (!keep.includes(key)) data[key] = null;
  if (v.paymentMethod !== "parcelas") data.parcelas_pagas = 0;
  const statusKeep = {
    orcamento: "validade_orcamento",
    aprovado: "data_aprovacao",
    em_andamento: "previsao_entrega",
    entregue: "data_entrega",
    cancelado: "motivo_cancelamento",
  }[v.status];
  for (const key of [
    "validade_orcamento",
    "data_aprovacao",
    "previsao_entrega",
    "data_entrega",
    "motivo_cancelamento",
  ])
    if (key !== statusKeep) data[key] = null;
  const upload = file ? await saveDocument(file) : null;
  let oldKey: string | null = null;
  try {
    const result = await transaction(async (c) => {
      if (id) {
        const [old] = await rows(
          "SELECT * FROM clientes WHERE id=? FOR UPDATE",
          [id],
          c,
        );
        assert(old, "Cliente não encontrado", 404);
        if (upload || remove)
          oldKey = old.documento_caminho ? String(old.documento_caminho) : null;
      }
      if (upload) Object.assign(data, upload);
      else if (remove)
        Object.assign(data, {
          documento_caminho: null,
          documento_nome: null,
          documento_tipo: null,
        });
      data.atualizado_em = timestamp();
      if (id) await update("clientes", id, data, c);
      else
        id = (await insert("clientes", { ...data, criado_em: timestamp() }, c))
          .insertId;
      const [r] = await rows("SELECT * FROM clientes WHERE id=?", [id], c);
      return mapClient(r);
    });
    if (oldKey)
      await storage()
        .remove(oldKey)
        .catch(() => console.error("Old upload cleanup pending"));
    return result;
  } catch (e) {
    if (upload)
      await storage()
        .remove(upload.documento_caminho)
        .catch(() => {});
    throw e;
  }
}
export async function deleteClient(id: number) {
  const key = await transaction(async (c) => {
    const [r] = await rows(
      "SELECT documento_caminho FROM clientes WHERE id=? FOR UPDATE",
      [id],
      c,
    );
    assert(r, "Cliente não encontrado", 404);
    await execute("DELETE FROM clientes WHERE id=?", [id], c);
    return r.documento_caminho;
  });
  if (key)
    await storage()
      .remove(String(key))
      .catch(() => console.error("Old upload cleanup pending"));
}
