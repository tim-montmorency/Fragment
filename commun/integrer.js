/**
 * Fenêtre « Intégrer »
 * --------------------
 * Choisir les options de la visionneuse, voir l'aperçu, copier le code de l'iframe.
 * Utilisée par la galerie (accueil) et le studio.
 *
 *   Integrer.ouvrir("gsap-to", { racine: "https://…/Fragment/", titre: "GSAP - to()" });
 */
const Integrer = (() => {
  "use strict";

  const LIBELLES = { html: "HTML", css: "CSS", js: "JS", resultat: "Résultat" };
  const PROPORTIONS = [
    ["aspect-3-2", "3:2"], ["aspect-16-9", "16:9"], ["aspect-4-3", "4:3"],
    ["aspect-1-1", "1:1"], ["aspect-2-1", "2:1"], ["aspect-3-1", "3:1"],
  ];

  let dialogue;
  let nomCourant = "";
  let racineCourante = "";
  let dernierSrc = "";

  const html = String.raw;

  function creer() {
    dialogue = document.createElement("dialog");
    dialogue.className = "integrer";
    dialogue.innerHTML = html`
      <form method="dialog" class="integrer-grille">
        <header class="integrer-entete">
          <h2>Intégrer <span class="integrer-nom"></span></h2>
          <button value="fermer" class="integrer-fermer" title="Fermer">×</button>
        </header>

        <div class="integrer-options">
          <fieldset>
            <legend>Onglets visibles</legend>
            <div class="integrer-cases">
              ${Object.entries(LIBELLES).map(([v, l]) =>
                `<label><input type="checkbox" name="onglets" value="${v}" checked> ${l}</label>`).join("")}
            </div>
          </fieldset>

          <label>Onglet ouvert au départ
            <select name="actif"></select>
          </label>

          <label>Disposition
            <select name="disposition">
              <option value="">(par défaut)</option>
              <option value="onglets">Onglets</option>
              <option value="cote">Code à côté du résultat</option>
              <option value="pile">Code au-dessus du résultat</option>
            </select>
          </label>

          <label>Thème du code
            <select name="theme">
              <option value="sombre">Sombre</option>
              <option value="clair">Clair</option>
            </select>
          </label>

          <fieldset>
            <legend>Options</legend>
            <div class="integrer-cases">
              <label><input type="checkbox" name="modifiable"> Modifiable (aperçu en direct)</label>
              <label><input type="checkbox" name="numeros"> Numéros de ligne</label>
              <label><input type="checkbox" name="html-complet"> HTML complet</label>
            </div>
          </fieldset>

          <fieldset>
            <legend>Boutons</legend>
            <div class="integrer-cases">
              <label><input type="checkbox" name="boutons" value="rejouer" checked> Rejouer</label>
              <label><input type="checkbox" name="boutons" value="ouvrir" checked> Ouvrir</label>
            </div>
          </fieldset>

          <label>Proportions (classe du compendium)
            <select name="aspect">
              ${PROPORTIONS.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}
            </select>
          </label>
        </div>

        <div class="integrer-sortie">
          <iframe class="integrer-apercu aspect-3-2" title="Aperçu de l'intégration"></iframe>
          <div class="integrer-code">
            <code class="integrer-extrait"></code>
            <div class="integrer-actions">
              <a class="integrer-lien" target="_blank" rel="noopener">Ouvrir la visionneuse ↗</a>
              <button type="button" class="integrer-copier">Copier</button>
            </div>
          </div>
        </div>
      </form>`;
    document.body.append(dialogue);

    const form = dialogue.querySelector("form");
    form.addEventListener("input", (e) => {
      if (e.target.name === "onglets") majOnglets();
      construire();
    });
    dialogue.querySelector(".integrer-copier").addEventListener("click", async (e) => {
      try {
        await navigator.clipboard.writeText(dialogue.querySelector(".integrer-extrait").textContent);
        e.target.textContent = "Copié !";
        setTimeout(() => (e.target.textContent = "Copier"), 1500);
      } catch (err) { /* presse-papiers indisponible */ }
    });
    // Libérer l'aperçu à la fermeture
    dialogue.addEventListener("close", () => {
      dialogue.querySelector(".integrer-apercu").src = "about:blank";
      dernierSrc = "";
    });
    majOnglets();
  }

  /** La liste « Onglet ouvert au départ » suit les onglets cochés. */
  function majOnglets() {
    const select = dialogue.querySelector('[name="actif"]');
    const choix = select.value;
    const coches = [...dialogue.querySelectorAll('[name="onglets"]:checked')].map((c) => c.value);
    select.innerHTML = '<option value="">(le premier)</option>' +
      coches.map((c) => `<option value="${c}">${LIBELLES[c]}</option>`).join("");
    select.value = coches.includes(choix) ? choix : "";
  }

  function construire() {
    const f = new FormData(dialogue.querySelector("form"));
    const p = new URLSearchParams();
    p.set("ex", nomCourant);

    const onglets = f.getAll("onglets");
    if (onglets.join(",") !== "html,css,js,resultat") p.set("onglets", onglets.join(","));
    if (f.get("actif")) p.set("actif", f.get("actif"));
    if (f.get("modifiable")) p.set("modifiable", "1");
    if (f.get("disposition")) p.set("disposition", f.get("disposition"));
    if (f.get("theme") !== "sombre") p.set("theme", f.get("theme"));
    if (f.get("numeros")) p.set("numeros", "1");
    if (f.get("html-complet")) p.set("html", "complet");
    const boutons = f.getAll("boutons");
    if (boutons.length < 2) p.set("boutons", boutons.join(","));

    const src = `${racineCourante}v/?${p.toString().replace(/%2C/g, ",")}`;
    const aspect = f.get("aspect");

    const apercu = dialogue.querySelector(".integrer-apercu");
    apercu.className = `integrer-apercu ${aspect}`;
    if (src !== dernierSrc) { apercu.src = src; dernierSrc = src; }
    dialogue.querySelector(".integrer-lien").href = src;
    dialogue.querySelector(".integrer-extrait").textContent =
      `<iframe src="${src}" class="${aspect}" style="width:100%;border:0" loading="lazy"></iframe>`;
  }

  function ouvrir(nom, { racine, titre } = {}) {
    if (!dialogue) creer();
    nomCourant = nom;
    racineCourante = racine || new URL("./", location.href).href;
    dialogue.querySelector(".integrer-nom").textContent = titre || nom;
    dialogue.showModal();
    construire();
  }

  return { ouvrir };
})();
