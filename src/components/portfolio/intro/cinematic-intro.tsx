"use client";
import { useEffect, useRef, useState } from "react";
import { OpeningScenes } from "./scenes";
import { SoundControl } from "../sound-control";
import { openingTimeline } from "./timeline";
type State = "idle" | "playing" | "skipping" | "finishing" | "complete";
export function CinematicIntro() {
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
    let exitTween: gsap.core.Tween | undefined;
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
      clip: page.style.clipPath,
      transform: page.style.transform,
    };
    let locked = false;
    let focusFrame = 0;
    const unlock = () => {
      if (!locked) return;
      locked = false;
      document.body.style.overflow = saved.bodyOverflow;
      document.documentElement.style.overflow = saved.htmlOverflow;
      document.documentElement.style.scrollBehavior = saved.behavior;
      page.inert = saved.inert;
      page.style.clipPath = saved.clip;
      page.style.transform = saved.transform;
      page.removeAttribute("data-opening-reveal");
      document.documentElement.removeAttribute("data-opening-lock");
    };
    const complete = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", onKey);
      reduced.removeEventListener("change", onReduced);
      timeline?.kill();
      exitTween?.kill();
      context?.revert();
      unlock();
      if (!disposed) {
        setState("complete");
        if (overlay.contains(document.activeElement)) {
          const target =
            previousFocus &&
            previousFocus !== document.body &&
            previousFocus.isConnected
              ? previousFocus
              : document.getElementById("hero-title");
          target?.focus({ preventScroll: true });
        }
      }
    };
    const onReduced = () => {
      if (reduced.matches) complete();
    };
    const onKey = (event: KeyboardEvent) => {
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
        setState("complete");
        return;
      }
      setState("playing");
      locked = true;
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
      reduced.addEventListener("change", onReduced);
      // Independent watchdog also releases the page if module loading stalls.
      timeout = setTimeout(complete, 10000);
      skipAction.current = complete;
      void import("gsap")
        .then(({ gsap }) => {
          if (disposed || finished) return;
          context = gsap.context(() => {}, overlay);
          context.add(() => {
            timeline = openingTimeline(
              gsap,
              overlay,
              page,
              () => {
                setState("finishing");
                page.setAttribute("data-opening-reveal", "");
              },
              complete,
            );
          });
          skipAction.current = () => {
            if (finished) return;
            setState("skipping");
            timeline?.kill();
            context?.revert();
            page.setAttribute("data-opening-reveal", "");
            exitTween = gsap.fromTo(
              page,
              { clipPath: "inset(0px 4% round 16px)" },
              {
                clipPath: "inset(0% 0% round 0px)",
                duration: 0.3,
                ease: "power2.out",
                onComplete: complete,
              },
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
      reduced.removeEventListener("change", onReduced);
      timeline?.kill();
      exitTween?.revert();
      context?.revert();
      unlock();
    };
  }, []);
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
        <button ref={skip} onClick={() => skipAction.current()}>
          Pular intro <span aria-hidden="true">↗</span>
        </button>
      </div>
    </div>
  );
}
