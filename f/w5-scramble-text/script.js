gsap.registerPlugin(ScrambleTextPlugin);

const tl = gsap.timeline({
  repeat: -1,
  repeatDelay: 1.5,
});

// "{original}" : le texte déjà dans
// le HTML. Il se brouille, puis
// se révèle, lettre par lettre.
tl.to(".chapitre", {
  duration: 1,
  scrambleText: {
    text: "{original}",
    chars: "0123456789",
  },
})
  .to(".titre", {
    duration: 2,
    scrambleText: {
      text: "{original}",
      chars: "upperCase",
      revealDelay: 0.5,
    },
  });
