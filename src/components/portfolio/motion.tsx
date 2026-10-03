"use client";
import { useEffect } from "react";
export function Motion() {
  useEffect(() => {
    let disposed = false;
    let generation = 0;
    let frame = 0;
    let revert: (() => void) | undefined;
    const stop = () => {
      generation += 1;
      cancelAnimationFrame(frame);
      revert?.();
      revert = undefined;
    };
    const start = () => {
      stop();
      const current = generation;
      // Let the final opening frame paint before measuring scroll triggers.
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          void Promise.all([import("gsap"), import("gsap/ScrollTrigger")])
            .then(([{ gsap }, { ScrollTrigger }]) => {
              if (disposed || generation !== current) return;
              gsap.registerPlugin(ScrollTrigger);
              const mm = gsap.matchMedia();
              mm.add("(prefers-reduced-motion: no-preference)", () => {
                gsap.utils
                  .toArray<HTMLElement>("[data-reveal]")
                  .forEach((element) => {
                    gsap.from(element, {
                      y: 14,
                      duration: 0.55,
                      ease: "power2.out",
                      clearProps: "all",
                      scrollTrigger: {
                        trigger: element,
                        start: "top 94%",
                        once: true,
                      },
                    });
                  });
              });
              revert = () => mm.revert();
            })
            .catch(() => {});
        });
      });
    };
    window.addEventListener("kaue:opening-start", stop);
    window.addEventListener("kaue:opening-complete", start);
    if (!document.querySelector(".cinematic-opening:not([hidden])")) start();
    return () => {
      disposed = true;
      window.removeEventListener("kaue:opening-start", stop);
      window.removeEventListener("kaue:opening-complete", start);
      stop();
    };
  }, []);
  return null;
}
