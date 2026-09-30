(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = () => window.matchMedia("(max-width: 720px)").matches;
  const header = document.querySelector("[data-header]");
  const menuToggle = document.querySelector(".menu-toggle");
  const navigation = document.querySelector(".site-nav");
  const navLinks = [...document.querySelectorAll('.site-nav a[href^="#"]')];
  let lenisInstance = null;
  let lastScroll = 0;

  const updateHeader = () => {
    const current = window.scrollY;
    header.classList.toggle("is-scrolled", current > 16);
    header.classList.toggle(
      "is-hidden",
      current > lastScroll && current > 140 && !navigation.classList.contains("is-open")
    );
    lastScroll = Math.max(current, 0);
  };

  const closeMenu = () => {
    navigation.classList.remove("is-open");
    header.classList.remove("menu-active");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Abrir menu");
    document.body.classList.remove("menu-open");
    lenisInstance?.start();
  };

  menuToggle.addEventListener("click", () => {
    const open = !navigation.classList.contains("is-open");
    header.classList.remove("is-hidden");
    header.classList.toggle("menu-active", open);
    navigation.classList.toggle("is-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    document.body.classList.toggle("menu-open", open);
    if (open) lenisInstance?.stop();
  });

  navLinks.forEach((link) => link.addEventListener("click", closeMenu));
  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();

  const observedSections = [...document.querySelectorAll("main section[id]")];
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      navLinks.forEach((link) => {
        const active = link.getAttribute("href") === `#${visible.target.id}`;
        link.classList.toggle("is-active", active);
        if (active) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      });
    },
    { rootMargin: "-35% 0px -50% 0px", threshold: [0, 0.2, 0.45] }
  );
  observedSections.forEach((section) => sectionObserver.observe(section));

  const initMotion = () => {
    document.documentElement.classList.add("motion-ready");

    if (reducedMotion) {
      document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
      return;
    }

    if (!window.gsap || !window.ScrollTrigger) {
      document.documentElement.classList.add("motion-unavailable");
      document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    if (window.Lenis) {
      lenisInstance = new Lenis({
        lerp: 0.1,
        smoothWheel: true,
        wheelMultiplier: 0.88,
        syncTouch: false,
        anchors: { offset: -68, lerp: 0.1 },
        stopInertiaOnNavigate: true,
        autoRaf: false
      });
      lenisInstance.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => lenisInstance.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    gsap.to(".scroll-progress span", {
      scaleX: 1,
      ease: "none",
      scrollTrigger: { start: 0, end: "max", scrub: 0.35 }
    });

    const heroIntro = gsap.timeline({ defaults: { ease: "power3.out" } });
    heroIntro
      .from(".hero-copy > *", { opacity: 0, y: 16, duration: 0.7, stagger: 0.08 }, 0)
      .from(".hero-panel", { opacity: 0, y: 18, duration: 0.75 }, 0.15);

    gsap.utils.toArray(".reveal").forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 22 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            once: true,
            onEnter: () => el.classList.add("is-visible")
          }
        }
      );
    });

    gsap.utils.toArray(".project").forEach((card) => {
      gsap.fromTo(
        card,
        { y: 28 },
        {
          y: 0,
          ease: "none",
          scrollTrigger: {
            trigger: card,
            start: "top bottom",
            end: "top 60%",
            scrub: 0.7
          }
        }
      );
    });
  };

  const initMagneticLinks = () => {
    if (reducedMotion || isMobile()) return;
    document.querySelectorAll(".magnetic").forEach((element) => {
      element.addEventListener("pointermove", (event) => {
        const bounds = element.getBoundingClientRect();
        const x = (event.clientX - bounds.left - bounds.width / 2) * 0.1;
        const y = (event.clientY - bounds.top - bounds.height / 2) * 0.1;
        element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
      element.addEventListener("pointerleave", () => {
        element.style.transform = "translate3d(0, 0, 0)";
      });
    });
  };

  const formatDate = (dateString) =>
    new Intl.DateTimeFormat("pt-BR", {
      month: "short",
      year: "numeric",
      timeZone: "America/Sao_Paulo"
    })
      .format(new Date(dateString))
      .replace(" de ", " / ");

  const updateGitHubData = async () => {
    const status = document.querySelector("[data-api-status]");
    const statusBox = status.parentElement;
    try {
      const [profileResponse, reposResponse] = await Promise.all([
        fetch("https://api.github.com/users/kaueajure", {
          headers: { Accept: "application/vnd.github+json" }
        }),
        fetch("https://api.github.com/users/kaueajure/repos?per_page=100&sort=updated", {
          headers: { Accept: "application/vnd.github+json" }
        })
      ]);
      if (!profileResponse.ok || !reposResponse.ok) throw new Error("GitHub API indisponível");

      const profile = await profileResponse.json();
      const repos = await reposResponse.json();

      document.querySelector("[data-public-repos]").textContent = profile.public_repos;
      document.querySelector("[data-account-since]").textContent = formatDate(profile.created_at);

      const featuredNames = ["alonso", "gestifique", "flixa", "portalmeta"];
      let productRepos = repos.filter((repo) => featuredNames.includes(repo.name));

      // Alonso é privado: a API pública não o retorna, então mantém entrada local.
      if (!productRepos.some((repo) => repo.name === "alonso")) {
        productRepos = [
          {
            name: "alonso",
            html_url: "https://github.com/kaueajure/alonso",
            language: "TypeScript",
            pushed_at: "2026-09-07T15:13:26Z"
          },
          ...productRepos
        ];
      }

      productRepos.sort(
        (a, b) => featuredNames.indexOf(a.name) - featuredNames.indexOf(b.name)
      );
      const languageResponses = await Promise.all(
        productRepos
          .filter((repo) => repo.languages_url)
          .map((repo) => fetch(repo.languages_url))
      );
      const languageSets = await Promise.all(
        languageResponses.map((response) => (response.ok ? response.json() : {}))
      );
      const totals = languageSets.reduce((all, current) => {
        Object.entries(current).forEach(([language, bytes]) => {
          all[language] = (all[language] || 0) + bytes;
        });
        return all;
      }, {});
      const ordered = Object.entries(totals).sort((a, b) => b[1] - a[1]);

      if (ordered.length) {
        document.querySelector("[data-primary-language]").textContent = ordered[0][0];
        const totalBytes = ordered.reduce((sum, [, bytes]) => sum + bytes, 0);
        const bars = document.querySelector("[data-language-bars]");
        bars.innerHTML = ordered
          .slice(0, 4)
          .map(([language, bytes]) => {
            const percentage = (bytes / totalBytes) * 100;
            return `<div class="language-row"><span>${language}</span><i><b style="--bar:${percentage / 100}"></b></i><small>${percentage.toFixed(1)}%</small></div>`;
          })
          .join("");
        document.querySelector("[data-language-note]").textContent = "bytes · API pública";
        requestAnimationFrame(() => {
          bars.querySelectorAll("b").forEach((bar) => {
            bar.style.transform = `scaleX(${bar.style.getPropertyValue("--bar")})`;
          });
        });
      }

      const repoList = document.querySelector("[data-repo-list]");
      repoList.innerHTML = productRepos
        .map(
          (repo) => `
        <a href="${repo.html_url}" target="_blank" rel="noreferrer">
          <span>${repo.name}</span>
          <small>${repo.language || "Código"} · ${formatDate(repo.pushed_at)}</small>
        </a>`
        )
        .join("");

      status.textContent = "Atualizado";
      statusBox.classList.remove("is-fallback");
    } catch {
      status.textContent = "Fallback local";
      statusBox.classList.add("is-fallback");
      document.querySelector("[data-language-note]").textContent = "offline";
    }
  };

  const copyButton = document.querySelector("[data-copy-email]");
  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText("kaueajure@gmail.com");
      copyButton.textContent = "Copiado";
      setTimeout(() => {
        copyButton.textContent = "Copiar e-mail";
      }, 1800);
    } catch {
      window.location.href = "mailto:kaueajure@gmail.com";
    }
  });

  window.addEventListener("load", () => {
    initMotion();
    initMagneticLinks();
    updateGitHubData();
  });
})();
