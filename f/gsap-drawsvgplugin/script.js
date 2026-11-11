document.querySelector("#dessiner").addEventListener("click", () => {
  gsap.fromTo(
    "#catToDraw",
    { drawSVG: "0%", visibility: "visible" },
    { drawSVG: "100%", duration: 3, ease: "power1.inOut" },
  );
  // gsap.timeline().fromTo(
  //   "#catToDraw",
  //   { drawSVG: "0%", visibility: "visible" },
  //   { drawSVG: "100%", duration: 3, ease: "power1.inOut" },
  // ).to(
  //   "#catToDraw",
  //   { drawSVG: "100% 100%", duration: 3, ease: "power1.inOut" }
  // )
});
