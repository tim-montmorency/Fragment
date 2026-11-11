document.querySelector("#txt-change").addEventListener("click", () => {
  gsap.to("#classic", {
    duration: 3,
    text: "Connais-toi toi-même",
    ease: "none",
  });
});
