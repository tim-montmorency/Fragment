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
