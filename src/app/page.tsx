import { Suspense } from "react";
import { Header } from "@/components/portfolio/header";
import { Intro } from "@/components/portfolio/intro";
import { About, Projects, Stack } from "@/components/portfolio/sections";
import { GitHub } from "@/components/portfolio/github";
import { Contact } from "@/components/portfolio/contact";
import { Motion } from "@/components/portfolio/motion";
import { appUrl } from "@/lib/server/http";
export function generateMetadata() {
  const url = appUrl();
  return {
    metadataBase: new URL(url),
    alternates: { canonical: url },
    openGraph: {
      title: "Kauê Ajure — Desenvolvedor Full Stack",
      description:
        "Sistemas de gestão e produtos SaaS — da interface ao banco e ao deploy.",
      url,
      locale: "pt_BR",
      type: "website",
      images: [
        {
          url: "/assets/logo-preta.png",
          width: 512,
          height: 512,
          alt: "Kauê Ajure",
        },
      ],
    },
    twitter: {
      card: "summary" as const,
      title: "Kauê Ajure — Desenvolvedor Full Stack",
      images: ["/assets/logo-preta.png"],
    },
  };
}
export default function Home() {
  return (
    <>
      <Header />
      <main id="conteudo" className="portfolio">
        <Intro />
        <About />
        <Projects />
        <Stack />
        <section id="github" className="github-section section">
          <Suspense
            fallback={
              <div role="status">
                <h2>Atividade pública.</h2>
                <p>Consultando GitHub…</p>
              </div>
            }
          >
            <GitHub />
          </Suspense>
        </section>
        <Contact />
      </main>
      <Motion />
    </>
  );
}
