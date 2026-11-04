// Une timeline : les tweens
// s'enchaînent, l'un APRÈS l'autre
const tl = gsap.timeline({
  repeat: -1,
  repeatDelay: 1,
});

// 1. la boîte arrive
tl.from(".box", {
  x: -300,
  opacity: 0,
  duration: 1,
})
  // 2. puis le cercle grandit
  .from(".circle", {
    scale: 0,
    duration: 0.6,
  })
  // 3. puis la boîte tourne
  .to(".box", {
    rotation: 360,
    duration: 0.6,
  })
  // 4. puis le titre apparaît
  .from(".title", {
    y: 40,
    opacity: 0,
    duration: 0.5,
  });
