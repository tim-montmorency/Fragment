gsap.fromTo(".pill", 
  { 
    x: "10vw", 
    y: "12vh",
    borderRadius: "5vw",
  },
  { 
    x: "80vw", 
    y: "80vh",
    borderRadius: 0, 
      width: "8vh",
    rotation: 180, 
    
    duration: 5,
    delay: 1
  }
);
