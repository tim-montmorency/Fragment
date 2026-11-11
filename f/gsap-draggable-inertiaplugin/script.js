Draggable.create(".el1", {
  type: "x",
  bounds: ".container",
});

Draggable.create(".el2", {
  type: "rotation",
  inertia: true,
});

Draggable.create(".el3", {
  bounds: ".container",
  inertia: true,
});
