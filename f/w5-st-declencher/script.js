gsap.registerPlugin(ScrollTrigger);

gsap.from(".box", {
  x: -250,
  rotation: -180,
  opacity: 0,
  duration: 1,
  scrollTrigger: {
    // l'élément observé
    trigger: ".stage",
    // haut de .stage à 75 % de l'écran
    start: "top 75%",
    // bas de .stage à 25 % de l'écran
    end: "bottom 25%",
    // les repères : à retirer à la fin
    markers: true,
    // onEnter onLeave
    // onEnterBack onLeaveBack
    toggleActions:
      "play reverse play reverse",
  },
});
