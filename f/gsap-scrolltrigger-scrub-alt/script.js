gsap.registerPlugin(ScrollTrigger)

gsap.from(".barre", {
  scaleX: 1,
  ease: 'linear',
  
  scrollTrigger: {
    trigger: ".section",   
    start: "top top",    
    end: "bottom bottom",  
    scrub: 1,
    markers: true  
  }
})
