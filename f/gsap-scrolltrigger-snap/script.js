gsap.registerPlugin(ScrollTrigger);

gsap.to(".boite", {
  left: "100%",
  ease: "none",
  scrollTrigger: {
    trigger: ".scene",
    start: "top top",
    end: "+=1000",
    pin: true,
    scrub: true,
    snap: 0.5, // s'aimante à 0, 0.5 ou 1 : le début, le milieu ou la fin
  },
});
