document.querySelector("#dessiner").addEventListener("click", () => {
  gsap.from("#catToDraw", {
    drawSVG: "0%", // part d'un tracé invisible
    duration: 2,
    stagger: 0.2,
  });
});
