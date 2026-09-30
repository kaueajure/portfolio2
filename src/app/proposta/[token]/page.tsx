import Link from "next/link";
import { notFound } from "next/navigation";
import { tokenSchema } from "@/lib/domain/schemas";
import { publicPreview } from "@/lib/server/proposals";
import { HttpError } from "@/lib/server/http";
import { PublicView } from "@/components/proposals/public";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Proposta · Kauê Ajure",
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};
export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const parsed = tokenSchema.safeParse((await params).token);
  if (!parsed.success) notFound();
  const preview = await publicPreview(parsed.data).catch((e) => {
    if (e instanceof HttpError && e.status === 404) notFound();
    throw e;
  });
  return (
    <main id="conteudo" className="proposal-shell">
      <Link className="brand" href="/">
        Kauê Ajure
      </Link>
      <PublicView token={parsed.data} preview={preview} />
    </main>
  );
}
