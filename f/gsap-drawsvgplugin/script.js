document.querySelector("#dessiner").addEventListener("click", () => {
  gsap.set("#catToDraw", { drawSVG: "0%", visibility: "visible" });
  gsap.to("#catToDraw", {
    drawSVG: "100%",
    duration: 3,
    ease: "power1.inOut",
  });
});
