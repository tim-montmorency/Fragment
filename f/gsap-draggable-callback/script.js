Draggable.create("#el1", {
  type: "x,y",
  bounds: ".container",
  inertia: true,
  onDragEnd() {
    if (this.hitTest(".zone", "50%")) {
      // 50 % de la clé chevauche le coffre
      ouvrirCoffre();
    } else {
      gsap.to(this.target, { x: 0, y: 0 }); // retour à la case départ
    }
  },
});
