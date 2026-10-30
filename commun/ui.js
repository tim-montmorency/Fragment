/**
 * Fragment — utilitaires d'interface communs
 * ------------------------------------------
 * UI.icone(nom)  : balise <svg> d'une icône Lucide du fichier commun/icones.svg
 * Infobulles     : tout élément avec un attribut title (ou data-infobulle) reçoit une
 *                  infobulle au style shadcn, au survol et au focus clavier.
 *                  Le title est converti à la volée (pas d'infobulle native en double).
 */
const UI = (() => {
  "use strict";

  // Adresse du fichier d'icônes, déduite de l'emplacement de ce script (commun/ui.js)
  const SPRITE = new URL("icones.svg", document.currentScript.src).href;

  /** Code HTML d'une icône (décorative par défaut). */
  function icone(nom, classe = "") {
    return `<svg class="icone${classe ? " " + classe : ""}" aria-hidden="true" focusable="false"><use href="${SPRITE}#${nom}"/></svg>`;
  }

  // ---------- Infobulles ----------

  const DELAI = 450;          // avant la première infobulle
  const DELAI_ENCHAINE = 80;  // quand une infobulle vient d'être affichée (survol d'une barre d'outils)
  const MARGE = 8;

  let bulle;
  let cible = null;
  let minuterie;
  let derniereFermeture = 0;

  function creerBulle() {
    bulle = document.createElement("div");
    bulle.className = "infobulle";
    bulle.setAttribute("role", "tooltip");
    bulle.id = "infobulle";
    document.body.append(bulle);
  }

  /** Texte de l'infobulle ; le title natif est déplacé dans data-infobulle. */
  function texteDe(el) {
    if (el.hasAttribute("title")) {
      const t = el.getAttribute("title");
      el.removeAttribute("title");
      if (t) {
        el.dataset.infobulle = t;
        // Bouton sans texte visible (icône seule) : le libellé sert aussi aux lecteurs d'écran
        if (!el.hasAttribute("aria-label") && !el.textContent.trim()) el.setAttribute("aria-label", t);
      }
    }
    return el.dataset.infobulle || "";
  }

  function positionner() {
    const r = cible.getBoundingClientRect();
    const b = bulle.getBoundingClientRect();
    const place = cible.dataset.infobullePosition;
    let haut = r.top - b.height - MARGE;
    let cote = "haut";
    // En bas si demandé, ou s'il manque de place au-dessus
    if (place === "bas" || haut < MARGE) {
      haut = r.bottom + MARGE;
      cote = "bas";
    }
    let gauche = r.left + r.width / 2 - b.width / 2;
    gauche = Math.max(MARGE, Math.min(gauche, window.innerWidth - b.width - MARGE));
    bulle.style.top = `${Math.round(haut)}px`;
    bulle.style.left = `${Math.round(gauche)}px`;
    bulle.dataset.cote = cote;
  }

  function afficher(el) {
    const texte = texteDe(el);
    if (!texte) return;
    if (!bulle) creerBulle();
    cible = el;
    bulle.textContent = texte;
    bulle.classList.remove("visible");
    bulle.style.display = "block";
    positionner();
    el.setAttribute("aria-describedby", "infobulle");
    requestAnimationFrame(() => bulle.classList.add("visible"));
  }

  function masquer() {
    clearTimeout(minuterie);
    if (!cible) return;
    cible.removeAttribute("aria-describedby");
    cible = null;
    derniereFermeture = Date.now();
    if (bulle) {
      bulle.classList.remove("visible");
      bulle.style.display = "none";
    }
  }

  function planifier(el) {
    clearTimeout(minuterie);
    const recent = Date.now() - derniereFermeture < 400;
    minuterie = setTimeout(() => afficher(el), recent ? DELAI_ENCHAINE : DELAI);
  }

  const porteur = (n) => n instanceof Element ? n.closest("[title], [data-infobulle]") : null;

  document.addEventListener("pointerover", (e) => {
    const el = porteur(e.target);
    if (el === cible) return;
    if (!el) return masquer();
    texteDe(el); // retire le title tout de suite : pas d'infobulle native
    masquer();
    planifier(el);
  });

  document.addEventListener("pointerout", (e) => {
    const el = porteur(e.target);
    if (el && !el.contains(e.relatedTarget)) {
      clearTimeout(minuterie);
      if (el === cible) masquer();
    }
  });

  // Clavier : infobulle au focus visible
  document.addEventListener("focusin", (e) => {
    const el = porteur(e.target);
    if (el && e.target.matches(":focus-visible")) planifier(el);
  });
  document.addEventListener("focusout", masquer);
  document.addEventListener("pointerdown", masquer, true);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") masquer(); });
  window.addEventListener("scroll", masquer, true);
  window.addEventListener("resize", masquer);

  return { icone };
})();
