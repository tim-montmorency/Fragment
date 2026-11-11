let split = SplitText.create(".text", { type: "chars,words,lines" });

document.querySelector("#chars").addEventListener("click", () => {
  gsap.from(split.chars, {
    x: 150,
    opacity: 0,
    duration: 0.7,
    ease: "power4",
    stagger: 0.04,
  });
});

document.querySelector("#words").addEventListener("click", () => {
  gsap.from(split.words, {
    y: -100,
    opacity: 0,
    rotation: "random(-80, 80)",
    duration: 0.7,
    ease: "back",
    stagger: 0.15,
  });
});

document.querySelector("#lines").addEventListener("click", () => {
  gsap.from(split.lines, {
    rotationX: -100,
    transformOrigin: "50% 50% -160px",
    opacity: 0,
    duration: 0.8,
    ease: "power3",
    stagger: 0.25,
  });
});
