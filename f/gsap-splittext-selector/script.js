let tableau = SplitText.create(".text", { type: "chars,words,lines" });

document.querySelector("#chars").addEventListener("click", () => {
  gsap.from(tableau.chars[2], {
    opacity: 0,
    rotation: 180,
    duration: 0.5,
    ease: "power4",
  });
});

document.querySelector("#words").addEventListener("click", () => {
  gsap.from(tableau.words[2], {
    x: -100,
    opacity: 0,
    duration: 0.5,
    ease: "back",
  });
});

document.querySelector("#lines").addEventListener("click", () => {
  gsap.fromTo(
    tableau.lines[2],
    { opacity: 0 },
    {
      opacity: 1,
      duration: 1,
      ease: "power3",
    },
  );
});
