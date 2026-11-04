// Les propriétés animées,
// puis les paramètres
gsap.to(".box", {
  x: 150,        // déplacement (px)
  rotation: 180, // rotation (degrés)
  scale: 1.4,    // mise à l'échelle

  duration: 1.2, // en secondes
  ease: "back.inOut",
  repeat: -1,    // à l'infini
  yoyo: true,    // aller-retour
  repeatDelay: 0.3,
});
