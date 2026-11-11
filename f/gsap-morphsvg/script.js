document.querySelector("#transformer").addEventListener("click", () => {
  gsap.to("#lecture", { morphSVG: "#pause", duration: 0.4 });
});
