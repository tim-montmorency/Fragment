gsap.registerPlugin(ScrollTrigger);

// Le scrollTrigger est sur la
// TIMELINE, pas sur chaque tween
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: ".scene",
    // haut de la scène en haut
    start: "top top",
    // dure 2 écrans de défilement
    end: "+=200%",
    // la scène reste en place
    pin: true,
    scrub: 1,
    markers: true,
  },
});

// Avec scrub, les durées sont
// des PROPORTIONS
tl.from(".box", {
  x: "-40vw",
  rotation: -360,
  duration: 2,
})
  .from(".circle", {
    scale: 0,
    duration: 1,
  }, "<0.5")
  .from(".title", {
    y: 60,
    opacity: 0,
    duration: 1,
  })
  .to(".box, .circle", {
    y: -30,
    duration: 1,
  });
