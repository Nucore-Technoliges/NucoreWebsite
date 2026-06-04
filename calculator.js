(function () {
  const NUCORE_UNIT_COST = 40000;
  const NUCORE_TOKENS_PER_UNIT = 4_500_000_000; // per month
  const NUCORE_UTILIZATION = 0.96; // bundled Orion software → near-full utilization
  const NUCORE_OPS_MONTHLY = 1200; // per unit / mo — efficient cooling + remote ops
  const H100_UNIT_COST = 38000; // street price for H100 SXM, before networking/power
  const H100_TOKENS_PER_UNIT = NUCORE_TOKENS_PER_UNIT / 1.3; // Nucore is 30% higher
  const H100_UTILIZATION = 0.78; // typical DIY stack utilization
  const H100_OPS_MONTHLY = 2800; // power + DIY MLOps + 38% higher draw
  const CLOUD_OVERHEAD = 1.22; // egress, storage, idle retries, premium tiers

  const USE_CASE_MULTIPLIER = {
    inference: 1.0,
    training:  1.6,
    finetune:  1.2,
    agents:    1.35,
    rag:       1.1,
    research:  1.25,
  };

  const USE_CASE_COPY = {
    inference: "Configured for continuous inference and serving.",
    training:  "Configured for end-to-end model training runs.",
    finetune:  "Configured for ongoing fine-tuning and adapter training.",
    agents:    "Configured for multi-agent pipelines with memory persistence.",
    rag:       "Configured for high-throughput RAG and retrieval workloads.",
    research:  "Configured for open-ended research and experimentation.",
  };

  const INDUSTRY_ADVANTAGES = {
    finance:    ["✓ Sub-50µs inference for signal models and trading desks.",
                 "✓ Co-located rack — no cloud egress to the exchange.",
                 "✓ Audit-ready, sovereign data plane.",
                 "✓ Titan LLM tuned for low-latency analyst tooling."],
    healthcare: ["✓ HIPAA-aligned on-prem deployment, PHI stays inside.",
                 "✓ Validated for genomics and protein-folding workloads.",
                 "✓ No shared tenancy, no third-party model hosting.",
                 "✓ Titan LLM weights stay under your control."],
    defense:    ["✓ Air-gap-ready Spartan clusters.",
                 "✓ ITAR-aware, US-assembled supply chain.",
                 "✓ Classified-network compatible software stack.",
                 "✓ Sovereign weights, no cloud telemetry."],
    robotics:   ["✓ Real-time control loops without cloud round-trip.",
                 "✓ Edge + datacenter fabric on the same software plane.",
                 "✓ Multi-agent training and policy rollouts on one rack.",
                 "✓ World-model training at 2.4x tok/$ vs. cloud."],
    energy:     ["✓ Persistent compute that scales with the asset.",
                 "✓ 2.1x throughput per kilowatt vs. H100.",
                 "✓ Reservoir + grid forecasting validated workloads.",
                 "✓ Predictable capex instead of variable cloud OPEX."],
    research:   ["✓ Custom architectures and RL training supported.",
                 "✓ No queueing for cloud quota.",
                 "✓ Open access to silicon-level telemetry.",
                 "✓ Reservable hours for collaborators."],
    enterprise: ["✓ Predictable capex instead of variable cloud bill.",
                 "✓ Titan LLM tuned to Spartan silicon, included.",
                 "✓ White-glove software suite — no MLOps build-out.",
                 "✓ Data sovereignty, no shared tenancy."],
  };

  function parseNum(str) {
    if (typeof str === "number") return str;
    const n = Number(String(str).replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }

  function fmtMoney(n) {
    if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(n >= 10_000_000 ? 1 : 2).replace(/\.0+$/, "") + "M";
    if (n >= 1_000)     return "$" + (n / 1_000).toFixed(n >= 100_000 ? 0 : 1).replace(/\.0+$/, "") + "K";
    return "$" + Math.round(n).toLocaleString();
  }

  function fmtFull(n) {
    return "$" + Math.round(n).toLocaleString();
  }

  function fmtMonths(n) {
    if (!isFinite(n) || n <= 0) return "—";
    if (n < 1) return (n * 30).toFixed(0) + " days";
    if (n < 12) return n.toFixed(1) + " mo";
    return (n / 12).toFixed(1) + " yrs";
  }

  function compute() {
    const industry  = document.getElementById("calcIndustry").value;
    const useCase   = document.getElementById("calcUseCase").value;
    const tokens    = parseNum(document.getElementById("calcTokens").value);
    const cloudBill = parseNum(document.getElementById("calcCloud").value);
    const horizon   = Number(document.getElementById("calcHorizon").value) || 24;

    const mult = USE_CASE_MULTIPLIER[useCase] || 1;
    const effectiveTokens = tokens * mult;

    const nuUnits = Math.max(1, Math.ceil(effectiveTokens / (NUCORE_TOKENS_PER_UNIT * NUCORE_UTILIZATION)));
    const h1Units = Math.max(1, Math.ceil(effectiveTokens / (H100_TOKENS_PER_UNIT * H100_UTILIZATION)));

    const nuUpfront = nuUnits * NUCORE_UNIT_COST;
    const h1Upfront = h1Units * H100_UNIT_COST;

    const nuOpsMonthly = nuUnits * NUCORE_OPS_MONTHLY;
    const h1OpsMonthly = h1Units * H100_OPS_MONTHLY;

    const nuTotal = nuUpfront + nuOpsMonthly * horizon;
    const nuMonthly = nuTotal / horizon;

    const h1Total = h1Upfront + h1OpsMonthly * horizon;

    const clEffective = cloudBill * CLOUD_OVERHEAD;
    const clTotal = clEffective * horizon;

    const savings = clTotal - nuTotal;
    const paybackMo = nuUpfront / Math.max(1, (clEffective - nuOpsMonthly));

    const tokensPerDollarNu = (effectiveTokens * horizon) / Math.max(1, nuTotal);
    const tokensPerDollarCl = (effectiveTokens * horizon) / Math.max(1, clTotal);
    const perDollarRatio = tokensPerDollarNu / Math.max(1, tokensPerDollarCl);

    const nuThroughputMo = nuUnits * NUCORE_TOKENS_PER_UNIT * NUCORE_UTILIZATION;
    const h1ThroughputMo = h1Units * H100_TOKENS_PER_UNIT * H100_UTILIZATION;
    const powerAdvantage = (nuThroughputMo / h1ThroughputMo) || 1;

    // Update DOM
    const industryLabel = document.getElementById("calcIndustry").selectedOptions[0].textContent;
    document.getElementById("resTitle").textContent = "Spartan Deployment · " + industryLabel;
    document.getElementById("resSubtitle").textContent = USE_CASE_COPY[useCase];

    document.getElementById("resUnits").textContent = nuUnits.toLocaleString();
    document.getElementById("resCost").textContent = fmtMoney(nuUpfront);
    document.getElementById("resSavings").textContent = (savings >= 0 ? "" : "-") + fmtMoney(Math.abs(savings));
    document.getElementById("resSavingsLabel").textContent =
      (savings >= 0 ? "Saved" : "Premium") + " vs. cloud over " + horizon + " mo";

    document.getElementById("cmpNuUnits").textContent = nuUnits.toLocaleString();
    document.getElementById("cmpNuUpfront").textContent = fmtFull(nuUpfront);
    document.getElementById("cmpNuMonthly").textContent = fmtFull(nuMonthly);
    document.getElementById("cmpNuTotal").textContent = fmtFull(nuTotal);

    document.getElementById("cmpClMonthly").textContent = fmtFull(cloudBill);
    document.getElementById("cmpClTotal").textContent = fmtFull(clTotal);

    document.getElementById("cmpH1Units").textContent = h1Units.toLocaleString();
    document.getElementById("cmpH1Upfront").textContent = fmtFull(h1Upfront);
    const h1TotalEl = document.getElementById("cmpH1Total");
    if (h1TotalEl) h1TotalEl.textContent = fmtFull(h1Total);
    const clOverEl = document.getElementById("cmpClOver");
    if (clOverEl) clOverEl.textContent = "+" + Math.round((CLOUD_OVERHEAD - 1) * 100) + "%";

    document.getElementById("advRoi").textContent = fmtMonths(paybackMo);
    document.getElementById("advPerf").textContent = "+" + Math.round((powerAdvantage - 1) * 100) + "%";
    document.getElementById("advPerDollar").textContent = perDollarRatio.toFixed(1) + "x";
    document.getElementById("advLatency").textContent = "12 ms";

    const list = document.getElementById("advList");
    list.innerHTML = (INDUSTRY_ADVANTAGES[industry] || INDUSTRY_ADVANTAGES.enterprise)
      .map((l) => "<li>" + l + "</li>").join("");

    // Re-trigger bar reveal pulse
    document.querySelectorAll(".compare-card").forEach((c) => {
      c.classList.remove("is-bump");
      void c.offsetWidth;
      c.classList.add("is-bump");
    });
  }

  function formatNumericInput(input) {
    input.addEventListener("input", () => {
      const caret = input.selectionStart;
      const raw = input.value.replace(/[^\d]/g, "");
      const formatted = raw ? Number(raw).toLocaleString() : "";
      input.value = formatted;
      const diff = formatted.length - (input.value.length || 0);
      try { input.setSelectionRange(caret + diff, caret + diff); } catch (e) {}
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    formatNumericInput(document.getElementById("calcTokens"));
    formatNumericInput(document.getElementById("calcCloud"));

    document.querySelectorAll(".calc-presets button").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.getElementById("calcTokens").value = Number(btn.dataset.tokens).toLocaleString();
        compute();
      });
    });

    document.getElementById("calcGo").addEventListener("click", compute);
    ["calcIndustry", "calcUseCase", "calcHorizon"].forEach((id) =>
      document.getElementById(id).addEventListener("change", compute));

    compute();
  });
})();
