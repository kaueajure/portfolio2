"use client";
import { useEffect, useRef } from "react";
import { audioEngine } from "@/lib/audio";
export function Intro() {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    let disposed = false;
    let revert: (() => void) | undefined;
    async function start() {
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      try {
        const [{ gsap }, { ScrollTrigger }] = await Promise.all([
          import("gsap"),
          import("gsap/ScrollTrigger"),
        ]);
        if (disposed) return;
        gsap.registerPlugin(ScrollTrigger);
        const mm = gsap.matchMedia();
        mm.add(
          {
            desktop: "(min-width: 900px)",
            mobile: "(max-width: 899px)",
            motion: "(prefers-reduced-motion: no-preference)",
          },
          (context) => {
            if (!context.conditions?.motion) return;
            const desktop = context.conditions.desktop;
            let stage = -1;
            const timeline = gsap.timeline({
              scrollTrigger: {
                trigger: root.current,
                start: "top top",
                end: desktop ? "+=190%" : "+=50%",
                pin: desktop
                  ? root.current?.querySelector(".intro-pin")
                  : false,
                scrub: 0.6,
                onUpdate: (self) => {
                  root.current?.style.setProperty(
                    "--intro-progress",
                    String(self.progress),
                  );
                  const next = Math.min(4, Math.floor(self.progress * 5));
                  if (next !== stage) {
                    stage = next;
                    root.current?.setAttribute("data-stage", String(stage));
                    audioEngine.play("stage");
                  }
                },
              },
            });
            timeline
              .to(
                ".code-active",
                { backgroundColor: "#b9d5e6", duration: 0.4 },
                0,
              )
              .fromTo(
                ".build-fragment",
                { scaleX: 0.05, opacity: 0 },
                { scaleX: 1, opacity: 0.7, stagger: 0.12, duration: 0.7 },
                0.5,
              )
              .to(
                ".code-window",
                {
                  xPercent: -35,
                  yPercent: -30,
                  rotation: -7,
                  opacity: 0.25,
                  duration: 1,
                },
                0.4,
              )
              .to(
                ".tree-window",
                { xPercent: 30, yPercent: 20, opacity: 0.15, duration: 1 },
                0,
              )
              .fromTo(
                ".architecture-node",
                { y: 20, scale: 0.8 },
                { y: 0, scale: 1, stagger: 0.12, duration: 1 },
                0.3,
              )
              .to(".architecture-line", { scaleX: 1, duration: 1 }, 0.6)
              .to(
                ".build-fragment",
                {
                  y: 100,
                  scaleX: 0.3,
                  opacity: 0,
                  stagger: 0.1,
                  duration: 0.7,
                },
                1.4,
              )
              .to(
                ".code-window,.tree-window",
                { scale: 0.6, opacity: 0, duration: 1 },
                1.3,
              )
              .to(
                ".hero-name",
                { scale: 1.06, yPercent: -5, duration: 1.3 },
                1.3,
              )
              .to(".hero-caption", { opacity: 1, duration: 0.8 }, 1.5);
          },
        );
        revert = () => mm.revert();
      } catch {
        root.current?.setAttribute("data-motion", "unavailable");
      }
    }
    void start();
    return () => {
      disposed = true;
      revert?.();
    };
  }, []);
  return (
    <section
      ref={root}
      id="inicio"
      className="intro"
      aria-labelledby="hero-title"
    >
      <div className="intro-pin">
        <div className="intro-grid" aria-hidden="true" />
        <div className="intro-topline">
          <span>DESENVOLVEDOR FULL STACK</span>
          <span>
            DISPONÍVEL PARA PROJETOS <i />
          </span>
        </div>
        <div className="workbench" aria-hidden="true">
          <div className="build-fragments">
            <i className="build-fragment" />
            <i className="build-fragment" />
            <i className="build-fragment" />
          </div>
          <div className="code-window">
            <div className="window-bar">
              <span>app / page.tsx</span>
              <span>main ↗</span>
            </div>
            <pre>
              <span className="code-muted">
                {"// Da interface à operação\n"}
              </span>
              <span>{"export default async function Page() {\n"}</span>
              <span className="code-active">
                {"  const projects = await getProjects();\n"}
              </span>
              <span>{"  return <Portfolio projects={projects} />;\n}"}</span>
            </pre>
          </div>
          <div className="tree-window">
            <span className="window-bar">portfolio/</span>
            <pre>{"├─ app/\n├─ components/\n├─ services/\n└─ db/"}</pre>
            <span className="branch">⑂ main · interface pronta</span>
          </div>
        </div>
        <div className="hero-copy">
          <p className="eyebrow">Código. Produto. Operação.</p>
          <h1 id="hero-title" className="hero-name">
            Kauê <span>Ajure</span>
            <span className="hero-period">.</span>
          </h1>
          <div className="hero-bottom">
            <p>
              Sistemas de gestão e produtos SaaS — da interface ao banco e ao
              deploy.
            </p>
            <div className="actions">
              <a className="button primary magnetic" href="#projetos">
                Ver projetos <span>↗</span>
              </a>
              <a className="button ghost magnetic" href="#contato">
                Falar comigo
              </a>
            </div>
          </div>
        </div>
        <div
          className="architecture"
          aria-label="Interface, API, Banco, Worker e Deploy"
        >
          <div className="architecture-line" aria-hidden="true" />
          {["Interface", "API", "Banco", "Worker", "Deploy"].map((n, i) => (
            <div className="architecture-node" key={n}>
              <small>0{i + 1}</small>
              <strong>{n}</strong>
            </div>
          ))}
        </div>
        <div className="intro-footer">
          <span className="hero-caption">
            React / Next.js / TypeScript
            <br />
            Node.js / MySQL / tempo real
          </span>
          <span className="scroll-cue">
            SCROLL PARA CONSTRUIR <span>↓</span>
          </span>
          <span>
            API / workers / Linux / deploy
            <br />
            SaaS · gestão · operação
          </span>
        </div>
        <div className="build-status" aria-hidden="true">
          {[
            "01 / inicializando interface",
            "02 / conectando componentes",
            "03 / interface → API → dados",
            "04 / construindo a experiência",
            "05 / pronto para explorar",
          ].map((label, index) => (
            <span key={label} className={`build-step step-${index}`}>
              {label}
            </span>
          ))}
          <div className="build-progress" />
        </div>
      </div>
    </section>
  );
}
