let tableau = SplitText.create(".text", { type: "chars,words,lines" });

document.querySelector("#chars").addEventListener("click", () => {
  gsap.from(tableau.chars[2], {
    x: 150,
    opacity: 0,
    duration: 0.7,
    ease: "power4",
  });
});

document.querySelector("#words").addEventListener("click", () => {
  gsap.from(tableau.words[2], {
    y: -100,
    opacity: 0,
    rotation: "random(-80, 80)",
    duration: 0.7,
    ease: "back",
  });
});

document.querySelector("#lines").addEventListener("click", () => {
  gsap.from(tableau.lines[2], {
    rotationX: -100,
    transformOrigin: "50% 50% -160px",
    opacity: 0,
    duration: 0.8,
    ease: "power3",
  });
});
