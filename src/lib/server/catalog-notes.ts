import "server-only";
import {
  noteSchema,
  productSchema,
  type Note,
  type Product,
} from "../domain/schemas";
import { timestamp } from "../domain/dates";
import {
  rows,
  insert,
  update,
  execute,
  transaction,
  type Connection,
} from "./db";
import { assert } from "./http";
export async function checkClient(id: number | null, c?: Connection) {
  if (id)
    assert(
      (await rows("SELECT id FROM clientes WHERE id=?", [id], c)).length,
      "Cliente não encontrado",
      404,
    );
}
export async function listNotes() {
  return rows<Note>(
    "SELECT n.id,n.cliente_id AS clientId,c.nome AS clientName,n.titulo AS title,n.conteudo AS content,n.atualizada_em AS updatedAt FROM notas n LEFT JOIN clientes c ON c.id=n.cliente_id ORDER BY n.atualizada_em DESC,n.id DESC",
  );
}
export async function saveNote(input: unknown, id?: number) {
  const v = noteSchema.parse(input);
  await checkClient(v.clientId);
  const data = {
    cliente_id: v.clientId,
    titulo: v.title,
    conteudo: v.content,
    atualizada_em: timestamp(),
  };
  if (id) {
    assert(
      (await update("notas", id, data)).affectedRows,
      "Nota não encontrada",
      404,
    );
    return id;
  }
  return (await insert("notas", { ...data, criada_em: timestamp() })).insertId;
}
export async function deleteNote(id: number) {
  assert(
    (await execute("DELETE FROM notas WHERE id=?", [id])).affectedRows,
    "Nota não encontrada",
    404,
  );
}
export async function listProducts() {
  const r = await rows<Omit<Product, "active"> & { active: boolean }>(
    'SELECT id,nome AS name,tipo_preco AS priceType,preco AS price,descricao AS description,ativo AS active,ordem AS "order" FROM produtos_servicos ORDER BY ordem,nome,id',
  );
  return r.map((p) => ({
    ...p,
    price: Number(p.price),
    description: p.description ?? "",
    active: !!p.active,
  }));
}
export async function saveProduct(input: unknown, id?: number) {
  const v = productSchema.parse(input);
  const data = {
    nome: v.name,
    tipo_preco: v.priceType,
    preco: v.price,
    descricao: v.description,
    ativo: v.active,
    ordem: v.order,
    atualizado_em: timestamp(),
  };
  if (id) {
    assert(
      (await update("produtos_servicos", id, data)).affectedRows,
      "Produto não encontrado",
      404,
    );
    return id;
  }
  if (!data.ordem) {
    const [r] = await rows<{ n: number }>(
      "SELECT COALESCE(MAX(ordem),0)+10 AS n FROM produtos_servicos",
    );
    data.ordem = r.n;
  }
  return (
    await insert("produtos_servicos", { ...data, criado_em: timestamp() })
  ).insertId;
}
export async function reorderProducts(ids: number[]) {
  assert(new Set(ids).size === ids.length, "Lista de ordem inválida");
  await transaction(async (c) => {
    for (const [index, id] of ids.entries())
      assert(
        (
          await update(
            "produtos_servicos",
            id,
            { ordem: (index + 1) * 10, atualizado_em: timestamp() },
            c,
          )
        ).affectedRows,
        "Produto não encontrado",
        404,
      );
  });
}
