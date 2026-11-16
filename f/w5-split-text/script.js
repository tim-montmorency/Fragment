gsap.registerPlugin(SplitText);

// Découpe le titre en lettres
const title = SplitText.create(".titre", {
  type: "words, chars",
});

// Découpe le paragraphe en lignes,
// avec un masque autour de chacune
const text = SplitText.create(".texte", {
  type: "lines",
  mask: "lines",
});

const tl = gsap.timeline({
  repeat: -1,
  repeatDelay: 1.5,
});

// Les lettres, une après l'autre
tl.from(title.chars, {
  y: 40,
  opacity: 0,
  stagger: 0.04,
  duration: 0.5,
})
  // Les lignes montent de leur masque
  .from(text.lines, {
    yPercent: 100,
    stagger: 0.2,
    duration: 0.6,
  });
