function gpuStage(label = "GPU") {
  return `
    <div class="gpu-stage reveal delay-1" aria-hidden="true">
      <div class="ambient-ring"></div>
      <div class="gpu-card">
        <div class="gpu-ridges">
          <i></i><i></i><i></i><i></i><i></i><i></i><i></i>
        </div>
      </div>
      <div class="orbital-text">${label}</div>
    </div>
  `;
}

function navMarkup() {
  return `
    <nav class="site-nav" aria-label="Primary navigation">
      <a class="brand" href="index.html" aria-label="Nucore home">
        <img class="brand-logo-img" src="assets/nucore-logo-white.png" alt="Nucore logo">
      </a>
      <div class="nav-center">
        <div class="dropdown">
          <button class="dropdown-trigger" type="button">Products</button>
          <div class="dropdown-menu">
            <a href="gpus.html">GPU Systems</a>
            <a href="software.html">Software Suite</a>
          </div>
        </div>
        <a href="research.html">Research</a>
        <a href="about.html">About Us</a>
        <a href="contact.html">Contact Us</a>
      </div>
      <div class="nav-actions">
        <a class="demo-button" href="cost-calculator.html">Schedule a Demo</a>
      </div>
      <button class="hamburger" type="button" aria-label="Open navigation" aria-expanded="false"><span></span></button>
    </nav>
    <div class="mobile-panel" aria-label="Mobile navigation">
      <a href="gpus.html">GPU Systems</a>
      <a href="software.html">Software Suite</a>
      <a href="research.html">Research</a>
      <a href="about.html">About</a>
      <a href="contact.html">Contact</a>
      <a href="cost-calculator.html">Demo</a>
      <div class="mobile-social">
        <a href="mailto:hello@nucore.ai">Email</a>
        <a href="https://instagram.com/nucore">Instagram</a>
        <a href="https://linkedin.com/company/nucore">LinkedIn</a>
      </div>
    </div>
  `;
}

document.body.insertAdjacentHTML("afterbegin", navMarkup());

document.querySelectorAll("[data-gpu-stage]").forEach((slot) => {
  slot.innerHTML = gpuStage(slot.dataset.gpuStage || "GPU");
});
