"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="conteudo" className="login-shell">
      <section className="surface">
        <h1>Não foi possível carregar esta página.</h1>
        <p>
          Tente novamente. Se o problema continuar, verifique a conexão e a
          configuração do servidor.
        </p>
        <button onClick={reset}>Tentar novamente</button>
        <Link className="button" href="/">
          Voltar ao portfólio
        </Link>
      </section>
    </main>
  );
}
