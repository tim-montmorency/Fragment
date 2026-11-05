gsap.registerPlugin(ScrollTrigger);

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
          end: "+=300%",
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
        // 2. Entre par la gauche
        .from(q(".perso--gauche"), {
          x: "-50vw",
          duration: 1,
        })
        // 3. Entre par la droite...
        .from(q(".perso--droite"), {
          x: "50vw",
          duration: 1,
        })
        // ... en même temps :
        // l'explosion et le noir
        .from(q(".explosion"), {
          scale: 0,
          opacity: 0,
        }, "<")
        .to(q(".voile"), {
          opacity: 1,
        }, "<");
    }
  );
}

const section =
  document.querySelector("#la-clairiere");
animate(section);
