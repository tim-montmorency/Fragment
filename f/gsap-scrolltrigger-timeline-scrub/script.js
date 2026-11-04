gsap.registerPlugin(ScrollTrigger);

gsap
  .timeline({
    scrollTrigger: {
      trigger: ".scene",
      start: "top top",
      end: "+=3000", // la séquence s'étale sur 3000 px de défilement
      scrub: 1,
      pin: true, // garde la scène à l'écran pendant la séquence (voir « Épingler une section »)
      markers: true,
    },
  })
  .to(".boite1", { x: 100 })
  .to(".boite2", { x: -100 }, "<")
  .to(".cercle", { scale: 2 })
  .to(".triangle", { rotation: 360 });
