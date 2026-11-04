gsap.registerPlugin(ScrollTrigger);

gsap.from(".box", {
  x: -250,
  rotation: -180,
  opacity: 0,
  duration: 1,
  scrollTrigger: {
    trigger: ".stage",       // l'élément observé
    start: "top 75%",        // haut de .stage à 75 % de l'écran
    end: "bottom 25%",       // bas de .stage à 25 % de l'écran
    markers: true,           // les repères : à retirer à la fin
    // onEnter onLeave onEnterBack onLeaveBack
    toggleActions: "play reverse play reverse",
  },
});
