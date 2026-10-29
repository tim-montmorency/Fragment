const largeurFenetre = window.innerWidth;

gsap.to(".dot", {
  x: largeurFenetre - 100 - 10,
  duration: 4,
  ease: "linear"
});
