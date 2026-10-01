import { requirePageUser } from "@/lib/server/page-auth";
import { PdfTools } from "@/components/admin/pdf";
import { capabilities } from "@/lib/pdf/processor";
export default async function Page() {
  await requirePageUser();
  const caps = await capabilities();
  return <PdfTools capabilities={caps.tools} />;
}
