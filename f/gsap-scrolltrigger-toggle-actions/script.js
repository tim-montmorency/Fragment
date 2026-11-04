gsap.registerPlugin(ScrollTrigger)

// ----- L'animation : la partie à retenir -----

let animation = gsap.from(".carte", {
  x: -300,
  opacity: 0,
  rotation: -15,
  duration: 1,
  scrollTrigger: {
    trigger: ".carte",
    start: "top 80%",     // la zone commence quand le haut de la carte croise 80 % de l'écran
    end: "bottom 20%",    // et finit quand le bas de la carte croise 20 % de l'écran
    toggleActions: "play none none reverse",
    //              onEnter onLeave onEnterBack onLeaveBack
    markers: true
  }
})

// À essayer : remplacer la valeur de toggleActions par
//   "play reverse play reverse"   → la carte n'est visible que dans la zone, entre start et end
//   "restart none restart none"   → l'animation rejoue à chaque entrée dans la zone
//   "play none none none"         → l'animation joue une seule fois, puis la carte reste
// Valeurs possibles : play, pause, resume, reverse, restart, reset, complete, none


// ----- Tableau de bord : seulement pour voir les 4 moments (pas nécessaire) -----

let actions = animation.scrollTrigger.vars.toggleActions.split(" ")
let cases = document.querySelectorAll(".moment")

// Affiche l'action prévue sous chaque moment
cases.forEach((uneCase, i) => {
  uneCase.querySelector("code").textContent = actions[i]
})

// Met en évidence le dernier moment survenu
function allumer(i) {
  cases.forEach(uneCase => uneCase.classList.remove("actif"))
  cases[i].classList.add("actif")
}

ScrollTrigger.create({
  trigger: ".carte",
  start: "top 80%",
  end: "bottom 20%",
  onEnter: () => allumer(0),
  onLeave: () => allumer(1),
  onEnterBack: () => allumer(2),
  onLeaveBack: () => allumer(3)
})
