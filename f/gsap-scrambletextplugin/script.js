document.querySelector("#scramble").addEventListener("click", () => {
  gsap.to("#classic", {
    duration: 1.5,
    scrambleText: {
      text: "All your base are belong to us", // le texte final
      chars: "upperAndLowerCase",
      revealDelay: 0.25, // brouille x secondes avant de révéler
    },
  });
});
