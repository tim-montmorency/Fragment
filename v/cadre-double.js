/**
 * Aperçu sans flash blanc (double tampon)
 * ---------------------------------------
 * Chaque nouvelle version est chargée dans une iframe invisible, placée
 * par-dessus l'ancienne. L'échange ne se fait qu'une fois la nouvelle
 * version chargée : l'ancienne reste affichée pendant ce temps.
 * La position de défilement est conservée d'une version à l'autre.
 *
 * Utilisé par la visionneuse (v/) et le studio (studio/).
 *
 *   const cadre = CadreDouble.creer(conteneur, { titre: "Résultat" });
 *   cadre.charger({ srcdoc: "<!doctype html>…" });   // ou { src: "https://…" }
 */
const CadreDouble = (() => {
  "use strict";

  const DELAI_MAX = 2000; // échange forcé si le chargement tarde (script bloquant, etc.)

  function creer(conteneur, { titre = "Aperçu", allow = "fullscreen; autoplay; clipboard-write" } = {}) {
    conteneur.classList.add("cadre-double");
    let visible = null;
    let enAttente = null;

    function defilement(iframe) {
      try {
        const w = iframe.contentWindow;
        return { x: w.scrollX, y: w.scrollY };
      } catch (e) {
        return null; // autre origine : position inaccessible
      }
    }

    function echanger(iframe) {
      if (enAttente !== iframe) return;
      enAttente = null;
      iframe.classList.remove("cadre-cache");
      iframe.removeAttribute("aria-hidden");
      if (visible) visible.remove();
      visible = iframe;
    }

    function charger({ src, srcdoc }) {
      if (enAttente) enAttente.remove();

      const iframe = document.createElement("iframe");
      iframe.title = titre;
      iframe.setAttribute("allow", allow);
      iframe.className = "cadre cadre-cache";
      iframe.setAttribute("aria-hidden", "true");
      enAttente = iframe;

      const position = visible ? defilement(visible) : null;
      const minuterie = setTimeout(() => echanger(iframe), DELAI_MAX);

      iframe.addEventListener("load", () => {
        clearTimeout(minuterie);
        // Deux images d'affichage : laisse le temps aux styles générés par script (ex. Tailwind).
        // Le défilement ne s'applique qu'après la première mise en page, d'où sa place ici.
        requestAnimationFrame(() => requestAnimationFrame(() => {
          if (position) {
            try { iframe.contentWindow.scrollTo(position.x, position.y); } catch (e) { /* autre origine */ }
          }
          echanger(iframe);
        }));
      }, { once: true });

      conteneur.append(iframe);
      if (srcdoc != null) iframe.srcdoc = srcdoc;
      else iframe.src = src;
    }

    return { charger };
  }

  return { creer };
})();
