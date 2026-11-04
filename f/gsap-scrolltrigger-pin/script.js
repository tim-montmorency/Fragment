gsap.registerPlugin(ScrollTrigger);

gsap.to(".contenu", {
  xPercent: -75, // 4 panneaux : on recule de 3 panneaux sur 4, soit 75 %
  ease: "none", // mouvement linéaire, collé au défilement
  scrollTrigger: {
    trigger: ".section",
    start: "top top",
    end: "+=2000", // dure sur 2000 px de défilement
    pin: true, // fige la section pendant ce temps
    scrub: 1,
    markers: true,
  },
});
