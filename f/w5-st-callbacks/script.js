gsap.registerPlugin(ScrollTrigger);

const eventLabel =
  document.querySelector(".event");
const progressLabel =
  document.querySelector(".progress");
const directionLabel =
  document.querySelector(".direction");

// Pas d'animation : ScrollTrigger
// sert seulement de déclencheur
ScrollTrigger.create({
  trigger: ".zone",
  start: "top 60%",
  end: "bottom 40%",
  markers: true,
  onEnter: () => show("onEnter"),
  onLeave: () => show("onLeave"),
  onEnterBack: () => show("onEnterBack"),
  onLeaveBack: () => show("onLeaveBack"),
  
  // self : l'objet ScrollTrigger
  onUpdate: (self) => {
    progressLabel.textContent = self.progress.toFixed(2);
    directionLabel.textContent = self.direction === 1 ? "1 (bas)" : "-1 (haut)";
  },
  // la classe, pendant que
  // la zone est active
  toggleClass: {
    targets: ".zone",
    className: "is-active",
  },
});

function show(name) {
  eventLabel.textContent = name;
}
