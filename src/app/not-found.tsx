import Link from "next/link";
export default function NotFound() {
  return (
    <main id="conteudo" className="login-shell">
      <section className="surface">
        <p className="eyebrow">404</p>
        <h1>Página não encontrada.</h1>
        <p>
          Confira o endereço. Propostas canceladas ou ainda não enviadas ficam
          indisponíveis.
        </p>
        <Link className="button" href="/">
          Voltar ao portfólio
        </Link>
      </section>
    </main>
  );
}
