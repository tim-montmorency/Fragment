gsap.registerPlugin(ScrollTrigger)

gsap.from(".carte", {
  y: 50,
  opacity: 0,
  duration: 1,
  scrollTrigger: {
    trigger: ".carte",   // l'élément qui déclenche
    start: "top 60%",    // quand le haut de .carte croise la ligne à 60 % de l'écran
    markers: true        // repères visuels (à retirer en production)
  }
})
