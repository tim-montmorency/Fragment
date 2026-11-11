Draggable.create("#el1", {
  type: "x,y",
  bounds: ".container",
  inertia: true,
  onDragEnd() {
    // Si 50% de l'image draggé chevauche la zone
    if (this.hitTest("#zone", "50%")) {
      gsap.to("body", { backgroundColor: "red" });
    } else {
      gsap.to(this.target, { x: 0, y: 0 }); // retour à la case départ
    }
  },
});
