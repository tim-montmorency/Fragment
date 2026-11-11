const tl = gsap.timeline({
  repeat: -1,
  yoyo: true,
  defaults: { duration: 3, ease: "none" },
});

tl.fromTo(
  "#route",
  { drawSVG: "0%", visibility: "visible" },
  { drawSVG: "100%" },
  0,
);

tl.to(
  "#car",
  {
    motionPath: {
      path: "#route",
      align: "#route",
      alignOrigin: [0, 1],
      autoRotate: true,
    },
  },
  "<",
);
