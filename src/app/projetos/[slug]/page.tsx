import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/portfolio/header";
import { ProjectMedia } from "@/components/portfolio/sections";
import { projects } from "@/lib/domain/portfolio";
import { appUrl } from "@/lib/server/http";
import styles from "@/components/portfolio/portfolio.module.css";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() {
  return projects.map(({ slug }) => ({ slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((item) => item.slug === slug);
  if (!project) return {};
  const url = `${appUrl()}${project.caseStudyHref}`;
  return {
    title: `${project.name} — Case · Kauê Ajure`,
    description: project.description,
    alternates: { canonical: url },
    openGraph: {
      title: `${project.name} — ${project.statement}`,
      description: project.description,
      url,
      type: "article",
      locale: "pt_BR",
      images: [
        {
          url: `${appUrl()}${project.caseStudyHref}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `Kauê Ajure — case ${project.name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${project.name} — Case · Kauê Ajure`,
      images: [`${appUrl()}${project.caseStudyHref}/opengraph-image`],
    },
  };
}
export default async function CasePage({ params }: Props) {
  const { slug } = await params;
  const project = projects.find((item) => item.slug === slug);
  if (!project) notFound();
  const next = projects[(projects.indexOf(project) + 1) % projects.length];
  return (
    <div className={styles.site}>
      <Header />
      <main id="conteudo">
        <div className={`${styles.container} ${styles.caseHero}`}>
          <Link className={styles.textLink} href="/#projetos">
            ← Todos os projetos
          </Link>
          <p className={styles.label}>{project.category} / Case</p>
          <h1>{project.name}</h1>
          <p className={styles.caseLead}>
            {project.statement} {project.description}
          </p>
          <div className={styles.caseHeroMedia}>
            <ProjectMedia project={project} linked={false} />
          </div>
          <dl className={styles.caseMeta}>
            <div>
              <dt>Para quem</dt>
              <dd>{project.audience}</dd>
            </div>
            <div>
              <dt>Meu papel</dt>
              <dd>{project.role}</dd>
            </div>
            <div>
              <dt>Disponibilidade</dt>
              <dd>{project.status}</dd>
            </div>
          </dl>
        </div>
        <div className={styles.caseBody}>
          <div className={`${styles.container} ${styles.caseLayout}`}>
            <nav className={styles.caseNav} aria-label="Neste case">
              <a href="#contexto">Contexto</a>
              <a href="#fluxo">Produto</a>
              <a href="#decisoes">Decisões</a>
              <a href="#arquitetura">Arquitetura</a>
              <a href="#validacao">Validação</a>
            </nav>
            <div className={styles.caseContent}>
              <section id="contexto">
                <p className={styles.label}>01 / Contexto</p>
                <h2>O problema</h2>
                <p>{project.problem}</p>
                <p>
                  <strong>Escopo desenvolvido:</strong> {project.scope}
                </p>
              </section>
              <section id="fluxo">
                <p className={styles.label}>02 / Produto</p>
                <h2>O que foi construído</h2>
                <p>{project.description}</p>
                {project.images.map((_, index) => (
                  <ProjectMedia
                    key={index}
                    project={project}
                    index={index}
                    linked={false}
                  />
                ))}
              </section>
              <section id="decisoes">
                <p className={styles.label}>03 / Engenharia em contexto</p>
                <h2>Decisões que sustentam o fluxo</h2>
                {project.decisions.map((decision) => (
                  <article className={styles.decision} key={decision.title}>
                    <h3>{decision.title}</h3>
                    <p>{decision.description}</p>
                    {decision.evidence && (
                      <a
                        href={decision.evidence}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Examinar no repositório ↗
                      </a>
                    )}
                  </article>
                ))}
              </section>
              <section id="arquitetura">
                <p className={styles.label}>04 / Estrutura</p>
                <h2>Camadas com responsabilidade</h2>
                <p>
                  Esta visão resume as partes relacionadas ao produto
                  apresentado acima.
                </p>
                <ol className={styles.architecture}>
                  {project.architecture.map((layer) => (
                    <li key={layer.name}>
                      <strong>{layer.name}</strong>
                      <p>{layer.responsibility}</p>
                    </li>
                  ))}
                </ol>
                <h3>Ferramentas utilizadas</h3>
                <ul className={styles.techList}>
                  {project.stack.map((tool) => (
                    <li key={tool}>{tool}</li>
                  ))}
                </ul>
              </section>
              <section id="validacao">
                <p className={styles.label}>05 / Evidência e limites</p>
                <h2>O que é verificável</h2>
                <p>{project.validation}</p>
                <p>
                  <strong>Limitações:</strong> {project.limitations}
                </p>
                <div className={styles.caseLinks}>
                  {project.repositoryHref && (
                    <a
                      className={styles.primary}
                      href={project.repositoryHref}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Ver código público ↗
                    </a>
                  )}
                  {project.liveHref && (
                    <a
                      className={styles.textLink}
                      href={project.liveHref}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Abrir produto ↗
                    </a>
                  )}
                </div>
              </section>
              <div className={styles.nextProject}>
                <p className={styles.label}>Próximo case</p>
                <Link href={next.caseStudyHref}>
                  {next.name}
                  <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
