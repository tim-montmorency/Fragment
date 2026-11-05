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
    snap: 0.5, // 0 = start, 0.5 = mi-chemin, 1 = end
  },
});
