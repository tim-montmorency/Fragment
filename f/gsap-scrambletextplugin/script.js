document.querySelector("#scramble").addEventListener("click", () => {
  gsap.to("#classic", {
    duration: 1.5,
    scrambleText: {
      text: "All your base are belong to us",
      chars: "upperAndLowerCase",
    },
  });
});
