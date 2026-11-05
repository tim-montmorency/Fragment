gsap.registerPlugin(ScrollTrigger);

gsap
  .timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: ".scene",
      start: "top top",
      end: "+=1000",
      pin: true,
      scrub: true,
      snap: "labels", // s'aimante à l'étiquette la plus proche
    },
  })
  .addLabel("départ")
  .to(".boite", { left: "25%", duration: 1 })
  .addLabel("arrêt 1")
  .to(".boite", { left: "100%", duration: 3 }) // trajet 3 fois plus long
  .addLabel("arrivée");
