gsap.registerPlugin(ScrollTrigger);

gsap.to(".contenu", {
  xPercent: -75, // 4 panneaux : on recule de 3 panneaux sur 4, soit 75 %
  ease: "none", // identique à linear
  scrollTrigger: {
    trigger: ".section",
    start: "top top",
    end: "+=2000", // dure sur 2000 px de défilement
    pin: true,
    scrub: 1,
    markers: true,
  },
});
