gsap.fromTo(
  "#catToDraw",
  {
    drawSVG: "0%",
    visibility: "visible",
  },
  {
    drawSVG: "100%",
    duration: 3,
    ease: "power1.inOut",
    scrollTrigger: {
      trigger: "#miaw",
      start: "top 50%",
      end: "bottom 50%",
      scrub: 1,
      markers: true,
    },
  },
);
