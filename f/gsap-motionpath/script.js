gsap.to("#car", {
  duration: 10,
  ease: "none",
  repeat: -1,
  motionPath: {
    path: "#route", // un <path> SVG
    align: "#route", // place l'élément sur le tracé
    alignOrigin: [0.5, 1], // le transformOrigin de l'auto posé sur le tracé
    autoRotate: true, // oriente l'élément selon la direction
  },
});
