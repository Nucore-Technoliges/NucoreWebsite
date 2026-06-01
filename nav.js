const CALENDLY_URL = "https://calendly.com/nucore";

function logoSvg() {
  return `
    <svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M8 26V6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square"/>
      <path d="M9 6l14 20" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square"/>
      <path d="M24 6v20" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square"/>
    </svg>`;
}

document.body.insertAdjacentHTML("afterbegin", `
  <nav class="site-nav" aria-label="Primary">
    <a class="brand" href="index.html" aria-label="Nucore home">${logoSvg()}<span class="brand-word">NUCORE</span></a>
    <div class="nav-center">
      <div class="dropdown">
        <button class="dropdown-trigger" type="button" aria-expanded="false">Products</button>
        <div class="dropdown-menu">
          <a href="products.html#vera-rubin">Vera Rubin</a>
          <a href="products.html#blackwell">Blackwell</a>
          <a href="products.html#5090ti">5090Ti</a>
        </div>
      </div>
      <a class="nav-link" href="interactive-models.html">Interactive Models</a>
      <a class="nav-link" href="research.html">Research</a>
      <a class="nav-link" href="about.html">About Us</a>
      <a class="nav-link" href="contact.html">Contact Us</a>
    </div>
    <div class="nav-actions"><a class="btn btn--outline" href="${CALENDLY_URL}">Book a Demo</a></div>
    <button class="hamburger" type="button" aria-label="Open navigation" aria-expanded="false"><span></span></button>
  </nav>
  <div class="mobile-panel" hidden>
    <a href="products.html">Products</a>
    <a href="interactive-models.html">Interactive Models</a>
    <a href="research.html">Research</a>
    <a href="about.html">About Us</a>
    <a href="contact.html">Contact Us</a>
    <a class="btn btn--filled" href="${CALENDLY_URL}">Book a Demo</a>
  </div>
`);

const nav = document.querySelector(".site-nav");
const hamburger = document.querySelector(".hamburger");
const mobilePanel = document.querySelector(".mobile-panel");
let ticking = false;

function updateNav() {
  if (!nav) return;
  nav.classList.toggle("is-scrolled", window.scrollY > 60);
  const navY = nav.getBoundingClientRect().top + nav.offsetHeight / 2;
  const overDark = [...document.querySelectorAll(".section-dark")].some((section) => {
    const rect = section.getBoundingClientRect();
    return rect.top <= navY && rect.bottom >= navY;
  });
  nav.classList.toggle("nav--dark", overDark);
  ticking = false;
}

function requestNavUpdate() {
  if (!ticking) {
    window.requestAnimationFrame(updateNav);
    ticking = true;
  }
}

window.addEventListener("scroll", requestNavUpdate, { passive: true });
window.addEventListener("resize", requestNavUpdate);
updateNav();

if (hamburger && mobilePanel) {
  hamburger.addEventListener("click", () => {
    const open = !hamburger.classList.contains("is-open");
    hamburger.classList.toggle("is-open", open);
    hamburger.setAttribute("aria-expanded", String(open));
    mobilePanel.hidden = false;
    requestAnimationFrame(() => mobilePanel.classList.toggle("is-open", open));
    document.body.classList.toggle("menu-open", open);
    if (!open) window.setTimeout(() => { mobilePanel.hidden = true; }, 350);
  });

  mobilePanel.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      hamburger.classList.remove("is-open");
      hamburger.setAttribute("aria-expanded", "false");
      mobilePanel.classList.remove("is-open");
      document.body.classList.remove("menu-open");
      window.setTimeout(() => { mobilePanel.hidden = true; }, 350);
    });
  });
}
