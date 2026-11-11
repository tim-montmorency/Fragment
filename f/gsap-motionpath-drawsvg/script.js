const tl = gsap.timeline({
  repeat: -1,
  yoyo: true,
  defaults: { duration: 5, ease: "none" },
});

tl.fromTo(
  "#route",
  { drawSVG: "0%", visibility: "visible" },
  { drawSVG: "100%" },
  0,
).to(
  "#car",
  {
    motionPath: {
      path: "#route",
      align: "#route",
      alignOrigin: [0.5, 1],
      autoRotate: true,
    },
  },
  0,
);
