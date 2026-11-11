document.querySelector("#section1Btn").addEventListener("click", () => {
  gsap.to(window, {
    duration: 1,
    scrollTo: { y: "#section1", offsetY: 120 },
  });
});

document.querySelector("#section2Btn").addEventListener("click", () => {
  gsap.to(window, {
    duration: 1,
    scrollTo: { y: "#section2", offsetY: 120 },
  });
});

document.querySelector("#section3Btn").addEventListener("click", () => {
  gsap.to(window, {
    duration: 1,
    scrollTo: { y: "#section3", offsetY: 120 },
  });
});
