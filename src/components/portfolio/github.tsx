import { projects } from "@/lib/domain/portfolio";
import styles from "./portfolio.module.css";
const publicProjects = projects.filter((project) => project.repositoryHref);
export function GitHub() {
  return (
    <section
      id="codigo"
      className={`${styles.codeSection} ${styles.section}`}
      aria-labelledby="code-heading"
    >
      <span id="github" className={styles.anchorAlias} aria-hidden="true" />
      <div className={`${styles.container} ${styles.codeGrid}`}>
        <div>
          <p className={styles.label}>04 / Evidência</p>
          <h2 id="code-heading">Código público.</h2>
          <p>
            Repositórios, testes e documentação ajudam a examinar as decisões
            por trás das interfaces. Projetos privados não aparecem como prova
            pública.
          </p>
          <a
            className={styles.textLink}
            href="https://github.com/kaueajure"
            target="_blank"
            rel="noreferrer"
          >
            Perfil no GitHub ↗
          </a>
        </div>
        <div>
          {publicProjects.map((project) => (
            <a
              className={styles.repo}
              key={project.slug}
              href={project.repositoryHref}
              target="_blank"
              rel="noreferrer"
            >
              <span>
                <strong>{project.name}</strong>
                <small>{project.evidenceLabel}</small>
              </span>
              <span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
