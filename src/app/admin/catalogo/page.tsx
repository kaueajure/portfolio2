import { requirePageUser } from "@/lib/server/page-auth";
import { Catalog } from "@/components/admin/notes-catalog";
import { listProducts } from "@/lib/server/catalog-notes";
export default async function Page() {
  await requirePageUser();
  return <Catalog initial={await listProducts()} />;
}
