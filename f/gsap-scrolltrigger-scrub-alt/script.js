gsap.registerPlugin(ScrollTrigger);

gsap.from(".barre", {
  scaleX: 1,
  ease: "linear",

  scrollTrigger: {
    trigger: "#main",
    start: "top 10%",
    end: "bottom 90%",
    scrub: 1,
    markers: true,
  },
});
