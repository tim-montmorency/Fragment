let play = true;
document.querySelector("#transformer").addEventListener("click", () => {
  if (play) {
    gsap.to("#lecture", { morphSVG: "#pause", duration: 0.4 });
  } else {
    gsap.to("#lecture", {
      morphSVG: "#lecture",
      fill: "#ff8709",
      duration: 0.4,
    });
  }

  play = !play;
});
