import type { gsap as Gsap } from "gsap";
import { audioEngine } from "@/lib/audio";
export function openingTimeline(
  gsap: typeof Gsap,
  root: HTMLElement,
  page: HTMLElement,
  finishing: () => void,
  complete: () => void,
) {
  const q = gsap.utils.selector(root);
  const mobile = window.matchMedia("(max-width: 600px)").matches;
  const viewportHeight = window.innerHeight;
  const maskBottom = Math.max(0, page.scrollHeight - viewportHeight);
  const packetTravel = root.querySelector(".opening-services")!.clientWidth - 8;
  const tl = gsap.timeline({
    defaults: { ease: "power3.inOut" },
    onComplete: complete,
  });
  tl.from(q(".opening-boot"), { y: 16, opacity: 0, duration: 0.4 }, 0)
    .from(
      q(".opening-boot small"),
      { clipPath: "inset(0 100% 0 0)", duration: 0.45 },
      0.25,
    )
    .call(() => audioEngine.play("boot"), [], 0.1)
    .to(
      q(".opening-boot"),
      { y: -90, scale: 0.85, opacity: 0, duration: 0.45 },
      0.75,
    )
    .from(
      q(".opening-workspace"),
      {
        y: 80,
        scale: 0.8,
        rotationY: mobile ? 0 : -12,
        opacity: 0,
        duration: 0.65,
      },
      0.65,
    )
    .from(
      q(".opening-file"),
      { x: -18, opacity: 0, stagger: 0.065, duration: 0.22 },
      0.85,
    )
    .from(
      q(".opening-code"),
      { clipPath: "inset(0 100% 0 0)", x: 12, stagger: 0.12, duration: 0.3 },
      1.35,
    )
    .from(
      q(".opening-autocomplete"),
      { y: 10, opacity: 0, duration: 0.25 },
      1.95,
    )
    .call(() => audioEngine.play("code"), [], 1.4)
    .to(
      q(".opening-workspace"),
      {
        xPercent: mobile ? 0 : -18,
        yPercent: mobile ? -25 : -8,
        scale: 0.8,
        rotationY: mobile ? 0 : -18,
        opacity: 0.25,
        duration: 0.8,
      },
      2.45,
    );
  // The same code-labelled rectangles travel from the editor and expand into layout modules.
  const modules = gsap.utils.toArray<HTMLElement>(q(".opening-module"));
  const editor = root.querySelector(".opening-editor")!.getBoundingClientRect();
  const boxes = modules.map((el) => el.getBoundingClientRect());
  modules.forEach((el, i) => {
    const box = boxes[i];
    tl.from(
      el,
      {
        x: editor.left + 30 - box.left,
        y: editor.top + 110 + i * 22 - box.top,
        scaleX: Math.min(280 / box.width, 1),
        scaleY: 24 / box.height,
        backgroundColor: "#263c4b",
        borderRadius: 0,
        opacity: 0,
        duration: 0.85,
        ease: "expo.inOut",
      },
      2.5 + i * 0.09,
    );
  });
  tl.call(() => audioEngine.play("snap"), [], 2.8)
    .from(
      q(".opening-module > span, .opening-module > p"),
      { y: 18, opacity: 0, stagger: 0.06, duration: 0.45 },
      3.05,
    )
    .to(q(".opening-module code"), { opacity: 0, duration: 0.3 }, 3.65)
    .to(
      q(".opening-workspace"),
      { opacity: 0, scale: 0.6, duration: 0.5 },
      3.15,
    )
    .from(q(".opening-backend"), { y: 45, opacity: 0, duration: 0.45 }, 3.8)
    .from(
      q(".opening-services > div"),
      { scale: 0.8, opacity: 0, stagger: 0.07, duration: 0.3 },
      3.95,
    )
    .fromTo(
      q(".opening-packet"),
      { x: 0 },
      { x: packetTravel, duration: 0.65, ease: "power2.inOut" },
      4.2,
    )
    .from(
      q(".opening-query"),
      { clipPath: "inset(0 100% 0 0)", duration: 0.45 },
      4.65,
    )
    .call(() => audioEngine.play("request"), [], 4.2)
    .to(
      q(".opening-layout"),
      { scale: 0.96, y: mobile ? -25 : -35, duration: 0.6 },
      4.9,
    )
    .to(q(".opening-backend"), { y: 40, opacity: 0, duration: 0.4 }, 5.25)
    .from(
      q(".opening-build > span"),
      { y: 15, opacity: 0, stagger: 0.09, duration: 0.25 },
      5.3,
    )
    .from(
      q(".opening-build strong"),
      { scale: 0.8, opacity: 0, duration: 0.45, ease: "expo.out" },
      5.8,
    )
    .call(() => audioEngine.play("build"), [], 5.85)
    .to(q(".opening-layout"), { scale: 1.3, duration: 0.85 }, 6.1)
    .to(q(".opening-build"), { y: -50, opacity: 0, duration: 0.5 }, 6.35)
    .to(q(".opening-layout"), { opacity: 0, duration: 0.12 }, 6.4)
    .call(finishing, [], 6.4)
    .call(() => audioEngine.play("reveal"), [], 6.4)
    .fromTo(
      page,
      {
        clipPath: `inset(0px 0% ${maskBottom}px 0% round 24px)`,
        transform: `translateY(${viewportHeight * 0.17}px) scale(${mobile ? 0.84 : 0.62})`,
      },
      {
        clipPath: "inset(0px 0% 0px 0% round 0px)",
        transform: "scale(1)",
        duration: 1.35,
        ease: "expo.inOut",
      },
      6.4,
    )
    .fromTo(
      page.querySelector(".site-header"),
      { y: -25, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6 },
      7.05,
    );
  gsap.set(q(".opening-art"), { visibility: "visible" });
  if (mobile) tl.timeScale(1.42);
  return tl;
}
