import { redirect } from "next/navigation";
import { currentUser } from "@/lib/server/auth";
import { AdminNav } from "@/components/admin/nav";
export const metadata = {
  title: "Painel · Kauê Ajure",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  return (
    <div className="admin-layout">
      <AdminNav name={user.name} />
      <main id="conteudo" className="admin-main">
        {children}
      </main>
    </div>
  );
}
