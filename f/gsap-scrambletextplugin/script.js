document.querySelector("#scramble").addEventListener("click", () => {
  gsap.to("#slogan", {
    duration: 1.5,
    scrambleText: {
      text: "Appuyez sur Start", // le texte final
      chars: "upperCase", // les caractères de brouillage
      revealDelay: 0.5, // brouille 0,5 s avant de commencer à révéler
    },
  });
});
