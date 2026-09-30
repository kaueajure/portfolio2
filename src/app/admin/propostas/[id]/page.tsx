import { requirePageUser } from "@/lib/server/page-auth";
import { notFound } from "next/navigation";
import { ProposalEditor } from "@/components/admin/proposals";
import { listClients } from "@/lib/server/clients";
import { listProducts } from "@/lib/server/catalog-notes";
import { getProposal, expireProposals } from "@/lib/server/proposals";
import { idSchema } from "@/lib/domain/schemas";
import { HttpError } from "@/lib/server/http";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageUser();
  const id = idSchema.safeParse((await params).id);
  if (!id.success) notFound();
  await expireProposals();
  const [initial, clients, products] = await Promise.all([
    getProposal(id.data),
    listClients(),
    listProducts(),
  ]).catch((e) => {
    if (e instanceof HttpError && e.status === 404) notFound();
    throw e;
  });
  return (
    <ProposalEditor initial={initial} clients={clients} products={products} />
  );
}
