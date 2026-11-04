// Une timeline : 4 tweens identiques.
// Seule la POSITION change.
const tl = gsap.timeline({
  repeat: -1,
  repeatDelay: 1,
});

// 1 : rien, il commence à 0 s
tl.to(".b1", { x: 200, duration: 1 })

  // 2 : "-=0.5", commence 0,5 s
  // AVANT la fin de 1 (chevauche)
  .to(".b2", {
    x: 200, duration: 1,
  }, "-=0.5")

  // 3 : "<", commence en MÊME
  // temps que 2
  .to(".b3", {
    x: 200, duration: 1,
  }, "<")

  // 4 : "+=0.5", attend 0,5 s
  // APRÈS la fin de 3
  .to(".b4", {
    x: 200, duration: 1,
  }, "+=0.5");
