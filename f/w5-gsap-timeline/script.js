// Une timeline : les tweens s'enchaînent, dans l'ordre
const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });

tl.from(".box", { x: -300, opacity: 0, duration: 1 })
  // "-=0.5" : commence 0,5 s AVANT la fin du précédent
  .from(".circle", { scale: 0, duration: 0.6 }, "-=0.5")
  // "<" : en même temps que le DÉBUT du précédent
  .to(".box", { rotation: 360, duration: 0.6 }, "<")
  // "+=0.3" : 0,3 s APRÈS la fin du précédent
  .from(".title", { y: 40, opacity: 0, duration: 0.5 }, "+=0.3");
