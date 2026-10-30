/**
 * Fenêtre « Intégrer »
 * --------------------
 * Choisir les options de la visionneuse, voir l'aperçu, copier le code de l'iframe.
 * Les dernières options choisies sont mémorisées dans le navigateur (localStorage).
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

  const CLE_OPTIONS = "fragment.integrer.options";

  // ---------- Mémoire des options ----------

  /** État du formulaire : { nom: [valeurs cochées] } pour les cases, { nom: valeur } pour les listes. */
  function lireFormulaire(form) {
    const options = {};
    form.querySelectorAll("input[type=checkbox]").forEach((c) => {
      options[c.name] = options[c.name] || [];
      if (c.checked) options[c.name].push(c.value);
    });
    form.querySelectorAll("select").forEach((s) => { options[s.name] = s.value; });
    return options;
  }

  function memoriser(form) {
    try { localStorage.setItem(CLE_OPTIONS, JSON.stringify(lireFormulaire(form))); } catch (e) { /* stockage indisponible */ }
  }

  function restaurer(form) {
    let options;
    try { options = JSON.parse(localStorage.getItem(CLE_OPTIONS) || "null"); } catch (e) { options = null; }
    if (!options) return;
    form.querySelectorAll("input[type=checkbox]").forEach((c) => {
      if (Array.isArray(options[c.name])) c.checked = options[c.name].includes(c.value);
    });
    majOnglets(); // la liste « Onglet ouvert au départ » dépend des onglets cochés
    form.querySelectorAll("select").forEach((s) => {
      if (typeof options[s.name] === "string" && [...s.options].some((o) => o.value === options[s.name])) {
        s.value = options[s.name];
      }
    });
  }

  const html = String.raw;

  function creer() {
    dialogue = document.createElement("dialog");
    dialogue.className = "integrer dialog";
    // Icônes Lucide (commun/ui.js), si la page charge ui.js
    const icone = (nom) => (typeof UI === "undefined" ? "" : UI.icone(nom));
    dialogue.innerHTML = html`
      <form method="dialog" class="integrer-grille">
        <header class="integrer-entete">
          <div>
            <h2 class="dialog-titre">Intégrer</h2>
            <p class="description integrer-nom"></p>
          </div>
          <button value="fermer" class="btn btn-ghost btn-sm btn-icon integrer-fermer" title="Fermer" aria-label="Fermer">
            ${icone("x")}
          </button>
        </header>

        <div class="integrer-options">
          <fieldset>
            <legend class="label">Onglets visibles</legend>
            <div class="integrer-cases">
              ${Object.entries(LIBELLES).map(([v, l]) =>
                `<label class="choix"><input class="checkbox" type="checkbox" name="onglets" value="${v}" checked> ${l}</label>`).join("")}
            </div>
          </fieldset>

          <label class="integrer-champ"><span class="label">Onglet ouvert au départ</span>
            <select class="select" name="actif"></select>
          </label>

          <label class="integrer-champ"><span class="label">Disposition</span>
            <select class="select" name="disposition">
              <option value="">(par défaut)</option>
              <option value="onglets">Onglets</option>
              <option value="cote">Code à côté du résultat</option>
              <option value="pile">Code au-dessus du résultat</option>
            </select>
          </label>

          <label class="integrer-champ"><span class="label">Thème du code</span>
            <select class="select" name="theme">
              <option value="sombre">Sombre</option>
              <option value="clair">Clair</option>
            </select>
          </label>

          <fieldset>
            <legend class="label">Options</legend>
            <div class="integrer-cases integrer-colonne">
              <label class="choix"><input class="checkbox" type="checkbox" name="modifiable"> Modifiable (aperçu en direct)</label>
              <label class="choix"><input class="checkbox" type="checkbox" name="numeros"> Numéros de ligne</label>
              <label class="choix"><input class="checkbox" type="checkbox" name="html-complet"> HTML complet</label>
            </div>
          </fieldset>

          <fieldset>
            <legend class="label">Boutons</legend>
            <div class="integrer-cases">
              <label class="choix"><input class="checkbox" type="checkbox" name="boutons" value="rejouer" checked> Rejouer</label>
              <label class="choix"><input class="checkbox" type="checkbox" name="boutons" value="ouvrir" checked> Ouvrir</label>
            </div>
          </fieldset>

          <label class="integrer-champ"><span class="label">Proportions (classe du compendium)</span>
            <select class="select" name="aspect">
              ${PROPORTIONS.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}
            </select>
          </label>
        </div>

        <div class="integrer-sortie">
          <p class="integrer-avis" hidden></p>
          <iframe class="integrer-apercu aspect-3-2" title="Aperçu de l'intégration"></iframe>
          <div class="integrer-code">
            <code class="integrer-extrait"></code>
            <div class="integrer-actions">
              <a class="btn btn-link integrer-lien" target="_blank" rel="noopener">Ouvrir la visionneuse ${icone("external-link")}</a>
              <button type="button" class="btn btn-ghost btn-sm integrer-defaut" title="Revenir aux options par défaut">Options par défaut</button>
              <button type="button" class="btn btn-sm integrer-copier">${icone("copy")}<span>Copier</span></button>
            </div>
          </div>
        </div>
      </form>`;
    document.body.append(dialogue);

    const form = dialogue.querySelector("form");
    const defauts = lireFormulaire(form); // état initial du gabarit = options par défaut
    form.addEventListener("input", (e) => {
      if (e.target.name === "onglets") majOnglets();
      memoriser(form);
      construire();
    });
    dialogue.querySelector(".integrer-defaut").addEventListener("click", () => {
      try { localStorage.removeItem(CLE_OPTIONS); } catch (e) { /* stockage indisponible */ }
      form.querySelectorAll("input[type=checkbox]").forEach((c) => { c.checked = defauts[c.name].includes(c.value); });
      majOnglets();
      form.querySelectorAll("select").forEach((s) => { s.value = defauts[s.name]; });
      construire();
    });
    dialogue.querySelector(".integrer-copier").addEventListener("click", async (e) => {
      try {
        await navigator.clipboard.writeText(dialogue.querySelector(".integrer-extrait").textContent);
        const texte = e.currentTarget.querySelector("span");
        const use = e.currentTarget.querySelector("use");
        const changer = (mot, nom) => {
          texte.textContent = mot;
          if (use) use.setAttribute("href", use.getAttribute("href").replace(/#.*$/, `#${nom}`));
        };
        changer("Copié !", "check");
        setTimeout(() => changer("Copier", "copy"), 1500);
      } catch (err) { /* presse-papiers indisponible */ }
    });
    // Libérer l'aperçu à la fermeture
    dialogue.addEventListener("close", () => {
      dialogue.querySelector(".integrer-apercu").src = "about:blank";
      dernierSrc = "";
    });
    majOnglets();
    restaurer(form);
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

  /**
   * publication (facultatif) : promesse résolue quand le fragment est en ligne.
   * En attendant, un avis est affiché ; l'aperçu se recharge ensuite tout seul.
   */
  function ouvrir(nom, { racine, titre, publication } = {}) {
    if (!dialogue) creer();
    nomCourant = nom;
    racineCourante = racine || new URL("./", location.href).href;
    dialogue.querySelector(".integrer-nom").textContent = titre || nom;

    const avis = dialogue.querySelector(".integrer-avis");
    avis.hidden = !publication;
    if (publication) {
      avis.textContent = "Publication en cours sur GitHub Pages (environ une minute) : l'aperçu se mettra à jour tout seul. " +
        "Le code de l'iframe est déjà bon et peut être copié.";
      publication.then(
        () => {
          if (nomCourant !== nom) return;
          avis.hidden = true;
          dernierSrc = "";
          if (dialogue.open) construire();
        },
        () => {
          if (nomCourant !== nom) return;
          avis.textContent = "La publication tarde : l'aperçu pourra être vérifié plus tard. Le code de l'iframe reste valide.";
        }
      );
    }

    dialogue.showModal();
    construire();
  }

  return { ouvrir };
})();
