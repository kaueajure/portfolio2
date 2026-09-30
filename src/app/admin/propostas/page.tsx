import { requirePageUser } from "@/lib/server/page-auth";
import { Proposals } from "@/components/admin/proposals";
import { listProposals } from "@/lib/server/proposals";
export default async function Page() {
  await requirePageUser();
  return <Proposals initial={await listProposals()} />;
}
