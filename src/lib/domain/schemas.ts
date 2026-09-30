import { z } from "zod";
export const idSchema = z.coerce.number().int().positive().max(4294967295);
const optionalId = z.preprocess(
  (v) => (v === "" || v == null ? null : v),
  idSchema.nullable(),
);
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) =>
      !Number.isNaN(Date.parse(v)) &&
      new Date(v).toISOString().slice(0, 10) === v,
    "Data inválida",
  );
const optionalDate = z.preprocess(
  (v) => (v === "" || v == null ? null : v),
  dateSchema.nullable(),
);
export const amount = z.coerce
  .number()
  .finite()
  .min(0)
  .max(9999999999.99)
  .refine(
    (v) => Math.abs(v * 100 - Math.round(v * 100)) < 0.001,
    "Use até duas casas decimais",
  );
const text = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) => z.preprocess((v) => v ?? "", text(max));
const optionalNumber = z.preprocess(
  (v) => (v === "" || v == null ? null : v),
  z.coerce.number().finite().nonnegative().nullable(),
);
export const statuses = [
  "orcamento",
  "aprovado",
  "em_andamento",
  "entregue",
  "cancelado",
] as const;
export const proposalStatuses = [
  "rascunho",
  "enviada",
  "visualizada",
  "aceita",
  "recusada",
  "expirada",
  "cancelada",
] as const;
export const labels: Record<string, string> = {
  orcamento: "Orçamento",
  aprovado: "Aprovado",
  em_andamento: "Em andamento",
  entregue: "Entregue",
  cancelado: "Cancelado",
  rascunho: "Rascunho",
  enviada: "Enviada",
  visualizada: "Visualizada",
  aceita: "Aceita",
  recusada: "Recusada",
  expirada: "Expirada",
  cancelada: "Cancelada",
  a_vista: "À vista",
  mensal: "Mensal",
  parcelas: "Parcelas",
};
export const clientSchema = z
  .object({
    name: text(120).min(1),
    phone: optionalText(30),
    email: optionalText(120).refine(
      (v) => !v || z.email().safeParse(v).success,
      "E-mail inválido",
    ),
    purchaseDate: dateSchema,
    budgetValue: amount.default(0),
    soldValue: amount.default(0),
    status: z.enum(statuses),
    paymentMethod: z.enum(["a_vista", "mensal", "parcelas"]),
    cashPaymentDate: optionalDate,
    monthlyValue: optionalNumber,
    dueDay: optionalNumber,
    monthlyStartDate: optionalDate,
    installmentCount: optionalNumber,
    installmentValue: optionalNumber,
    firstInstallmentDate: optionalDate,
    installmentsPaid: z.coerce.number().int().min(0).max(120).default(0),
    quoteValidUntil: optionalDate,
    approvalDate: optionalDate,
    deliveryForecast: optionalDate,
    deliveryDate: optionalDate,
    cancelReason: optionalText(255),
    maintenanceDays: z.coerce.number().int().min(0).max(36500).default(90),
    renewalDays: z.coerce.number().int().min(0).max(36500).default(365),
    notes: optionalText(5000),
  })
  .superRefine((v, ctx) => {
    const fail = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });
    const required = {
      orcamento: "quoteValidUntil",
      aprovado: "approvalDate",
      em_andamento: "deliveryForecast",
      entregue: "deliveryDate",
      cancelado: "cancelReason",
    } as const;
    if (!v[required[v.status]])
      fail(required[v.status], "Preencha o campo correspondente ao status");
    if (v.paymentMethod === "mensal") {
      if (!v.monthlyValue || v.monthlyValue > 9999999999.99)
        fail("monthlyValue", "Informe um valor mensal válido");
      if (!v.dueDay || !Number.isInteger(v.dueDay) || v.dueDay > 28)
        fail("dueDay", "Vencimento entre 1 e 28");
      if (!v.monthlyStartDate) fail("monthlyStartDate", "Informe o início");
    }
    if (v.paymentMethod === "parcelas") {
      if (
        !v.installmentCount ||
        !Number.isInteger(v.installmentCount) ||
        v.installmentCount < 2 ||
        v.installmentCount > 120
      )
        fail("installmentCount", "De 2 a 120 parcelas");
      if (!v.installmentValue || v.installmentValue > 9999999999.99)
        fail("installmentValue", "Informe valor válido");
      if (!v.firstInstallmentDate)
        fail("firstInstallmentDate", "Informe a primeira parcela");
      if (v.installmentsPaid > (v.installmentCount ?? 0))
        fail("installmentsPaid", "Parcelas pagas excedem o total");
    }
  });
export const noteSchema = z.object({
  title: text(160).min(1),
  content: text(20000).min(1),
  clientId: optionalId,
});
export const productSchema = z.object({
  name: text(160).min(1),
  priceType: z.enum(["fixo", "hora"]),
  price: amount.max(99999999.99),
  description: optionalText(5000),
  active: z.boolean().default(true),
  order: z.coerce.number().int().min(0).max(2147483647).default(0),
});
export const itemSchema = z.object({
  productId: optionalId,
  name: text(160).min(1),
  description: optionalText(5000),
  priceType: z.enum(["fixo", "hora"]),
  unitPrice: amount,
  quantity: amount.positive(),
});
export const proposalSchema = z.object({
  title: text(200).min(1),
  clientId: optionalId,
  validUntil: optionalDate,
  scope: optionalText(20000),
  conditions: optionalText(20000),
  discountValue: amount.default(0),
  discountPercent: amount.max(100).default(0),
  items: z.array(itemSchema).max(100),
});
export const tokenSchema = z.string().regex(/^[a-f0-9]{64}$/);
export const viewerSchema = z.object({ name: text(120).min(2) });
export const responseSchema = z.object({
  action: z.enum(["accept", "decline"]),
  message: optionalText(2000),
});
export type ClientInput = z.infer<typeof clientSchema>;
export type ItemInput = z.infer<typeof itemSchema>;
export type ProposalInput = z.infer<typeof proposalSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type NoteInput = z.infer<typeof noteSchema>;
export type Client = ClientInput & {
  id: number;
  document: { name: string; url: string; mime: string } | null;
  createdAt: string;
  updatedAt: string;
};
export type Product = ProductInput & { id: number };
export type Note = NoteInput & {
  id: number;
  clientName: string | null;
  updatedAt: string;
};
export type Proposal = Omit<ProposalInput, "items"> & {
  id: number;
  code: string;
  publicToken: string;
  publicUrl: string;
  status: (typeof proposalStatuses)[number];
  clientName: string | null;
  subtotal: string;
  total: string;
  viewedAt: string | null;
  respondedAt: string | null;
  clientResponse: string | null;
  viewers: { name: string; viewedAt: string }[];
  items: (ItemInput & { lineTotal: string })[];
};
