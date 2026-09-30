import { redirect, notFound } from "next/navigation";
import { tokenSchema } from "@/lib/domain/schemas";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const token = tokenSchema.safeParse((await searchParams).t);
  if (!token.success) notFound();
  redirect(`/proposta/${token.data}`);
}
