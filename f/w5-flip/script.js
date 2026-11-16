gsap.registerPlugin(Flip);

const grid =
  document.querySelector(".grille");
const button =
  document.querySelector(".bouton");

button.addEventListener("click", () => {
  // 1. Mémoriser où sont les cartes
  const state = Flip.getState(".carte");

  // 2. Changer la mise en page
  //    (ici : une classe CSS)
  grid.classList.toggle("en-ligne");

  // 3. Animer de l'ancienne
  //    position à la nouvelle
  Flip.from(state, {
    duration: 0.8,
    ease: "power2.inOut",
    stagger: 0.05,
  });
});
