gsap.registerPlugin(ScrollTrigger);

gsap.from(".box", {
  x: -120,
  rotation: -180,
  opacity: 0,
  duration: 2,
  scrollTrigger: {
    // l'élément observé
    trigger: ".stage",
    // haut de .stage à 65 % de l'écran
    start: "top 65%",
    // bas de .stage à 35 % de l'écran
    end: "bottom 35%",
    // les repères : à retirer à la fin
    markers: true,
    // onEnter onLeave
    // onEnterBack onLeaveBack
    toggleActions:
      "play complete reverse reset",
  },
});
