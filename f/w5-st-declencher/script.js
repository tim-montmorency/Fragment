gsap.registerPlugin(ScrollTrigger);

gsap.from(".box", {
  x: -320,
  rotation: -360,
  opacity: 0.3,
  duration: 3,
  scrollTrigger: {
    // l'élément observé
    trigger: ".stage",
    // haut de .stage à 65 % de l'écran
    start: "top 65%",
    // bas de .stage à 35 % de l'écran
    end: "bottom 35%",
    // les repères : à retirer à la fin
    markers: true,
    
    
    toggleActions:
    "play complete reverse reset",
  // onEnter | onLeave | onEnterBack | onLeaveBack
  // jouer | compléter | à l'envers | réinitialiser
  },
});
