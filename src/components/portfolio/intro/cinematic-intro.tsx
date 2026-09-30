"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { SoundControl } from "../sound-control";
import { audioEngine } from "@/lib/audio";
import "./opening.css";

type State = "idle" | "playing" | "complete";
export function CinematicIntro() {
  const [state, setState] = useState<State>("idle");
  const root = useRef<HTMLDivElement>(null);
  const skipButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const overlay = root.current;
    const page = document.getElementById("portfolio-page");
    if (!overlay || !page) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false;
    let running = false;
    let replaying = false;
    let timeline: gsap.core.Timeline | undefined;
    let watchdog: ReturnType<typeof setTimeout> | undefined;
    let firstFrame = 0;
    let previousFocus: HTMLElement | null = null;
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const finish = () => {
      if (!running) return;
      running = false;
      clearTimeout(watchdog);
      timeline?.kill();
      timeline = undefined;
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.documentElement.removeAttribute("data-opening-lock");
      document.documentElement.dataset.openingSkip = "true";
      page.inert = false;
      setState("complete");
      if (overlay.contains(document.activeElement))
        (!replaying &&
        previousFocus &&
        previousFocus !== document.body &&
        previousFocus.isConnected
          ? previousFocus
          : document.getElementById("hero-title")
        )?.focus({ preventScroll: true });
      if (location.hash && !replaying)
        requestAnimationFrame(() =>
          document
            .getElementById(decodeURIComponent(location.hash.slice(1)))
            ?.scrollIntoView({ behavior: "instant" }),
        );
    };
    const start = (replay = false) => {
      let seen = false;
      try {
        seen = localStorage.getItem("kaue.opening.seen") === "yes";
      } catch {}
      if (
        running ||
        reduced.matches ||
        (!replay &&
          (seen ||
            location.hash ||
            document.documentElement.dataset.openingSkip === "true"))
      ) {
        setState("complete");
        return;
      }
      replaying = replay;
      if (replay) {
        history.pushState(null, "", "#inicio");
        window.scrollTo({ top: 0, behavior: "instant" });
      }
      delete document.documentElement.dataset.openingSkip;
      previousFocus =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      running = true;
      setState("playing");
      page.inert = true;
      document.documentElement.setAttribute("data-opening-lock", "");
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      try {
        localStorage.setItem("kaue.opening.seen", "yes");
      } catch {}
      firstFrame = requestAnimationFrame(() =>
        skipButton.current?.focus({ preventScroll: true }),
      );
      watchdog = setTimeout(finish, 8000);
      void import("gsap")
        .then(({ gsap }) => {
          if (disposed || !running) return;
          const card = overlay.querySelector<HTMLElement>(".opening-card");
          const backdrop =
            overlay.querySelector<HTMLElement>(".opening-backdrop");
          const one = overlay.querySelector<HTMLElement>(".opening-one");
          const two = overlay.querySelector<HTMLElement>(".opening-two");
          const three = overlay.querySelector<HTMLElement>(".opening-three");
          const caption =
            overlay.querySelector<HTMLElement>(".opening-caption");
          const system = overlay.querySelector<HTMLElement>(".opening-system");
          const target = document.querySelector<HTMLElement>(
            "[data-opening-target]",
          );
          if (
            !card ||
            !backdrop ||
            !one ||
            !two ||
            !three ||
            !caption ||
            !target ||
            !system
          ) {
            finish();
            return;
          }
          const mobile = matchMedia("(max-width: 700px)").matches;
          const targetRect = target.getBoundingClientRect();
          const cardRect = card.getBoundingClientRect();
          const dx = targetRect.left - cardRect.left;
          const dy = targetRect.top - cardRect.top;
          const sx = targetRect.width / cardRect.width;
          const sy = targetRect.height / cardRect.height;
          gsap.set([one, two, three], { autoAlpha: 0 });
          gsap.set(card, { clearProps: "transform,opacity" });
          gsap.set(backdrop, { opacity: 1 });
          gsap.set(caption, { opacity: 1 });
          gsap.set(system, { autoAlpha: 0, x: -18 });
          timeline = gsap.timeline({
            defaults: { ease: "power2.inOut" },
            onComplete: finish,
          });
          if (mobile) {
            timeline
              .to(one, { autoAlpha: 1, duration: 0.2 }, 0)
              .to(one, { autoAlpha: 0, duration: 0.2 }, 0.55)
              .to(two, { autoAlpha: 1, duration: 0.2 }, 0.66)
              .to(system, { autoAlpha: 1, x: 0, duration: 0.28 }, 0.78)
              .to(two, { autoAlpha: 0, duration: 0.2 }, 1.23)
              .to(three, { autoAlpha: 1, duration: 0.22 }, 1.28)
              .to(system, { autoAlpha: 0, duration: 0.18 }, 1.7)
              .to([three, caption], { autoAlpha: 0, duration: 0.2 }, 1.77)
              .to(backdrop, { opacity: 0, duration: 0.45 }, 1.86)
              .to(
                card,
                {
                  x: dx,
                  y: dy,
                  scaleX: sx,
                  scaleY: sy,
                  transformOrigin: "top left",
                  duration: 0.58,
                  ease: "power3.inOut",
                },
                1.86,
              )
              .to(card, { opacity: 0, duration: 0.1 }, 2.34);
          } else {
            timeline
              .to(one, { autoAlpha: 1, duration: 0.3 }, 0)
              .to(one, { autoAlpha: 0, duration: 0.25 }, 0.9)
              .to(two, { autoAlpha: 1, duration: 0.25 }, 1.06)
              .to(card, { x: -25, scale: 1.035, duration: 0.75 }, 1.06)
              .to(system, { autoAlpha: 1, x: 0, duration: 0.48 }, 1.38)
              .to(two, { autoAlpha: 0, duration: 0.24 }, 2.1)
              .to(three, { autoAlpha: 1, duration: 0.25 }, 2.26)
              .to(three, { autoAlpha: 0, duration: 0.25 }, 3.18)
              .to(system, { autoAlpha: 0, duration: 0.3 }, 3.3)
              .to(caption, { opacity: 0, duration: 0.2 }, 3.55)
              .to(backdrop, { opacity: 0, duration: 0.8 }, 3.6)
              .to(
                card,
                {
                  x: dx,
                  y: dy,
                  scaleX: sx,
                  scaleY: sy,
                  transformOrigin: "top left",
                  duration: 0.88,
                  ease: "power3.inOut",
                },
                3.6,
              )
              .to(card, { opacity: 0, duration: 0.1 }, 4.43);
          }
          timeline.call(
            () => audioEngine.play("stage"),
            [],
            mobile ? 0.66 : 1.06,
          );
          timeline.call(
            () => audioEngine.play("reveal"),
            [],
            mobile ? 1.86 : 3.6,
          );
        })
        .catch(finish);
    };
    const onKey = (event: KeyboardEvent) => {
      if (!running) return;
      if (event.key === "Escape") {
        event.preventDefault();
        finish();
      }
      if (event.key === "Tab") {
        const buttons = Array.from(
          overlay.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"),
        );
        const first = buttons[0],
          last = buttons.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    const onHash = () => {
      if (running && location.hash) {
        replaying = false;
        finish();
      }
    };
    const onReplay = () => start(true);
    const onReduced = () => {
      if (reduced.matches) finish();
    };
    overlay.addEventListener("kaue:skip", finish);
    document.addEventListener("keydown", onKey);
    window.addEventListener("hashchange", onHash);
    window.addEventListener("popstate", onHash);
    window.addEventListener("kaue:replay-opening", onReplay);
    reduced.addEventListener("change", onReduced);
    start();
    return () => {
      disposed = true;
      cancelAnimationFrame(firstFrame);
      clearTimeout(watchdog);
      timeline?.kill();
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.documentElement.removeAttribute("data-opening-lock");
      page.inert = false;
      overlay.removeEventListener("kaue:skip", finish);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("popstate", onHash);
      window.removeEventListener("kaue:replay-opening", onReplay);
      reduced.removeEventListener("change", onReduced);
    };
  }, []);
  return (
    <div
      ref={root}
      className="cinematic-opening"
      data-state={state}
      role="dialog"
      aria-modal="true"
      aria-label="Abertura do portfólio"
    >
      <div className="opening-backdrop" aria-hidden="true">
        <div className="opening-grid" />
      </div>
      <div className="opening-caption" aria-hidden="true">
        <span>KAUÊ AJURE / SISTEMAS EM CORTE</span>
        <span>01 — 03</span>
      </div>
      <div className="opening-card" aria-hidden="true">
        <Image
          src="/projects/gestifique-kanban.png"
          width={1440}
          height={1000}
          alt=""
          priority
          sizes="(max-width: 700px) 82vw, 70vw"
        />
      </div>
      <div className="opening-system" aria-hidden="true">
        <small>POR TRÁS DA TELA</small>
        <span>Permissões → acesso</span>
        <span>Prazo → acompanhamento</span>
      </div>
      <div className="opening-story" aria-hidden="true">
        <div className="opening-one">
          <small>01 / INTERFACE</small>
          <strong>Um chamado precisa de contexto.</strong>
        </div>
        <div className="opening-two">
          <small>02 / DECISÃO</small>
          <strong>Responsável, prioridade e prazo no mesmo fluxo.</strong>
        </div>
        <div className="opening-three">
          <small>03 / SISTEMA</small>
          <strong>Interface, permissões e operação conectadas.</strong>
        </div>
      </div>
      <div className="opening-controls">
        <SoundControl />
        <button
          ref={skipButton}
          type="button"
          onClick={() => root.current?.dispatchEvent(new Event("kaue:skip"))}
        >
          Pular intro ↗
        </button>
      </div>
    </div>
  );
}
