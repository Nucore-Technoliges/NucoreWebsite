const configurator = document.querySelector("[data-configurator]");

if (configurator) {
  const cards = [...configurator.querySelectorAll("[data-product]")];
  const specs = configurator.querySelector("[data-specs]");
  const summary = configurator.querySelector("[data-summary]");
  const densityBar = configurator.querySelector("[data-density-bar]");
  const profile = configurator.querySelector("[data-profile]");
  const request = configurator.querySelector("[data-request-config]");

  let state = {
    product: "vera-rubin",
    memory: 256,
    cores: 6,
    cooling: "Liquid",
    workload: ["Inference"],
    interface: "PCIe"
  };

  const names = { "vera-rubin": "Vera Rubin", blackwell: "Blackwell", "5090ti": "5090Ti" };
  const memorySteps = [128, 256, 512, 1024];

  function renderSpecs() {
    specs.classList.remove("is-visible");
    window.setTimeout(() => {
      if (state.product === "5090ti") {
        specs.innerHTML = `
          <div class="config-field"><label>Memory</label><div class="config-toggle">${["24GB", "48GB"].map(v => `<button type="button" data-set="memory5090" data-value="${v}" class="${state.memory === v ? "is-active" : ""}">${v}</button>`).join("")}</div></div>
          <div class="config-field"><label>Cooling</label><div class="config-toggle">${["Air", "Liquid"].map(v => `<button type="button" data-set="cooling" data-value="${v}" class="${state.cooling === v ? "is-active" : ""}">${v}</button>`).join("")}</div></div>
          <div class="config-field"><label>Interface</label><div class="config-toggle">${["PCIe", "NVLink"].map(v => `<button type="button" data-set="interface" data-value="${v}" class="${state.interface === v ? "is-active" : ""}">${v}</button>`).join("")}</div></div>`;
      } else {
        specs.innerHTML = `
          <div class="config-field">
            <label>Memory</label>
            <input type="range" min="0" max="3" step="1" value="${memorySteps.indexOf(state.memory)}" data-set="memory">
            <div class="config-range-labels"><span>Inference</span><span>Training</span><span>Fine-tuning</span><span>Hyperscale</span></div>
          </div>
          <div class="config-field"><label>Core Count</label><select data-set="cores">${[4, 6, 8].map(v => `<option value="${v}" ${state.cores === v ? "selected" : ""}>${v} GPUs</option>`).join("")}</select></div>
          <div class="config-field"><label>Cooling</label><div class="config-toggle">${["Air", "Liquid", "Immersion"].map(v => `<button type="button" data-set="cooling" data-value="${v}" class="${state.cooling === v ? "is-active" : ""}">${v}</button>`).join("")}</div></div>
          <div class="config-field"><label>Workload</label><div class="config-pills">${["Inference", "Training", "Fine-tuning", "Agentic"].map(v => `<button type="button" data-set="workload" data-value="${v}" class="${state.workload.includes(v) ? "is-active" : ""}">${v}</button>`).join("")}</div></div>`;
      }
      bindControls();
      specs.classList.add("is-visible");
      updateOutput();
    }, 160);
  }

  function density() {
    if (state.product === "5090ti") return state.memory === "48GB" ? 46 : 31;
    const memoryScore = { 128: 24, 256: 42, 512: 66, 1024: 88 }[state.memory];
    const coreScore = state.cores * 6;
    const coolScore = { Air: 4, Liquid: 12, Immersion: 20 }[state.cooling];
    return Math.min(96, Math.round(memoryScore * 0.55 + coreScore * 0.45 + coolScore));
  }

  function profileText(value) {
    if (value > 78) return "Max Density";
    if (value > 55) return "High Throughput";
    return "Balanced";
  }

  function updateOutput() {
    const d = density();
    densityBar.style.width = `${d}%`;
    const text = profileText(d);
    profile.textContent = text;
    profile.classList.toggle("is-max", text === "Max Density");
    if (state.product === "5090ti") {
      summary.textContent = `${names[state.product]} · ${state.memory} · ${state.cooling} · ${state.interface}`;
    } else {
      summary.textContent = `${names[state.product]} · ${state.memory === 1024 ? "1TB" : `${state.memory}GB`} · ${state.cores} GPUs · ${state.cooling} · ${state.workload.join(", ")}`;
    }
  }

  function bindControls() {
    specs.querySelectorAll("[data-set]").forEach((control) => {
      const type = control.dataset.set;
      const eventName = control.tagName === "SELECT" || control.type === "range" ? "input" : "click";
      control.addEventListener(eventName, () => {
        if (type === "memory") state.memory = memorySteps[Number(control.value)];
        if (type === "memory5090") state.memory = control.dataset.value;
        if (type === "cores") state.cores = Number(control.value);
        if (type === "cooling") state.cooling = control.dataset.value;
        if (type === "interface") state.interface = control.dataset.value;
        if (type === "workload") {
          const value = control.dataset.value;
          state.workload = state.workload.includes(value) ? state.workload.filter((item) => item !== value) : [...state.workload, value];
          if (!state.workload.length) state.workload = [value];
        }
        if (type !== "memory" && type !== "cores") renderSpecs();
        updateOutput();
      });
    });
  }

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      state.product = card.dataset.product;
      cards.forEach((item) => item.classList.toggle("is-selected", item === card));
      if (state.product === "5090ti") {
        state.memory = "24GB";
        state.cooling = "Air";
        state.interface = "PCIe";
      } else {
        state.memory = 256;
        state.cores = 6;
        state.cooling = "Liquid";
        state.workload = ["Inference"];
      }
      renderSpecs();
    });
  });

  request?.addEventListener("click", () => {
    window.location.href = `contact.html?product=${encodeURIComponent(names[state.product])}`;
  });

  cards[0]?.classList.add("is-selected");
  renderSpecs();
}

const layerPanel = document.querySelector("[data-layer-panel]");
const layerContent = {
  applications: ["Business Applications", "Helios, Aegis, and Nexus sit above the infrastructure. They turn model capacity into workflows for teams that need operational AI systems.", "Helios · Aegis · Nexus"],
  orchestration: ["Titan LLM + Orchestration", "Titan handles model routing, memory management, and cluster policy. It keeps workloads moving across the available compute.", "Titan LLM · Routing policy · Memory manager"],
  software: ["Infrastructure Software", "The infrastructure layer controls scheduling, telemetry, and autoscaling. It is the operational surface for the hardware fleet.", "Fleet control · Telemetry · Autoscaling"],
  systems: ["NUCORE GPU Systems", "Vera Rubin, Blackwell, and the 5090Ti provide the compute base. Each system maps to a different workload profile.", "Vera Rubin · Blackwell · 5090Ti"]
};

document.querySelectorAll("[data-layer]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-layer]").forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    const data = layerContent[button.dataset.layer];
    if (!layerPanel || !data) return;
    layerPanel.classList.remove("is-visible");
    window.setTimeout(() => {
      layerPanel.innerHTML = `<button class="panel-close" type="button" aria-label="Close">×</button><h3>${data[0]}</h3><p>${data[1]}</p><ul class="list-reveal revealed"><li class="revealed">${data[2]}</li></ul>`;
      layerPanel.classList.add("is-visible");
      layerPanel.querySelector(".panel-close").addEventListener("click", () => {
        layerPanel.classList.remove("is-visible");
        document.querySelectorAll("[data-layer]").forEach((item) => item.classList.remove("is-active"));
      });
    }, 150);
  });
});
