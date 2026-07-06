const slides = [...document.querySelectorAll(".slide")];
const dots = [...document.querySelectorAll(".nav-dot")];

function activate(id) {
  dots.forEach((dot) => dot.classList.toggle("ativo", dot.dataset.slide === id));
}

dots.forEach((dot) => {
  dot.addEventListener("click", () => {
    document.getElementById(dot.dataset.slide)?.scrollIntoView({ behavior: "smooth" });
  });
});

const observer = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) activate(visible.target.id);
  },
  { threshold: [0.35, 0.6] }
);

slides.forEach((slide) => observer.observe(slide));
document.getElementById("btn-print")?.addEventListener("click", () => window.print());
