let play = true;
document.querySelector("#transformer").addEventListener("click", () => {
  if (play) {
    gsap.to("#lecture", { morphSVG: "#pause", duration: 0.4 });
  } else {
    gsap.to("#pause", { morphSVG: "#lecture", duration: 0.4 });
  }
});
