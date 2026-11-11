
    gsap.to("#lecture", {
      duration: 10,
  ease: "none",
  repeat: -1,
  motionPath: {
    path: "#route-bateau",      // un <path> SVG
    align: "#route-bateau",     // place l'élément sur le tracé
    alignOrigin: [0.5, 0.5],    // le point de l'élément posé sur le tracé (ici, son centre)
    autoRotate: true            // oriente l'élément selon la direction
  }
      
    });
  }

