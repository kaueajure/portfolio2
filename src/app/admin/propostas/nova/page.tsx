import { requirePageUser } from "@/lib/server/page-auth";
import { ProposalEditor } from "@/components/admin/proposals";
import { listClients } from "@/lib/server/clients";
import { listProducts } from "@/lib/server/catalog-notes";
export default async function Page() {
  await requirePageUser();
  const [clients, products] = await Promise.all([
    listClients(),
    listProducts(),
  ]);
  return (
    <ProposalEditor initial={null} clients={clients} products={products} />
  );
}
