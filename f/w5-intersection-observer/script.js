const countLabel = document.querySelector(".count");
let count = 0;

// Appelée quand la visibilité d'une carte change
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;

    // Ici, on lancerait un fetch, une animation GSAP...
    entry.target.classList.add("is-loaded");
    count++;
    countLabel.textContent = count;

    // Une seule fois : on arrête d'observer cette carte
    observer.unobserve(entry.target);
  });
}, {
  rootMargin: "0px 0px -20% 0px", // 20 % avant le bas de l'écran
});

document.querySelectorAll(".card").forEach((card) => {
  observer.observe(card);
});
