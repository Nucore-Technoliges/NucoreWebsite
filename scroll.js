const sections = document.querySelectorAll(".section");
const reveals = document.querySelectorAll(".reveal");
const dataReveals = document.querySelectorAll("[data-reveal]");
const rotatingWord = document.querySelector("[data-rotator]");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        entry.target.classList.add("revealed");
      }
    });
  },
  { threshold: 0.2 }
);

sections.forEach((section) => revealObserver.observe(section));
reveals.forEach((item) => revealObserver.observe(item));
dataReveals.forEach((item) => {
  if (item.dataset.delay) {
    item.style.transitionDelay = `${item.dataset.delay}s`;
  }
  revealObserver.observe(item);
});

if (rotatingWord) {
  const words = rotatingWord.dataset.rotator.split(",").map((word) => word.trim());
  const rotatorWrap = rotatingWord.closest(".rotator-wrap");
  let index = 0;
  let isAnimating = false;

  function measureRotatorWord(word) {
    const probe = document.createElement("span");
    probe.className = "rotator";
    probe.textContent = word;
    probe.style.cssText =
      "position:absolute;left:-9999px;visibility:hidden;white-space:nowrap;pointer-events:none;";
    const styles = getComputedStyle(rotatingWord);
    probe.style.font = styles.font;
    probe.style.letterSpacing = styles.letterSpacing;
    probe.style.textTransform = styles.textTransform;
    rotatingWord.parentElement.appendChild(probe);
    const width = probe.offsetWidth;
    probe.remove();
    return width;
  }

  function setRotatorWidth(word) {
    if (!rotatorWrap) return;
    const width = Math.ceil(measureRotatorWord(word));
    rotatorWrap.style.setProperty("--rotator-width", `${width}px`);
    rotatorWrap.style.width = `${width}px`;
  }

  function cycleRotator() {
    if (isAnimating) return;
    isAnimating = true;
    rotatingWord.classList.add("is-exiting");

    window.setTimeout(() => {
      index = (index + 1) % words.length;
      rotatingWord.textContent = words[index];
      setRotatorWidth(words[index]);
      rotatingWord.classList.remove("is-exiting");
      rotatingWord.classList.add("is-entering");

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          rotatingWord.classList.remove("is-entering");
          isAnimating = false;
        });
      });
    }, 520);
  }

  setRotatorWidth(words[index]);
  window.setInterval(cycleRotator, 3200);
}

const growthViewport = document.querySelector(".growth-viewport");

if (growthViewport) {
  const growthSteps = [...growthViewport.querySelectorAll(".growth-step")];
  const growthLine = document.querySelector(".growth-line");

  function updateGrowthPath() {
    const maxScroll = Math.max(1, growthViewport.scrollHeight - growthViewport.clientHeight);
    const progress = growthViewport.scrollTop / maxScroll;
    const activeIndex = Math.min(
      growthSteps.length - 1,
      Math.round(progress * (growthSteps.length - 1))
    );

    growthSteps.forEach((step, index) => {
      step.classList.toggle("is-active", index === activeIndex);
    });

    if (growthLine) {
      growthLine.style.setProperty("--growth-progress", `${Math.max(4, progress * 100)}%`);
    }
  }

  growthViewport.addEventListener("scroll", updateGrowthPath, { passive: true });
  updateGrowthPath();
}

document.querySelectorAll(".layer-bar").forEach((bar) => {
  bar.addEventListener("click", () => {
    const panel = bar.closest(".section")?.querySelector(".layer-panel") || document.querySelector(".layer-panel");
    const [label, title, description] = bar.dataset.panel.split("|");
    bar.parentElement.querySelectorAll(".layer-bar").forEach((item) => item.classList.remove("is-active"));
    bar.classList.add("is-active");
    if (panel) {
      panel.innerHTML = `<p>${label}</p><h2>${title}</h2><span>${description}</span>`;
    }
  });
});

const flowModal = document.querySelector(".flow-modal");
if (flowModal) {
  const modalText = flowModal.querySelector("p");
  const closeButton = flowModal.querySelector("button");
  document.querySelectorAll("[data-modal]").forEach((button) => {
    button.addEventListener("click", () => {
      modalText.textContent = button.dataset.modal;
      flowModal.hidden = false;
    });
  });
  closeButton.addEventListener("click", () => {
    flowModal.hidden = true;
  });
}

const calculator = document.querySelector("[data-calculator]");
if (calculator) {
  const gpuInput = calculator.querySelector("[data-gpu-count]");
  const gpuOutput = calculator.querySelector("output");
  const monthlyInput = calculator.querySelector("[data-monthly-cost]");
  const workloadInput = calculator.querySelector("[data-workload]");
  const providerInput = calculator.querySelector("[data-provider]");
  const nucoreCost = calculator.querySelector("[data-nucore-cost]");
  const savings = calculator.querySelector("[data-savings]");
  const delta = calculator.querySelector("[data-delta]");
  const bars = calculator.querySelectorAll(".calc-results i");

  function money(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(value);
  }

  function updateCalculator() {
    const gpuCount = Number(gpuInput.value);
    const monthlyCloud = Number(monthlyInput.value || 0);
    const workloadFactor = { training: 0.72, inference: 0.62, mixed: 0.67 }[workloadInput.value];
    const providerFactor = { aws: 1, azure: 0.97, gcp: 0.94, other: 0.9 }[providerInput.value];
    const estimated = Math.max(0, monthlyCloud * workloadFactor * providerFactor);
    const annual = Math.max(0, (monthlyCloud - estimated) * 12);
    const perf = Math.round(18 + gpuCount / 16);

    gpuOutput.textContent = gpuCount;
    nucoreCost.textContent = money(estimated);
    savings.textContent = money(annual);
    delta.textContent = `${perf}%`;
    bars[0].style.setProperty("--bar", `${Math.min(95, estimated / Math.max(1, monthlyCloud) * 100)}%`);
    bars[1].style.setProperty("--bar", `${Math.min(95, annual / Math.max(1, monthlyCloud * 12) * 100)}%`);
    bars[2].style.setProperty("--bar", `${Math.min(95, perf)}%`);
  }

  calculator.querySelectorAll("input, select").forEach((field) => {
    field.addEventListener("input", updateCalculator);
  });
  updateCalculator();
}
