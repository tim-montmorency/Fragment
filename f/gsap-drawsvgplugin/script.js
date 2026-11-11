document.querySelector("#dessiner").addEventListener("click", () => {
  gsap.set("#catToDraw", { drawSVG: "0%", visibility: "visible" });
  gsap.from("#catToDraw", {
    drawSVG: "0%", // part d'un tracé invisible
    duration: 2,
    stagger: 0.2,
  });
});
