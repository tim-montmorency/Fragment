const video = document.querySelector("#film");
const bouton = document.querySelector("#lecture");

bouton.addEventListener("click", () => {
  if (video.paused) {
    video.play();
  } else {
    video.pause();
  }
});

// Barre de progression
video.addEventListener("timeupdate", () => {
  const pourcent = (video.currentTime / video.duration) * 100;
  document.querySelector("#barre").style.width = pourcent + "%";
});
