gsap.registerPlugin(ScrollTrigger);

// Le scrollTrigger est sur la TIMELINE, pas sur chaque tween
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: ".scene",
    start: "top top",    // le haut de la scène touche le haut de l'écran
    end: "+=200%",       // la séquence dure 2 écrans de défilement
    pin: true,           // la scène reste en place pendant ce temps
    scrub: 1,
    markers: true,
  },
});

// Avec scrub, les durées sont des PROPORTIONS
tl.from(".box", { x: "-40vw", rotation: -360, duration: 2 })
  .from(".circle", { scale: 0, duration: 1 }, "<0.5")
  .from(".title", { y: 60, opacity: 0, duration: 1 })
  .to(".box, .circle", { y: -30, duration: 1 });
