// Les propriétés animées, puis les paramètres
gsap.to(".box", {
  x: 150,          // déplacement horizontal (en px)
  rotation: 180,   // rotation (en degrés)
  scale: 1.4,      // mise à l'échelle

  duration: 1.2,   // durée (en secondes)
  ease: "back.inOut",
  repeat: -1,      // répéter à l'infini
  yoyo: true,      // aller-retour
  repeatDelay: 0.3 // pause entre les répétitions
});
