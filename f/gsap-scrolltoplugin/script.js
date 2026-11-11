document.querySelector("#section1Btn").addEventListener("click", () => {
  gsap.to(window, {
    duration: 1,
    scrollTo: { y: "#section" + (index + 1), offsetY: 120 },
  });
});
