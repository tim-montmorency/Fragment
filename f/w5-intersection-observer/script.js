const countLabel =
  document.querySelector(".count");
let count = 0;

// Appelée quand la visibilité
// d'une carte change
function onChange(entries) {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;

    // Ici : un fetch, une animation...
    const card = entry.target;
    card.classList.add("is-loaded");
    count++;
    countLabel.textContent = count;

    // Une seule fois : on arrête
    // d'observer cette carte
    observer.unobserve(card);
  });
}

// 20 % avant le bas de l'écran
const options = {
  rootMargin: "0px 0px -20% 0px",
};

const observer = new IntersectionObserver(
  onChange,
  options
);

document
  .querySelectorAll(".card")
  .forEach((card) => {
    observer.observe(card);
  });
