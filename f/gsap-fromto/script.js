gsap.fromTo(".pill", 
  { 
    x: "10vw", 
    y: "10vh",
    borderRadius: "5vw",
  },
  { 
    x: "80vw", 
    y: "80vh",
    borderRadius: 0, 
    
    width: "8vw",
    rotation: 180, 
    
    duration: 5,
    delay: 1
  }
);
