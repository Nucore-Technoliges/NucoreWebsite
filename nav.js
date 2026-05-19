const nav = document.querySelector(".site-nav");
const hamburger = document.querySelector(".hamburger");
const mobilePanel = document.querySelector(".mobile-panel");

function setScrolledState() {
  if (!nav) return;
  nav.classList.toggle("is-scrolled", window.scrollY > 8);
}

setScrolledState();
window.addEventListener("scroll", setScrolledState, { passive: true });

if (hamburger && mobilePanel) {
  hamburger.addEventListener("click", () => {
    const isOpen = mobilePanel.classList.toggle("is-open");
    document.body.classList.toggle("menu-open", isOpen);
    hamburger.setAttribute("aria-expanded", String(isOpen));
  });

  mobilePanel.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mobilePanel.classList.remove("is-open");
      document.body.classList.remove("menu-open");
      hamburger.setAttribute("aria-expanded", "false");
    });
  });
}
