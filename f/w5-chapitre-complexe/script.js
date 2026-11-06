gsap.registerPlugin(ScrollTrigger, MorphSVGPlugin);

// Le même animate() que dans ch-05.js
function animate(section) {
  const q = gsap.utils.selector(section);
  const mm = gsap.matchMedia();

  mm.add(
    "(prefers-reduced-motion: no-preference)",
    () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=600%",
          pin: true,
          scrub: 1,
        },
      });

      // 1. Traveling avant : plus le
      //    calque est proche, plus il
      //    grossit (i : 0 = le ciel)
      tl.to(q(".calque"), {
        scale: (i) => 1 + i * 0.2,
        duration: 3,
      })
        // 2. Entre par la gauche,
        //    lentement
        .from(q(".perso--gauche"), {
          x: "-100vw",
          duration: 2,
        })
        // 3. Une pause ("+=1"), puis
        //    entre par la droite...
        .from(q(".perso--droite"), {
          x: "100vw",
          duration: 3,
        }, "+=1")
        // ... en même temps, le noir
        .to(q(".voile"), {
          opacity: 1,
          duration: 3,
        }, "<")
        // et la tête du Chaperon
        // apparaît...
        .from(q(".morph"), {
          opacity: 0,
          duration: 1,
        }, "<")
        // ... puis, 1 part plus tard ("<1"),
        // devient une gueule
        .to(q(".morph__capuche"), {
          morphSVG: q(".morph__haut")[0],
          stroke: "#F2F2F2",
          duration: 2,
        }, "<1")
        .to(q(".morph__visage"), {
          morphSVG: q(".morph__bas")[0],
          stroke: "#F2F2F2",
          duration: 2,
        }, "<")
        .to(q(".morph__oeil"), {
          opacity: 0,
          duration: 0.5,
        }, "<")
        // 4. Une pause à la fin,
        //    avant de libérer la scène
        .to({}, { duration: 1.5 });
    }
  );
}

const section =
  document.querySelector("#la-clairiere");
animate(section);
