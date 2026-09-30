import { requirePageUser } from "@/lib/server/page-auth";
import { Notes } from "@/components/admin/notes-catalog";
import { listClients } from "@/lib/server/clients";
import { listNotes } from "@/lib/server/catalog-notes";
export default async function Page() {
  await requirePageUser();
  const [initial, clients] = await Promise.all([listNotes(), listClients()]);
  return <Notes initial={initial} clients={clients} />;
}
