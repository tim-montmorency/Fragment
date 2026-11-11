gsap.fromTo(
  "#catToDraw",
  { drawSVG: "0%", visibility: "visible" },
  {
    drawSVG: "100%",
    duration: 3,
    ease: "power1.inOut",

    scrollTrigger: {
      trigger: "#carte",
      start: "top top",
      end: "+=1500",
      pin: true,
      scrub: 1,
      markers: true,
    },
  },
);
