import { Header } from "@/components/portfolio/header";
import { CinematicIntro } from "@/components/portfolio/intro/cinematic-intro";
import { Intro } from "@/components/portfolio/intro";
import { About, Projects, Stack } from "@/components/portfolio/sections";
import { GitHub } from "@/components/portfolio/github";
import { Contact } from "@/components/portfolio/contact";
import { Motion } from "@/components/portfolio/motion";
import { appUrl } from "@/lib/server/http";
import styles from "@/components/portfolio/portfolio.module.css";
export function generateMetadata() {
  const url = appUrl();
  return {
    metadataBase: new URL(url),
    alternates: { canonical: url },
    openGraph: {
      title: "Kauê Ajure — Desenvolvedor Full Stack",
      description:
        "Sistemas de gestão e produtos SaaS, da interface ao banco e ao deploy.",
      url,
      locale: "pt_BR",
      type: "website",
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: "Kauê Ajure — sistemas em corte",
        },
      ],
    },
    twitter: {
      card: "summary_large_image" as const,
      title: "Kauê Ajure — Desenvolvedor Full Stack",
      images: ["/opengraph-image"],
    },
  };
}
export default function Home() {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `try{if(location.hash||localStorage.getItem('kaue.opening.seen')==='yes'||matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.dataset.openingSkip='true'}catch(e){}`,
        }}
      />
      <noscript>
        <style>{`.cinematic-opening { display: none !important; }`}</style>
      </noscript>
      <CinematicIntro />
      <div id="portfolio-page" className={styles.site}>
        <Header />
        <main id="conteudo">
          <Intro />
          <Projects />
          <About />
          <Stack />
          <GitHub />
          <Contact />
        </main>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            mainEntity: {
              "@type": "Person",
              name: "Kauê Ajure",
              url: appUrl(),
              jobTitle: "Desenvolvedor full-stack",
              sameAs: [
                "https://github.com/kaueajure",
                "https://www.linkedin.com/in/kaueajure/",
              ],
            },
          }).replace(/</g, "\\u003c"),
        }}
      />
      <Motion />
    </>
  );
}
