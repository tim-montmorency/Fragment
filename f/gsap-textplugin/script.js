document.querySelector("#scramble").addEventListener("click", () => {
  gsap.to("#classic", {
    duration: 3,
    text: "Un brouillard étrange recouvre l'archipel...",
    ease: "none",
  });
});
