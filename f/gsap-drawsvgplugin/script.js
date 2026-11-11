document.querySelector("#dessiner").addEventListener("click", () => {
  gsap.set("#catToDraw", { drawSVG: "0%", visibility: "visible" });
  gsap.from("#catToDraw", {
    drawSVG: "100%",
    duration: 3,
    ease: "power1.inOut",
  });
});
