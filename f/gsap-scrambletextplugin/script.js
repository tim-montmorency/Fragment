document.querySelector("#scramble").addEventListener("click", () => {
  gsap.to("#classic", {
    duration: 1.5,
    scrambleText: {
      text: "All your base are belong to us", // le texte final
      chars: "upperCase", // les caractères de brouillage
      revealDelay: 0.5, // brouille 0,5 s avant de commencer à révéler
    },
  });
});
