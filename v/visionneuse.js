/**
 * Visionneuse d'exemples
 * ----------------------
 * Affiche le code et/ou le résultat d'un exemple selon les paramètres d'URL.
 *
 *   v/?ex=web3/gsap-to&onglets=js,resultat&actif=js
 *   v/?ex=web3/gsap-to&modifiable=1          ← éditeurs + aperçu en direct
 *   v/?ex=web3/gsap-to&boutons=rejouer       ← seulement le bouton Rejouer
 *
 * Chaque exemple est un dossier contenant index.html (obligatoire),
 * style.css et script.js (facultatifs). Le résultat est index.html chargé
 * dans une iframe : l'exemple peut utiliser n'importe quelle technologie
 * sans que la visionneuse ait à la connaître.
 *
 * La liste complète des paramètres est dans README.md.
 */
(() => {
  "use strict";

  const app = document.getElementById("app");
  const P = new URLSearchParams(location.search);

  const FICHIERS = { html: "index.html", css: "style.css", js: "script.js" };
  const LANGAGES = { html: "xml", css: "css", js: "javascript" };
  const LIBELLES = { html: "HTML", css: "CSS", js: "JS", resultat: "Résultat" };
  const DELAI_APERCU = 500; // ms entre la dernière frappe et la mise à jour du résultat

  // ---------- Lecture des paramètres ----------

  const ex = (P.get("ex") || "").trim().replace(/^\/+|\/+$/g, "");
  const exValide = /^[a-z0-9_-]+(\/[a-z0-9_-]+)*$/i.test(ex);

  const ongletsDemandes = (P.get("onglets") || "html,css,js,resultat")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s, i, t) => s in LIBELLES && t.indexOf(s) === i);

  let modifiable = P.get("modifiable") === "1";

  // En mode modifiable, le code à côté du résultat est la disposition par défaut.
  const dispositionDemandee = ["onglets", "cote", "pile"].includes(P.get("disposition"))
    ? P.get("disposition")
    : modifiable ? "cote" : "onglets";

  const theme = P.get("theme") === "clair" ? "clair" : "sombre";
  const htmlComplet = P.get("html") === "complet";
  const numeros = P.get("numeros") === "1";

  // Boutons Rejouer et Ouvrir : les deux par défaut ; « boutons= » (vide) les masque.
  // Réinitialiser est toujours présent en mode modifiable.
  const boutons = new Set(
    (P.has("boutons") ? P.get("boutons") : "rejouer,ouvrir")
      .split(",").map((s) => s.trim().toLowerCase())
  );

  // ---------- Utilitaires ----------

  function message(texte) {
    app.innerHTML = "";
    app.className = "";
    const p = document.createElement("p");
    p.className = "message";
    p.textContent = texte;
    app.append(p);
  }

  /** Retire l'indentation commune et les lignes vides au début et à la fin. */
  function desindenter(texte) {
    const lignes = texte.replace(/\t/g, "  ").split("\n");
    while (lignes.length && !lignes[0].trim()) lignes.shift();
    while (lignes.length && !lignes[lignes.length - 1].trim()) lignes.pop();
    if (!lignes.length) return "";
    const retrait = Math.min(
      ...lignes.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length)
    );
    return lignes.map((l) => l.slice(retrait)).join("\n");
  }

  /**
   * Repère la vraie balise <body> : la recherche commence après </head>, pour ignorer
   * un « <body> » écrit dans un commentaire ou un texte de l'en-tête.
   * Retourne { debut, fin, ouverture, contenu, fermeture } ou null.
   */
  function trouverCorps(html) {
    const finTete = html.search(/<\/head\s*>/i);
    const depart = finTete >= 0 ? finTete : 0;
    const m = html.slice(depart).match(/(<body\b[^>]*>)([\s\S]*)(<\/body\s*>)/i);
    if (!m) return null;
    const debut = depart + m.index;
    return { debut, fin: debut + m[0].length, ouverture: m[1], contenu: m[2], fermeture: m[3] };
  }
  const RE_SCRIPT_SRC = /^[ \t]*<script\b[^>]*\bsrc=[^>]*>\s*<\/script>[ \t]*\r?\n?/gim;

  /**
   * Mode « corps » : seulement le contenu de <body>, sans les balises <script src>.
   * Retourne aussi les balises retirées, pour pouvoir reconstruire la page.
   */
  function corpsHtml(html) {
    const c = trouverCorps(html);
    if (!c) return { texte: html, scripts: [] };
    const scripts = (c.contenu.match(RE_SCRIPT_SRC) || []).map((s) => s.trim());
    return { texte: desindenter(c.contenu.replace(RE_SCRIPT_SRC, "")), scripts };
  }

  /** Découpe le HTML coloré en lignes en refermant/rouvrant les <span> ouverts. */
  function enLignes(html) {
    const lignes = [];
    const ouverts = [];
    let courante = "";
    for (const m of html.matchAll(/(<span[^>]*>)|(<\/span>)|(\n)|([^<\n]+)/g)) {
      if (m[1]) { ouverts.push(m[1]); courante += m[1]; }
      else if (m[2]) { ouverts.pop(); courante += m[2]; }
      else if (m[3]) {
        lignes.push(courante + "</span>".repeat(ouverts.length));
        courante = ouverts.join("");
      } else courante += m[4];
    }
    lignes.push(courante);
    return lignes;
  }

  function colorer(code, langage) {
    try {
      if (window.hljs) return hljs.highlight(code, { language: langage }).value;
    } catch (e) { /* coloration impossible : texte brut */ }
    return code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /** Charge l'éditeur seulement en mode modifiable. En cas d'échec : lecture seule. */
  function chargerEditeur() {
    return new Promise((resoudre) => {
      if (window.CM) return resoudre(true);
      const s = document.createElement("script");
      s.src = "vendor/codemirror.js";
      s.onload = () => resoudre(Boolean(window.CM));
      s.onerror = () => resoudre(false);
      document.head.append(s);
    });
  }

  // ---------- État de l'exemple ----------

  const etat = {
    url: "",          // URL du dossier de l'exemple
    brut: {},         // fichiers tels que sur le serveur
    original: {},     // texte affiché au départ dans chaque onglet
    courant: {},      // texte actuel (modifié ou non)
    scriptsCorps: [], // <script src> retirés de l'onglet HTML (mode corps)
    modifie: false,
  };

  /** Reconstruit la page complète à partir du code courant (mode modifiable). */
  function assembler() {
    const { brut, courant, url } = etat;
    let doc;

    if (htmlComplet) {
      doc = courant.html;
    } else {
      const contenu = `\n${courant.html}\n${etat.scriptsCorps.join("\n")}\n`;
      const c = trouverCorps(brut.html);
      doc = c
        ? brut.html.slice(0, c.debut) + c.ouverture + contenu + c.fermeture + brut.html.slice(c.fin)
        : courant.html;
    }

    if (courant.css != null) {
      doc = doc.replace(/<link\b[^>]*\bhref=["']?(\.\/)?style\.css["']?[^>]*>/i,
        () => `<style>\n${courant.css}\n</style>`);
    }

    if (courant.js != null) {
      doc = doc.replace(/<script\b([^>]*?)\s*\bsrc=["']?(\.\/)?script\.js["']?([^>]*)>\s*<\/script>/i,
        (m, avant, point, apres) => {
          let attributs = `${avant} ${apres}`.replace(/\s+/g, " ").trim();
          let js = courant.js.replace(/<\/script/gi, "<\\/script");
          // Un script en ligne ignore « defer » : on attend donc le chargement du DOM.
          if (/\bdefer\b/i.test(attributs) && !/type=["']?module/i.test(attributs)) {
            attributs = attributs.replace(/\s*\bdefer\b/i, "");
            js = `document.addEventListener("DOMContentLoaded", () => {\n${js}\n});`;
          }
          return `<script${attributs ? " " + attributs : ""}>\n${js}\n<\/script>`;
        });
    }

    // Les chemins relatifs (images, etc.) restent résolus par rapport au dossier de l'exemple.
    const base = `<base href="${url}">`;
    return /<head[^>]*>/i.test(doc) ? doc.replace(/<head[^>]*>/i, (m) => m + base) : base + doc;
  }

  // ---------- Construction des panneaux ----------

  function panneauCode(cle, texte) {
    const pre = document.createElement("pre");
    if (numeros) pre.classList.add("numeros");
    const code = document.createElement("code");
    code.className = `hljs language-${LANGAGES[cle]}`;
    code.innerHTML = enLignes(colorer(texte.replace(/\s+$/, ""), LANGAGES[cle]))
      .map((l) => `<span class="ligne">${l}</span>`)
      .join("");
    pre.append(code);
    return { element: pre };
  }

  function panneauEditeur(cle, texte, surChangement) {
    const conteneur = document.createElement("div");
    conteneur.className = "editeur";
    const langage = { html: CM.html, css: CM.css, js: CM.javascript }[cle];
    const extensions = [
      CM.configuration({ numeros }),
      langage(),
      CM.EditorView.updateListener.of((maj) => {
        if (maj.docChanged) surChangement(cle, maj.state.doc.toString());
      }),
    ];
    if (theme === "sombre") extensions.push(CM.oneDark);
    const vue = new CM.EditorView({ doc: texte, extensions, parent: conteneur });
    return {
      element: conteneur,
      rafraichir: () => vue.requestMeasure(),
      remplacer: (nouveau) => vue.dispatch({ changes: { from: 0, to: vue.state.doc.length, insert: nouveau } }),
    };
  }

  function panneauResultat() {
    const iframe = document.createElement("iframe");
    iframe.title = "Résultat de l'exemple";
    iframe.setAttribute("allow", "fullscreen; autoplay; clipboard-write");
    let demarre = false;

    const charger = () => {
      if (modifiable) iframe.srcdoc = assembler();
      else iframe.src = etat.url;
    };

    // Le résultat démarre seulement lorsqu'il est visible à l'écran,
    // pour qu'une animation ne soit pas terminée avant d'être vue.
    const demarrer = () => {
      if (demarre) return;
      demarre = true;
      charger();
    };

    return {
      element: iframe,
      afficher(conteneur) {
        if (demarre) return;
        const obs = new IntersectionObserver((entrees) => {
          if (entrees.some((e) => e.isIntersecting)) { demarrer(); obs.disconnect(); }
        }, { threshold: 0.5 });
        obs.observe(conteneur);
      },
      rejouer() {
        if (!demarre) return demarrer();
        charger();
      },
    };
  }

  function bouton(texte, titre, action) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = texte;
    b.title = titre;
    b.addEventListener("click", action);
    return b;
  }

  function creerGroupe(cles, panneauxCode, resultat, outilsCode) {
    const groupe = document.createElement("section");
    groupe.className = "groupe";

    const barre = document.createElement("div");
    barre.className = "barre";
    const onglets = document.createElement("div");
    onglets.className = "onglets";
    onglets.setAttribute("role", "tablist");
    const panneaux = document.createElement("div");
    panneaux.className = "panneaux";

    const elements = {};

    cles.forEach((cle) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "onglet";
      b.setAttribute("role", "tab");
      b.textContent = LIBELLES[cle];
      if (cle === "resultat" && modifiable) {
        const direct = document.createElement("span");
        direct.className = "direct";
        direct.title = "Aperçu en direct";
        b.append(direct);
      }

      const panneau = document.createElement("div");
      panneau.className = `panneau panneau-${cle}`;
      panneau.setAttribute("role", "tabpanel");
      panneau.append(cle === "resultat" ? resultat.element : panneauxCode[cle].element);

      b.addEventListener("click", () => activer(cle));
      onglets.append(b);
      panneaux.append(panneau);
      elements[cle] = { bouton: b, panneau };
    });

    function activer(cible) {
      cles.forEach((cle) => {
        const actif = cle === cible;
        elements[cle].bouton.setAttribute("aria-selected", actif);
        elements[cle].panneau.hidden = !actif;
      });
      if (cible === "resultat") resultat.afficher(elements.resultat.panneau);
      else panneauxCode[cible].rafraichir?.();
    }

    const outils = document.createElement("div");
    outils.className = "outils";

    if (modifiable && cles.some((c) => c !== "resultat")) {
      outils.append(outilsCode());
    }

    if (cles.includes("resultat") && boutons.has("rejouer")) {
      outils.append(
        bouton("↻ Rejouer", "Relancer l'exemple", () => { activer("resultat"); resultat.rejouer(); })
      );
    }

    if (cles.includes("resultat") && boutons.has("ouvrir")) {
      outils.append(
        bouton("↗ Ouvrir", "Ouvrir l'exemple dans un nouvel onglet", () => {
          if (modifiable && etat.modifie) {
            const blob = new Blob([assembler()], { type: "text/html" });
            window.open(URL.createObjectURL(blob), "_blank");
          } else {
            window.open(etat.url, "_blank", "noopener");
          }
        })
      );
    }

    barre.append(onglets, outils);
    groupe.append(barre, panneaux);

    const demande = P.get("actif");
    activer(cles.includes(demande) ? demande : cles[0]);
    return groupe;
  }

  // ---------- Démarrage ----------

  async function lireFichier(url) {
    try {
      const r = await fetch(url, { cache: "no-cache" });
      return r.ok ? await r.text() : null;
    } catch (e) {
      return null;
    }
  }

  async function demarrer() {
    document.body.classList.add(`theme-${theme}`);
    document.getElementById("hljs-sombre").disabled = theme !== "sombre";
    document.getElementById("hljs-clair").disabled = theme !== "clair";

    if (!exValide) return message("Exemple introuvable.");

    const base = new URL(`../${ex}/`, location.href);
    etat.url = base.href;

    const [fichiers, editeurPret] = await Promise.all([
      Promise.all(Object.entries(FICHIERS).map(async ([cle, f]) => [cle, await lireFichier(new URL(f, base))])),
      modifiable ? chargerEditeur() : Promise.resolve(false),
    ]);
    modifiable = editeurPret;
    etat.brut = Object.fromEntries(fichiers);

    // Live Server (VS Code) injecte son propre script dans les pages HTML : on le retire.
    if (etat.brut.html) {
      etat.brut.html = etat.brut.html.replace(
        /[ \t]*<!--\s*Code injected by live-server\s*-->[\s\S]*?<\/script>[ \t]*\r?\n?/i, "");
    }

    if (etat.brut.html === null) return message(`Exemple introuvable : ${ex}`);

    etat.original = { ...etat.brut };
    if (!htmlComplet) {
      const corps = corpsHtml(etat.brut.html);
      etat.original.html = corps.texte;
      etat.scriptsCorps = corps.scripts;
    }
    etat.courant = { ...etat.original };

    const resultat = panneauResultat();

    // Mise à jour du résultat après une courte pause dans la frappe
    let minuterie;
    const surChangement = (cle, texte) => {
      etat.courant[cle] = texte;
      etat.modifie = true;
      clearTimeout(minuterie);
      minuterie = setTimeout(() => resultat.rejouer(), DELAI_APERCU);
    };

    const codes = ongletsDemandes.filter((c) => c !== "resultat");
    const panneauxCode = {};
    codes.forEach((cle) => {
      const texte = etat.original[cle];
      if (texte == null || (!texte.trim() && !modifiable)) return;
      panneauxCode[cle] = modifiable
        ? panneauEditeur(cle, texte, surChangement)
        : panneauCode(cle, texte);
    });

    const outilsCode = () =>
      bouton("⟲ Réinitialiser", "Revenir au code d'origine", () => {
        Object.entries(panneauxCode).forEach(([cle, p]) => p.remplacer(etat.original[cle]));
        etat.courant = { ...etat.original };
        etat.modifie = false;
        clearTimeout(minuterie);
        resultat.rejouer();
      });

    const codesPresents = codes.filter((c) => panneauxCode[c]);
    const avecResultat = ongletsDemandes.includes("resultat");
    if (!codesPresents.length && !avecResultat) return message("Aucun onglet à afficher.");

    app.innerHTML = "";

    // Sans code ou sans résultat, les dispositions « cote » et « pile » reviennent aux onglets.
    const separe = dispositionDemandee !== "onglets" && codesPresents.length && avecResultat;
    app.className = `disposition-${separe ? dispositionDemandee : "onglets"}`;

    if (separe) {
      app.append(
        creerGroupe(codesPresents, panneauxCode, resultat, outilsCode),
        creerGroupe(["resultat"], panneauxCode, resultat, outilsCode)
      );
    } else {
      const cles = ongletsDemandes.filter((c) => c === "resultat" || panneauxCode[c]);
      app.append(creerGroupe(cles, panneauxCode, resultat, outilsCode));
    }
  }

  demarrer().catch(() => message("Impossible d'afficher l'exemple."));
})();
