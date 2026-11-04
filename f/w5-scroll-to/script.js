gsap.registerPlugin(ScrollToPlugin);

const boutons = document.querySelectorAll(
  ".nav button"
);

boutons.forEach((bouton) => {
  bouton.addEventListener("click", () => {
    // Défile la page jusqu'au chapitre
    gsap.to(window, {
      duration: 1,
      scrollTo: bouton.dataset.cible,
      ease: "power2.inOut",
    });
  });
});
