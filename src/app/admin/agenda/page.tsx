import { requirePageUser } from "@/lib/server/page-auth";
import { Agenda } from "@/components/admin/agenda";
import { listClients } from "@/lib/server/clients";
import { agenda } from "@/lib/domain/agenda";
export default async function Page() {
  await requirePageUser();
  return <Agenda items={agenda(await listClients())} />;
}
