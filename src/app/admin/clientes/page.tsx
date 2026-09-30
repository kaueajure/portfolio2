import { requirePageUser } from "@/lib/server/page-auth";
import { Clients } from "@/components/admin/clients";
import { listClients } from "@/lib/server/clients";
export default async function Page() {
  await requirePageUser();
  return <Clients initial={await listClients()} />;
}
