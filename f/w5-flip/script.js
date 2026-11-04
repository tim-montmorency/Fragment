gsap.registerPlugin(Flip);

const grille =
  document.querySelector(".grille");
const bouton =
  document.querySelector(".bouton");

bouton.addEventListener("click", () => {
  // 1. Mémoriser où sont les cartes
  const etat = Flip.getState(".carte");

  // 2. Changer la mise en page
  //    (ici : une classe CSS)
  grille.classList.toggle("en-ligne");

  // 3. Animer de l'ancienne
  //    position à la nouvelle
  Flip.from(etat, {
    duration: 0.8,
    ease: "power2.inOut",
    stagger: 0.05,
  });
});
