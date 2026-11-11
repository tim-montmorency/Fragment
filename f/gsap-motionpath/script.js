gsap.to("#car", {
  duration: 10,
  ease: "none",
  repeat: -1,
  motionPath: {
    path: "#route", // un <path> SVG
    align: "#route", // place l'élément sur le tracé
    alignOrigin: [0.5, 0.5], // le point de l'élément posé sur le tracé (ici, son centre)
    autoRotate: true, // oriente l'élément selon la direction
  },
});
