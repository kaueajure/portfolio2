"use client";
import { useEffect, useRef, useState } from "react";
import { OpeningScenes } from "./scenes";
import { SoundControl } from "../sound-control";
import { openingTimeline } from "./timeline";
import "./opening.css";
type State = "idle" | "playing" | "skipping" | "finishing" | "complete";
export function CinematicIntro() {
  const [visit, setVisit] = useState(0);
  useEffect(() => {
    const replay = () => {
      history.pushState(null, "", "#inicio");
      window.scrollTo({ top: 0, behavior: "instant" });
      setVisit((current) => current + 1);
    };
    window.addEventListener("kaue:replay-opening", replay);
    return () => window.removeEventListener("kaue:replay-opening", replay);
  }, []);
  return <OpeningPlayback key={visit} replay={visit > 0} />;
}

function OpeningPlayback({ replay }: { replay: boolean }) {
  const [state, setState] = useState<State>("idle");
  const root = useRef<HTMLDivElement>(null);
  const skip = useRef<HTMLButtonElement>(null);
  const skipAction = useRef<() => void>(() => {});
  useEffect(() => {
    const overlay = root.current;
    const page = document.getElementById("portfolio-page");
    if (!overlay || !page) return;
    let disposed = false,
      finished = false;
    let context: gsap.Context | undefined;
    let timeline: gsap.core.Timeline | undefined;
    let exitTween: gsap.core.Timeline | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const saved = {
      bodyOverflow: document.body.style.overflow,
      htmlOverflow: document.documentElement.style.overflow,
      behavior: document.documentElement.style.scrollBehavior,
      inert: page.inert,
      pageStyle: page.getAttribute("style"),
    };
    let keyboardInteraction = previousFocus?.matches(":focus-visible") ?? false;
    let locked = false;
    let focusFrame = 0;
    const unlock = () => {
      if (!locked) return;
      locked = false;
      document.body.style.overflow = saved.bodyOverflow;
      document.documentElement.style.overflow = saved.htmlOverflow;
      document.documentElement.style.scrollBehavior = saved.behavior;
      page.inert = saved.inert;
      if (saved.pageStyle === null) page.removeAttribute("style");
      else page.setAttribute("style", saved.pageStyle);
      page.removeAttribute("data-opening-reveal");
      document.documentElement.removeAttribute("data-opening-lock");
    };
    const complete = () => {
      if (finished) return;
      finished = true;
      const focusWasInOverlay = overlay.contains(document.activeElement);
      // Hide the outgoing scene before releasing its styles and the scroll lock.
      overlay.hidden = true;
      clearTimeout(timeout);
      cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      reduced.removeEventListener("change", onReduced);
      timeline?.kill();
      exitTween?.kill();
      context?.kill(false);
      unlock();
      if (!disposed) {
        setState("complete");
        window.dispatchEvent(new Event("kaue:opening-complete"));
        if (focusWasInOverlay && keyboardInteraction) {
          const target =
            previousFocus &&
            previousFocus !== document.body &&
            previousFocus.isConnected
              ? previousFocus
              : document.getElementById("inicio");
          target?.focus({ preventScroll: true });
        }
        if (location.hash && location.hash !== "#inicio")
          requestAnimationFrame(() =>
            document
              .getElementById(decodeURIComponent(location.hash.slice(1)))
              ?.scrollIntoView({ behavior: "instant" }),
          );
      }
    };
    const onReduced = () => {
      if (reduced.matches) complete();
    };
    const onPointer = () => {
      keyboardInteraction = false;
    };
    const onKey = (event: KeyboardEvent) => {
      if (["Tab", "Escape", "Enter", " "].includes(event.key))
        keyboardInteraction = true;
      if (event.key === "Escape") {
        event.preventDefault();
        skipAction.current();
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
    const frame = requestAnimationFrame(() => {
      if (reduced.matches) {
        complete();
        return;
      }
      setState("playing");
      locked = true;
      window.dispatchEvent(new Event("kaue:opening-start"));
      page.inert = true;
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo(0, 0);
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.documentElement.setAttribute("data-opening-lock", "");
      focusFrame = requestAnimationFrame(() =>
        skip.current?.focus({ preventScroll: true }),
      );
      document.addEventListener("keydown", onKey);
      document.addEventListener("pointerdown", onPointer);
      reduced.addEventListener("change", onReduced);
      // Independent watchdog also releases the page if module loading stalls.
      timeout = setTimeout(complete, 10000);
      skipAction.current = complete;
      void Promise.all([import("gsap"), document.fonts.ready])
        .then(([{ gsap }]) => {
          if (disposed || finished) return;
          context = gsap.context(() => {}, overlay);
          context.add(() => {
            timeline = openingTimeline(
              gsap,
              overlay,
              page,
              () => {
                overlay.setAttribute("data-page-preview", "");
                page.setAttribute("data-opening-reveal", "");
              },
              () => setState("finishing"),
              complete,
            );
          });
          skipAction.current = () => {
            if (finished) return;
            setState("skipping");
            timeline?.kill();
            exitTween = gsap.timeline({ onComplete: complete });
            exitTween.to(overlay, {
              opacity: 0,
              duration: 0.3,
              ease: "power2.out",
            });
            if (page.hasAttribute("data-opening-reveal"))
              exitTween.to(
                page,
                {
                  x: 0,
                  y: 0,
                  scale: 1,
                  borderRadius: 0,
                  opacity: 1,
                  duration: 0.3,
                  ease: "power2.out",
                },
                0,
              );
          };
        })
        .catch(complete);
    });
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(focusFrame);
      clearTimeout(timeout);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      reduced.removeEventListener("change", onReduced);
      timeline?.kill();
      exitTween?.kill();
      context?.kill(false);
      overlay.removeAttribute("data-page-preview");
      unlock();
    };
  }, [replay]);
  if (state === "complete") return null;
  return (
    <div
      ref={root}
      className="cinematic-opening"
      data-state={state}
      role="dialog"
      aria-modal="true"
      aria-label="Abertura do portfólio"
    >
      <OpeningScenes />
      <div className="opening-controls">
        <SoundControl />
        <button type="button" ref={skip} onClick={() => skipAction.current()}>
          Pular intro <span aria-hidden="true">↗</span>
        </button>
      </div>
    </div>
  );
}
