const status =
  document.querySelector(".status");
const mm = gsap.matchMedia();

// Seulement si le visiteur
// accepte le mouvement
mm.add(
  "(prefers-reduced-motion: no-preference)",
  () => {
    status.textContent =
      "Mouvement accepté : ça bouge.";
    gsap.to(".box", {
      x: 100,
      rotation: 180,
      duration: 1,
      repeat: -1,
      yoyo: true,
      ease: "power2.inOut",
    });
    // Si le réglage change, GSAP
    // annule ce qui a été créé ici
  }
);

// Mouvement réduit : l'état
// final, sans animation
mm.add(
  "(prefers-reduced-motion: reduce)",
  () => {
    status.textContent =
      "Mouvement réduit : rien ne bouge.";
  }
);
