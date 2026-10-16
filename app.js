const hero = document.querySelector(".hero");
const slides = [...document.querySelectorAll(".hero-slide")];
const dots = [...document.querySelectorAll(".dot")];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let activeIndex = 0;
let timer;
let touchStartX = 0;

function showSlide(nextIndex) {
  activeIndex = (nextIndex + slides.length) % slides.length;

  slides.forEach((slide, index) => {
    const isActive = index === activeIndex;
    slide.classList.toggle("is-active", isActive);
    slide.setAttribute("aria-hidden", String(!isActive));
  });

  dots.forEach((dot, index) => {
    const isActive = index === activeIndex;
    dot.classList.toggle("is-active", isActive);
    if (isActive) dot.setAttribute("aria-current", "true");
    else dot.removeAttribute("aria-current");
  });
}

function stopAutoplay() {
  window.clearInterval(timer);
}

function startAutoplay() {
  stopAutoplay();
  if (!reduceMotion) {
    timer = window.setInterval(() => showSlide(activeIndex + 1), 5500);
  }
}

dots.forEach((dot) => {
  dot.addEventListener("click", () => {
    showSlide(Number(dot.dataset.goTo));
    startAutoplay();
  });
});

hero.addEventListener("touchstart", (event) => {
  touchStartX = event.changedTouches[0].clientX;
  stopAutoplay();
}, { passive: true });

hero.addEventListener("touchend", (event) => {
  const movement = event.changedTouches[0].clientX - touchStartX;
  if (Math.abs(movement) > 44) showSlide(activeIndex + (movement < 0 ? 1 : -1));
  startAutoplay();
}, { passive: true });

hero.addEventListener("mouseenter", stopAutoplay);
hero.addEventListener("mouseleave", startAutoplay);
hero.addEventListener("focusin", stopAutoplay);
hero.addEventListener("focusout", startAutoplay);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopAutoplay();
  else startAutoplay();
});

showSlide(0);
startAutoplay();
