function splitHeadlines() {
  document.querySelectorAll(".headline-split").forEach((headline) => {
    const rawLines = headline.innerHTML.split(/<br\s*\/?>/i);
    headline.innerHTML = rawLines.map((line) => {
      const template = document.createElement("template");
      template.innerHTML = line.trim();
      const text = template.content.textContent || "";
      const words = text.split(/\s+/).filter(Boolean).map((word) => `<span class="word">${word}</span>`).join(" ");
      return `<span class="line-mask">${words}</span>`;
    }).join("");
  });
}

function revealHeadline(headline) {
  const lines = [...headline.querySelectorAll(".line-mask")];
  const baseDelay = Number(headline.dataset.delay || 0) * 1000;
  let offset = 0;
  lines.forEach((line, lineIndex) => {
    const words = [...line.querySelectorAll(".word")];
    words.forEach((word, wordIndex) => {
      window.setTimeout(() => word.classList.add("revealed"), baseDelay + offset + lineIndex * 120 + wordIndex * 60);
    });
    offset += words.length * 60;
  });
}

function animateCount(el) {
  if (el.dataset.counted) return;
  el.dataset.counted = "true";
  const text = el.textContent.trim();
  const match = text.match(/^(\d+(?:\.\d+)?)(.*)$/);
  if (!match) return;
  const target = Number(match[1]);
  const suffix = match[2];
  const start = performance.now();
  const duration = 1400;
  function frame(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = `${Math.round(target * eased)}${suffix}`;
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function typeDashboard(card) {
  if (card.dataset.typed) return;
  card.dataset.typed = "true";
  [...card.querySelectorAll(".dash-row")].forEach((row, index) => {
    window.setTimeout(() => row.classList.add("is-typed"), 300 + index * 100);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  splitHeadlines();

  document.querySelectorAll("[data-delay]").forEach((el) => {
    el.style.transitionDelay = `${el.dataset.delay}s`;
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      if (el.classList.contains("headline-split")) revealHeadline(el);
      if (el.classList.contains("list-reveal")) {
        [...el.querySelectorAll("li")].forEach((li, index) => {
          window.setTimeout(() => li.classList.add("revealed"), index * 90);
        });
      } else {
        el.classList.add("revealed");
      }
      if (el.classList.contains("count-up")) animateCount(el);
      if (el.classList.contains("control-plane")) {
        typeDashboard(el);
        el.querySelectorAll(".count-up").forEach(animateCount);
      }
      observer.unobserve(el);
    });
  }, { threshold: 0.15 });

  document.querySelectorAll("[data-reveal], .list-reveal, .draw-line, .headline-split, .count-up, .stack-bar").forEach((el) => observer.observe(el));

  // Overview visual switcher
  const ovItems = document.querySelectorAll(".overview-item[data-visual]");
  if (ovItems.length) {
    const ovPanels = {};
    document.querySelectorAll(".ov-panel").forEach((el) => {
      const key = [...el.classList].find((c) => c.startsWith("ov-panel-"))?.replace("ov-panel-", "");
      if (key) ovPanels[key] = el;
    });
    const ovObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.45) {
          const key = entry.target.dataset.visual;
          Object.values(ovPanels).forEach((p) => p.classList.remove("is-active"));
          if (ovPanels[key]) ovPanels[key].classList.add("is-active");
        }
      });
    }, { threshold: 0.45 });
    ovItems.forEach((item) => ovObserver.observe(item));
  }

  document.querySelectorAll(".word-cycle").forEach((cycle) => {
    const words = [...cycle.querySelectorAll("span")];
    let index = 0;
    words[0]?.classList.add("is-visible");
    window.setInterval(() => {
      const current = words[index];
      index = (index + 1) % words.length;
      const next = words[index];
      current.classList.remove("is-visible");
      current.classList.add("is-exiting");
      next.classList.add("is-visible");
      window.setTimeout(() => current.classList.remove("is-exiting"), 400);
    }, 2800);
  });

  document.querySelectorAll(".form-card").forEach((form) => {
    form.addEventListener("submit", (event) => event.preventDefault());
  });

  // Scroll-driven motion for feature panels (Rubin / Orion / Titan)
  const fpPanels = [...document.querySelectorAll("[data-fp]")];
  if (fpPanels.length) {
    let fpTicking = false;
    const updateFp = () => {
      const vh = window.innerHeight || 1;
      fpPanels.forEach((panel) => {
        const rect = panel.getBoundingClientRect();
        // progress 0 when panel top is below viewport, 1 when panel bottom is above viewport
        const raw = 1 - (rect.top + rect.height * 0.4) / vh;
        const p = Math.max(0, Math.min(1, raw));
        panel.style.setProperty("--fp-progress", p.toFixed(3));
      });
      fpTicking = false;
    };
    const onScrollFp = () => {
      if (!fpTicking) { window.requestAnimationFrame(updateFp); fpTicking = true; }
    };
    window.addEventListener("scroll", onScrollFp, { passive: true });
    window.addEventListener("resize", onScrollFp);
    updateFp();
  }

  document.querySelectorAll(".anchor-pills a").forEach((anchor) => {
    anchor.addEventListener("click", () => {
      document.querySelectorAll(".anchor-pills a").forEach((a) => a.classList.remove("is-active"));
      anchor.classList.add("is-active");
    });
  });
});
