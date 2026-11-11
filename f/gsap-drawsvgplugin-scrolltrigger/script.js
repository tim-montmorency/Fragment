gsap.fromTo(
  "#catToDraw",
  {
    drawSVG: "0%",
    visibility: "visible",
  },
  {
    drawSVG: "100%",
    scrollTrigger: {
      trigger: "#miaw",
      start: "center 66%",
      end: "center 33%",
      scrub: 1,
      markers: true,
    },
  },
);
