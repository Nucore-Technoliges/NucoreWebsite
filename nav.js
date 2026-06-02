const CALENDLY_URL = "https://calendly.com/nucore";

function logoSvg() {
  return `<img class="brand-mark" src="assets/nucore-logo.png" alt="Nucore" />`;
}

document.body.insertAdjacentHTML("afterbegin", `
  <nav class="site-nav" aria-label="Primary">
    <a class="brand" href="index.html" aria-label="Nucore home">${logoSvg()}<img class="brand-word" src="assets/nucore-wordmark.png" alt="Nucore"></a>
    <div class="nav-center">
      <a class="nav-link" href="products.html">Products</a>
      <a class="nav-link" href="design.html">Design</a>
      <a class="nav-link" href="research.html">Research</a>
      <a class="nav-link" href="contact.html">Contact Us</a>
    </div>
    <div class="nav-actions"><a class="btn btn--outline" href="${CALENDLY_URL}">Book a Demo</a></div>
    <button class="hamburger" type="button" aria-label="Open navigation" aria-expanded="false"><span></span></button>
  </nav>
  <div class="mobile-panel" hidden>
    <a href="products.html">Products</a>
    <a href="design.html">Design</a>
    <a href="research.html">Research</a>
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
