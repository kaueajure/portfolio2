import "@/components/admin/application.css";
import Link from "next/link";
import { Login } from "@/components/admin/login";
export const metadata = {
  title: "Entrar · Kauê Ajure",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <main id="conteudo" className="login-shell">
      <section className="surface">
        <Login />
        <Link href="/">← Voltar ao portfólio</Link>
      </section>
    </main>
  );
}
