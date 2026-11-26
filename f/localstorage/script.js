// Clé utilisée dans localStorage
const CLE = "nom";

const champ = document.querySelector("#nom");
const etat = document.querySelector("#etat");
const etatTexte = document.querySelector("#etat-texte");

// Au chargement de la page :
// Met le contenu de la clé localstorage nom dans le champ
// champ.value = localStorage.getItem(CLE);

// Enregistrer
document.querySelector("#btn-enregistrer").addEventListener("click", () => {
  localStorage.setItem(CLE, champ.value);
});

// Supprimer
document.querySelector("#btn-supprimer").addEventListener("click", () => {
  localStorage.removeItem(CLE);
});

// Rafraîchir la page
document.querySelector("#btn-rafraichir").addEventListener("click", () => {
  location.reload();
});
