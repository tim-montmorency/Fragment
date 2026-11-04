gsap.registerPlugin(ScrollTrigger);

// La barre suit TOUTE la page
gsap.to(".progress", {
  scaleX: 1,
  ease: "none",
  scrollTrigger: {
    start: 0,
    end: "max",
    scrub: true,
  },
});

// scrub: true : colle exactement
// au défilement
gsap.to(".box--true", {
  x: "60vw",
  rotation: 360,
  ease: "none",
  scrollTrigger: {
    trigger: ".stage",
    start: "top bottom",
    end: "bottom top",
    scrub: true,
  },
});

// scrub: 1 : rattrape le défilement
// en 1 seconde (plus doux)
gsap.to(".box--one", {
  x: "60vw",
  rotation: 360,
  ease: "none",
  scrollTrigger: {
    trigger: ".stage",
    start: "top bottom",
    end: "bottom top",
    scrub: 1,
  },
});
