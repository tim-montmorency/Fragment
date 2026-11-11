const chapters = [
  { id: "la-foret", titre: "La forêt" },
  { id: "la-maison", titre: "La maison" },
  { id: "le-loup", titre: "Le loup" },
  { id: "la-fin", titre: "La fin" },
];

// ---------- À gauche : JavaScript seul ----------
const links = document.querySelectorAll(".vanilla a");
const title = document.querySelector(".vanilla .actuel");

function setActive(index) {
  // L'oubli : on n'enlève jamais la classe des anciens liens
  links[index].classList.add("actif");
  title.textContent = chapters[index].titre;
}

// ---------- À droite : Vue ----------
const nav = Vue.createApp({
  data() {
    return {
      chapters: chapters,
      activeIndex: 0,
    };
  },
}).mount(".vue");

// ---------- Le bouton : change de chapitre des deux côtés ----------
let current = 0;
setActive(current);

document.querySelector(".next").addEventListener("click", () => {
  current = (current + 1) % chapters.length;

  setActive(current);        // JavaScript seul : il faut tout gérer
  nav.activeIndex = current; // Vue : on change la donnée, c'est tout
});
