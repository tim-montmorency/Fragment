gsap.registerPlugin(ScrollTrigger);

let animation = gsap.from(".carte", {
  x: -300,
  opacity: 0,
  rotation: -15,
  duration: 1,
  scrollTrigger: {
    trigger: ".carte",
    start: "top 66%",
    end: "bottom 33%",
    toggleActions: "play none none reverse",
    markers: true,
  },
});

// ----- Footer -----

let actions = animation.scrollTrigger.vars.toggleActions.split(" ");
let cases = document.querySelectorAll(".moment");
cases.forEach((uneCase, i) => {
  uneCase.querySelector("code").textContent = actions[i];
});
function allumer(i) {
  cases.forEach((uneCase) => uneCase.classList.remove("actif"));
  cases[i].classList.add("actif");
}
ScrollTrigger.create({
  trigger: ".carte",
  start: "top 80%",
  end: "bottom 20%",
  onEnter: () => allumer(0),
  onLeave: () => allumer(1),
  onEnterBack: () => allumer(2),
  onLeaveBack: () => allumer(3),
});
