gsap.registerPlugin(ScrollToPlugin);

const buttons = document.querySelectorAll(
  ".nav button"
);

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    // Défile la page jusqu'au chapitre
    gsap.to(window, {
      duration: 1,
      scrollTo: button.dataset.cible,
      ease: "power2.inOut",
    });
  });
});
