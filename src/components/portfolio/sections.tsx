import Image from "next/image";
import Link from "next/link";
import { projects, stack, type Project } from "@/lib/domain/portfolio";
import styles from "./portfolio.module.css";

export function ProjectMedia({
  project,
  index = 0,
  linked = true,
}: {
  project: Project;
  index?: number;
  linked?: boolean;
}) {
  const image = project.images[index];
  const previewClass = `${styles.productPreview} ${project.slug === "flixa" ? styles.flixaPreview : styles.portalPreview}`;
  const preview = (
    <>
      <div className={styles.previewTop}>
        <strong>{project.name}</strong>
        <span>
          {project.slug === "flixa"
            ? "Biblioteca / descoberta"
            : "Operação / obrigações"}
        </span>
      </div>
      {project.slug === "flixa" ? (
        <div className={styles.flixaContent}>
          <div>
            <small>ORGANIZE</small>
            <strong>Sua biblioteca, seus próximos títulos.</strong>
            <span>Biblioteca · Amigos · Descobrir</span>
          </div>
          <div className={styles.posterGroup} aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
        </div>
      ) : (
        <div className={styles.portalContent}>
          <div>
            <small>CONTEXTO</small>
            <strong>Demandas por município</strong>
            <p>Chamados, agenda e obrigações reunidos na operação.</p>
          </div>
          <div className={styles.portalRows} aria-hidden="true">
            <span>
              Município <b>→</b> Demandas
            </span>
            <span>
              Agenda <b>→</b> Prazos
            </span>
            <span>
              Obrigações <b>→</b> Acesso
            </span>
          </div>
        </div>
      )}
    </>
  );
  if (!image)
    return (
      <figure className={styles.media}>
        {linked ? (
          <Link
            className={previewClass}
            href={project.caseStudyHref}
            aria-label={`Ver case ${project.name}`}
          >
            {preview}
          </Link>
        ) : (
          <div className={previewClass}>{preview}</div>
        )}
        <figcaption>
          Representação editorial dos módulos documentados no código; não é
          captura do produto.
        </figcaption>
      </figure>
    );
  const picture = (
    <Image
      src={image.src}
      width={image.width}
      height={image.height}
      alt={image.alt}
      sizes="(max-width: 700px) calc(100vw - 40px), (max-width: 1000px) 85vw, 1200px"
    />
  );
  return (
    <figure className={styles.media}>
      {linked ? (
        <Link
          className={styles.mediaFrame}
          href={project.caseStudyHref}
          aria-label={`Ver case ${project.name}`}
        >
          {picture}
        </Link>
      ) : (
        <div className={styles.mediaFrame}>{picture}</div>
      )}
      <figcaption>{image.caption}</figcaption>
    </figure>
  );
}
function ProjectText({ project }: { project: Project }) {
  return (
    <div>
      <p className={styles.category}>
        {project.category} · {project.status}
      </p>
      <h3 className={styles.projectName}>
        <Link href={project.caseStudyHref}>{project.name}</Link>
      </h3>
      <p className={styles.projectSubtitle}>{project.statement}</p>
      <p className={styles.projectSummary}>{project.description}</p>
      <div className={styles.projectBottom}>
        <p>Para {project.audience.toLowerCase()}.</p>
        <Link className={styles.textLink} href={project.caseStudyHref}>
          Ver case <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </div>
  );
}
export function Projects() {
  const [lead, secondary, ...others] = projects;
  return (
    <section
      id="projetos"
      className={`${styles.projects} ${styles.section}`}
      aria-labelledby="projects-heading"
    >
      <div className={styles.container}>
        <p className={styles.label}>01 / Trabalho selecionado</p>
        <div className={styles.sectionHeading}>
          <h2 id="projects-heading">Produtos antes da arquitetura.</h2>
          <p>
            O que cada sistema resolve aparece primeiro. As decisões de
            engenharia estão nos cases.
          </p>
        </div>
        <article className={styles.feature} data-reveal>
          <div className={styles.featureHeading}>
            <ProjectText project={lead} />
            <p className={styles.projectSummary}>{lead.problem}</p>
          </div>
          <ProjectMedia project={lead} />
        </article>
        <article className={styles.asymmetric} data-reveal>
          <ProjectMedia project={secondary} />
          <ProjectText project={secondary} />
        </article>
        <div className={styles.compactGrid}>
          {others.map((project) => (
            <article className={styles.compact} data-reveal key={project.slug}>
              <ProjectMedia project={project} />
              <ProjectText project={project} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
export function About() {
  return (
    <section
      id="sobre"
      className={styles.section}
      aria-labelledby="about-heading"
    >
      <div className={`${styles.container} ${styles.aboutGrid}`}>
        <div>
          <p className={styles.label}>02 / Como penso</p>
          <h2 id="about-heading">
            Uma interface boa precisa sobreviver à operação.
          </h2>
        </div>
        <div className={styles.aboutText}>
          <p>
            Sou Kauê Ajure. Desenvolvo produtos em que a experiência de uso e as
            regras por trás dela precisam funcionar juntas: atendimento,
            catálogo, permissões e acompanhamento de demandas.
          </p>
          <div className={styles.principle}>
            <h3>Contexto antes do componente</h3>
            <p>
              Um chamado precisa mostrar responsável, prioridade e prazo para a
              equipe agir. No Gestifique, lista, Kanban e portal do cliente
              resolvem momentos diferentes desse fluxo.
            </p>
            <Link href="/projetos/gestifique#contexto">
              Ver o contexto no case ↗
            </Link>
          </div>
          <div className={styles.principle}>
            <h3>Regra de acesso faz parte do produto</h3>
            <p>
              No Portal Meta e no Gestifique, as permissões são tratadas no
              domínio e verificadas por testes, não apenas na interface.
            </p>
            <Link href="/projetos/portalmeta#decisoes">
              Ver a decisão no case ↗
            </Link>
          </div>
          <div className={styles.principle}>
            <h3>Entrega também é continuidade</h3>
            <p>
              Processos web, workers e documentação de produção tornam explícito
              o que precisa continuar funcionando depois da entrega.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
export function Stack() {
  return (
    <section
      id="stack"
      className={`${styles.stack} ${styles.section}`}
      aria-labelledby="stack-heading"
    >
      <div className={styles.container}>
        <p className={styles.label}>03 / Ferramentas em contexto</p>
        <h2 id="stack-heading">Cada tecnologia tem um trabalho.</h2>
        <div>
          {stack.map((item) => (
            <div className={styles.stackRow} key={item.name}>
              <h3>{item.name}</h3>
              <p>{item.responsibility}</p>
              <span>{item.tools}</span>
              <Link href={item.href}>Ver em {item.evidence} ↗</Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
