import { githubData } from "@/lib/server/github";
import { projects } from "@/lib/domain/portfolio";
export async function GitHub() {
  const data = await githubData();
  return (
    <>
      <header className="page-head">
        <div>
          <p className="section-label">GitHub / código em movimento</p>
          <h2>Atividade pública.</h2>
        </div>
        <span className="api-status">
          {data.online ? "API atualizada" : "Fallback local · API indisponível"}
        </span>
      </header>
      <div className="github-layout">
        <div className="github-metrics">
          <div>
            <strong>{data.count ?? "—"}</strong>
            <span>Repositórios públicos</span>
          </div>
          <div>
            <strong>{data.primary}</strong>
            <span>Linguagem principal</span>
          </div>
          <div>
            <strong>
              {data.since
                ? new Intl.DateTimeFormat("pt-BR", {
                    month: "short",
                    year: "numeric",
                  }).format(new Date(data.since))
                : "—"}
            </strong>
            <span>Conta criada em</span>
          </div>
        </div>
        <div>
          <h3>Linguagens</h3>
          {data.languages.length ? (
            data.languages.map((l) => (
              <div className="language" key={l.name}>
                <span>{l.name}</span>
                <progress max={100} value={l.percent} aria-label={l.name} />
                <small>{l.percent.toFixed(1)}%</small>
              </div>
            ))
          ) : (
            <p>
              TypeScript é a base dos projetos apresentados. Distribuição
              indisponível.
            </p>
          )}
          <div className="github-repos">
            {projects.map((p) => (
              <a
                key={p.slug}
                href={`https://github.com/kaueajure/${p.slug}`}
                target="_blank"
                rel="noreferrer"
              >
                <span>{p.name}</span>
                <small>
                  {data.publicNames.includes(p.slug)
                    ? "Repositório público"
                    : "Projeto selecionado"}{" "}
                  ↗
                </small>
              </a>
            ))}
          </div>
        </div>
      </div>
      <a
        className="github-profile"
        href="https://github.com/kaueajure"
        target="_blank"
        rel="noreferrer"
      >
        Ver perfil no GitHub <span>↗</span>
      </a>
    </>
  );
}
