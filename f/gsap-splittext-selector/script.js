let a = SplitText.create(".text", { type: "chars" });

document.querySelector("#chars").addEventListener("click", () => {
  gsap.from(a.chars[2], {
    x: 150,
    opacity: 0,
    duration: 0.7,
    ease: "power4",
  });
});

let b = SplitText.create(".text", { type: "words" });

document.querySelector("#words").addEventListener("click", () => {
  gsap.from(b.words[2], {
    y: -100,
    opacity: 0,
    rotation: "random(-80, 80)",
    duration: 0.7,
    ease: "back",
  });
});

let c = SplitText.create(".text", { type: "lines" });

document.querySelector("#lines").addEventListener("click", () => {
  gsap.from(c.lines[2], {
    rotationX: -100,
    transformOrigin: "50% 50% -160px",
    opacity: 0,
    duration: 0.8,
    ease: "power3",
  });
});
