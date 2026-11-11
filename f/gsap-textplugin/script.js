document.querySelector("#txt-change").addEventListener("click", () => {
  document.querySelector("#classic").innerHTML = "";
  gsap.to("#classic", {
    duration: 3,
    text: "Connais-toi toi-même",
    ease: "none",
  });
});
