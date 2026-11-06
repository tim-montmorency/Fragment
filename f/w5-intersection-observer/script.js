// Le compteur « Chargés : 0 / 3 » (propre à la démo)
const countLabel = document.querySelector(".count");
let count = 0;

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    // Pas encore visible : on ne fait rien
    if (!entry.isIntersecting) return;

    // L'action : ici, une classe. Dans votre récit : un fetch, une animation...
    entry.target.classList.add("is-loaded");

    // Le compteur de la démo
    count++;
    countLabel.textContent = count;

    // Une seule fois : on arrête de surveiller cette carte
    observer.unobserve(entry.target);
  });
}, {
  // 1 : la carte doit être visible à 100 %
  threshold: 1,
});

// On surveille chaque carte
document.querySelectorAll(".card").forEach((card) => {
  observer.observe(card);
});
