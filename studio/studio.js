/**
 * Fragment — Studio
 * -----------------
 * Création et modification d'exemples, avec aperçu en direct.
 * L'enregistrement fait un commit dans le répertoire GitHub (voir github.js).
 *
 * Chaque fragment est généré dans f/<nom>/ :
 *   index.html, style.css, script.js et fragment.json (titre, tags, dates)
 * L'index central fragments.json (galerie) est mis à jour dans le même commit.
 */
(() => {
  "use strict";

  // ---------- Constantes ----------

  const SITE = new URL("../", location.href);           // racine du site Fragment
  const SLUG = /^[a-z0-9_-]+$/i;
  const DELAI_APERCU = 400;
  const CLE_REGLAGES = "fragment.studio.reglages";

  const DEFAUTS = {
    html: "<h1>Bonjour</h1>",
    css: "body {\n  margin: 0;\n  font-family: system-ui, sans-serif;\n}",
    js: 'console.log("Exemple prêt")',
  };

  const $ = (id) => document.getElementById(id);

  // ---------- État ----------

  const etat = {
    ex: null,               // nom du fragment ouvert (null = nouveau)
    copieDe: null,          // nom d'origine quand le fragment est une copie (Dupliquer)
    meta: {},               // contenu de fragment.json du fragment ouvert
    fragments: [],          // index : [{ nom, titre, tags, modifie }]
    ressources: [],         // bibliothèques : { type: "css" | "js" | "module", url, cle?, tete? } (voir cdn.js)
    module: false,          // script.js chargé en type="module"
    extraTete: [],          // balises de <head> non reconnues, conservées telles quelles
    extraCorps: [],         // <script> non reconnus, conservés tels quels
    modifie: false,
    avertissement: "",      // problème de lecture de la liste, réaffiché après le chargement
  };

  const editeurs = {};      // html, css, js → EditorView

  // ---------- Réglages (localStorage) ----------

  function reglagesParDefaut() {
    // Sur github.io : https://<compte>.github.io/<répertoire>/studio/
    if (location.hostname.endsWith(".github.io")) {
      return {
        proprietaire: location.hostname.split(".")[0],
        repertoire: location.pathname.split("/").filter(Boolean)[0] || "",
        branche: "main",
        jeton: "",
      };
    }
    return { proprietaire: "tim-montmorency", repertoire: "Fragment", branche: "main", jeton: "" };
  }

  function lireReglages() {
    try {
      return { ...reglagesParDefaut(), ...JSON.parse(localStorage.getItem(CLE_REGLAGES) || "{}") };
    } catch (e) {
      return reglagesParDefaut();
    }
  }

  function ecrireReglages(r) {
    try { localStorage.setItem(CLE_REGLAGES, JSON.stringify(r)); } catch (e) { /* stockage indisponible */ }
  }

  let reglages = lireReglages();
  const github = () => GitHub.client(reglages);

  // ---------- Utilitaires ----------

  function statut(texte, type = "") {
    const s = $("statut");
    s.textContent = texte;
    s.className = `statut ${type}`;
  }

  function desindenter(texte) {
    const lignes = texte.replace(/\t/g, "  ").split("\n");
    while (lignes.length && !lignes[0].trim()) lignes.shift();
    while (lignes.length && !lignes[lignes.length - 1].trim()) lignes.pop();
    if (!lignes.length) return "";
    const retrait = Math.min(...lignes.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
    return lignes.map((l) => l.slice(retrait)).join("\n");
  }

  const indenter = (texte, n = 2) =>
    texte.split("\n").map((l) => (l.trim() ? " ".repeat(n) + l : "")).join("\n");

  const echapper = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const lireEditeur = (cle) => editeurs[cle].state.doc.toString();

  function remplacerEditeur(cle, texte) {
    const v = editeurs[cle];
    v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: texte } });
  }

  // ---------- Lecture d'un index.html existant ----------

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

  /** Vrai si l'élément n'a que des attributs de la liste (sinon il est conservé tel quel). */
  const attributsSimples = (el, permis) => [...el.attributes].every((a) => permis.includes(a.name));

  function analyserIndex(html) {
    const resultat = {
      titre: "", corps: "", ressources: [], module: false, extraTete: [], extraCorps: [],
      attrsHtml: "", attrsBody: "",
    };

    // Attributs des balises <html> et <body> (lang="fr" est ajouté automatiquement)
    const ouvertureHtml = html.match(/<html\b([^>]*)>/i);
    if (ouvertureHtml) {
      resultat.attrsHtml = ouvertureHtml[1].replace(/\s*\blang=(["'])fr\1/i, "").trim();
    }
    const ouvertureBody = trouverCorps(html)?.ouverture.match(/<body\b([^>]*)>/i);
    if (ouvertureBody) resultat.attrsBody = ouvertureBody[1].trim();

    const titre = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    resultat.titre = titre ? titre[1].trim() : "";

    // <head> : feuilles de style, scripts et importmap deviennent des ressources ;
    // le reste (hors éléments générés par le studio) est conservé tel quel.
    const doc = new DOMParser().parseFromString(html, "text/html");
    const tete = [];
    const modules = [];
    [...doc.head.children].forEach((el) => {
      if (el.matches('meta[charset], meta[name="viewport"], title, link[href$="style.css"]')) return;
      if (el.matches('link[rel="stylesheet"][href]') && attributsSimples(el, ["rel", "href"])) {
        tete.push({ type: "css", url: el.getAttribute("href") });
      } else if (el.matches("script[src]") && attributsSimples(el, ["src"])) {
        tete.push({ type: "js", url: el.getAttribute("src"), tete: true });
      } else if (el.matches('script[type="importmap"]')) {
        try {
          Object.entries(JSON.parse(el.textContent).imports || {}).forEach(([cle, url]) =>
            modules.push({ type: "module", cle, url }));
        } catch (e) {
          resultat.extraTete.push(el.outerHTML);
        }
      } else {
        resultat.extraTete.push(el.outerHTML);
      }
    });

    // <body> : contenu tel quel (formatage conservé), sans les <script src>
    const corps = trouverCorps(html);
    let contenu = corps ? corps.contenu : "";
    contenu = contenu.replace(/^[ \t]*<!--\s*Code injected by live-server\s*-->[\s\S]*?<\/script>[ \t]*\r?\n?/im, "");
    const scriptsCorps = [];
    contenu = contenu.replace(/^[ \t]*(<script\b[^>]*\bsrc=[^>]*>\s*<\/script>)[ \t]*\r?\n?/gim, (m, balise) => {
      const el = new DOMParser().parseFromString(balise, "text/html").querySelector("script");
      const src = el?.getAttribute("src") || "";
      if (/^(\.\/)?script\.js$/i.test(src)) {
        if (el.getAttribute("type") === "module") resultat.module = true;
      } else if (el && attributsSimples(el, ["src"])) {
        scriptsCorps.push({ type: "js", url: src });
      } else {
        resultat.extraCorps.push(balise.trim());
      }
      return "";
    });
    resultat.corps = desindenter(contenu);
    resultat.ressources = [...tete, ...modules, ...scriptsCorps];
    return resultat;
  }

  // ---------- Génération des fichiers ----------

  /** Bouton Réglages : compteur de bibliothèques, infobulle récapitulative, pastille si attributs html/body. */
  function indiquerReglages() {
    const html = nettoyerAttributs($("attrs-html").value);
    const body = nettoyerAttributs($("attrs-body").value);
    const biblios = etat.ressources.filter((r) => r.url);
    const b = $("btn-exemple");
    const compteur = $("compteur");
    compteur.hidden = !biblios.length;
    compteur.textContent = biblios.length;
    b.classList.toggle("defini", Boolean(html || body) && !biblios.length);
    const lignes = ["Réglages du fragment"];
    if (biblios.length) lignes.push(biblios.map((r) => (r.type === "module" ? r.cle : CDN.libelle(r))).join("\n"));
    if (html) lignes.push(`<html ${html}>`);
    if (body) lignes.push(`<body ${body}>`);
    b.dataset.infobulle = lignes.join("\n");
    b.removeAttribute("title");
    b.setAttribute("aria-label", "Réglages du fragment");
  }

  /** Attributs saisis à la main : sans « < » ni « > », espaces superflus retirés. */
  const nettoyerAttributs = (texte) => texte.replace(/[<>]/g, "").replace(/\s+/g, " ").trim();

  function importmap(modules) {
    const imports = Object.fromEntries(modules.map((r) => [r.cle.trim(), r.url.trim()]));
    const json = JSON.stringify({ imports }, null, 2).split("\n").map((l) => "    " + l).join("\n");
    return `<script type="importmap">\n${json}\n  </script>`;
  }

  function genererIndex() {
    const titre = $("titre").value.trim() || "Fragment";
    // Sources incomplètes (adresse vide, module sans clé) ignorées ; adresses échappées pour l'attribut
    const r = etat.ressources.filter((x) => x.url.trim() && (x.type !== "module" || x.cle.trim()));
    const adresse = (x) => x.url.trim().replace(/&/g, "&amp;").replace(/"/g, "&quot;");
    const modules = r.filter((x) => x.type === "module");

    const tete = [
      ...r.filter((x) => x.type === "css").map((x) => `<link rel="stylesheet" href="${adresse(x)}">`),
      ...r.filter((x) => x.type === "js" && x.tete).map((x) => `<script src="${adresse(x)}"></script>`),
      ...(modules.length ? [importmap(modules)] : []),
      ...etat.extraTete,
    ];
    const corps = [
      ...r.filter((x) => x.type === "js" && !x.tete).map((x) => `<script src="${adresse(x)}"></script>`),
      ...etat.extraCorps,
    ];

    const module = etat.module || modules.length > 0;
    corps.push(`<script${module ? ' type="module"' : ""} src="script.js"></script>`);

    const lignesTete = [
      '<meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1">',
      `<title>${echapper(titre)}</title>`,
      ...tete,
      '<link rel="stylesheet" href="style.css">',
    ];

    const attrsHtml = nettoyerAttributs($("attrs-html").value);
    const attrsBody = nettoyerAttributs($("attrs-body").value);
    const lang = /(^|\s)lang=/i.test(attrsHtml) ? "" : ' lang="fr"';

    return `<!doctype html>
<html${lang}${attrsHtml ? " " + attrsHtml : ""}>
<head>
${lignesTete.map((l) => "  " + l).join("\n")}
</head>
<body${attrsBody ? " " + attrsBody : ""}>
${indenter(lireEditeur("html"))}

${corps.map((l) => "  " + l).join("\n")}
</body>
</html>
`;
  }

  const finLigne = (t) => (t.endsWith("\n") ? t : t + "\n");

  function genererFichiers() {
    return {
      "index.html": genererIndex(),
      "style.css": finLigne(lireEditeur("css")),
      "script.js": finLigne(lireEditeur("js")),
    };
  }

  /** Page complète avec CSS et JS en ligne, pour l'aperçu. */
  /**
   * Petit script injecté en tête de l'aperçu : renvoie au studio les erreurs JavaScript,
   * les promesses rejetées, les console.error et les fichiers introuvables.
   */
  function capteurErreurs(generation) {
    return `<script>(function () {
    var g = ${generation};
    function envoyer(d) { try { d.fragment = "console"; d.generation = g; parent.postMessage(d, "*"); } catch (x) {} }
    function texte(a) { try { return typeof a === "string" ? a : (a && a.message) || JSON.stringify(a); } catch (x) { return String(a); } }
    window.addEventListener("error", function (e) {
      var t = e.target;
      if (t && t !== window && (t.src || t.href)) { envoyer({ type: "ressource", message: "Fichier introuvable : " + (t.src || t.href) }); return; }
      envoyer({ type: "erreur", message: e.message, ligne: e.lineno, colonne: e.colno, fichier: e.filename });
    }, true);
    window.addEventListener("unhandledrejection", function (e) { envoyer({ type: "erreur", message: "Promesse rejetée : " + texte(e.reason) }); });
    var ce = console.error;
    console.error = function () { envoyer({ type: "console", message: [].map.call(arguments, texte).join(" ") }); return ce.apply(console, arguments); };
  })();<\/script>`;
  }

  function genererApercu(generation = 0) {
    const f = genererFichiers();
    const chemin = `f/${nomCourant()}`;
    let doc = f["index.html"]
      .replace(/<link rel="stylesheet" href="style\.css">/, () => `<style>\n${f["style.css"]}</style>`)
      .replace(/<script( type="module")? src="script\.js"><\/script>/, (m, type) =>
        `<script data-fragment-js${type || ""}>\n${f["script.js"].replace(/<\/script/gi, "<\\/script")}</script>`);
    // Capteur d'erreurs en premier ; chemins relatifs (images, etc.) résolus dans le dossier du fragment
    doc = doc.replace("<head>", () =>
      `<head>\n  ${capteurErreurs(generation)}\n  <base href="${new URL(chemin + "/", SITE).href}">`);

    // Lignes occupées par script.js dans la page générée (pour traduire les numéros de ligne)
    const i = doc.indexOf("<script data-fragment-js");
    if (i >= 0) {
      const debut = doc.slice(0, i).split("\n").length + 1;
      etat.lignesJs = { debut, fin: debut + f["script.js"].split("\n").length - 2 };
    } else {
      etat.lignesJs = null;
    }
    return doc;
  }

  // ---------- Erreurs de l'aperçu ----------

  let generation = 0;     // numéro de l'aperçu courant (ignore les messages des anciens)
  let erreurs = [];

  /** Recharge l'aperçu et remet la liste d'erreurs à zéro. */
  function rafraichirApercu() {
    generation++;
    erreurs = [];
    afficherErreurs();
    apercu.charger({ srcdoc: genererApercu(generation) });
  }

  function emplacement(e) {
    const js = etat.lignesJs;
    if (e.ligne && js && e.ligne >= js.debut && e.ligne <= js.fin) {
      return { texte: `script.js, ligne ${e.ligne - js.debut + 1}`, ligneJs: e.ligne - js.debut + 1 };
    }
    if (e.fichier && /^https?:/.test(e.fichier) && !e.fichier.startsWith(SITE.href)) {
      return { texte: `${e.fichier.split("/").pop() || e.fichier}${e.ligne ? `, ligne ${e.ligne}` : ""}` };
    }
    return e.ligne ? { texte: "index.html" } : null;
  }

  function afficherErreurs() {
    const bouton = $("btn-erreurs");
    const n = erreurs.length;
    bouton.hidden = n === 0;
    bouton.innerHTML = `${UI.icone("triangle-alert", "icone-sm")}<span>${n} erreur${n > 1 ? "s" : ""}</span>`;
    if (!n) $("console").hidden = true;

    const liste = $("liste-erreurs");
    liste.innerHTML = "";
    erreurs.forEach((e) => {
      const li = document.createElement("li");
      li.className = `erreur-${e.type}`;
      const message = document.createElement("span");
      message.className = "message-erreur";
      message.textContent = e.message;
      li.append(message);
      const lieu = emplacement(e);
      if (lieu) {
        const lien = document.createElement(lieu.ligneJs ? "button" : "span");
        lien.className = "lieu-erreur";
        lien.textContent = lieu.texte;
        if (lieu.ligneJs) {
          lien.type = "button";
          lien.title = "Aller à cette ligne";
          lien.addEventListener("click", () => allerALaLigne(lieu.ligneJs));
        }
        li.append(lien);
      }
      liste.append(li);
    });
  }

  function allerALaLigne(n) {
    activerOnglet("js");
    const vue = editeurs.js;
    const ligne = vue.state.doc.line(Math.min(Math.max(n, 1), vue.state.doc.lines));
    vue.dispatch({ selection: { anchor: ligne.from, head: ligne.to }, scrollIntoView: true });
    vue.focus();
  }

  window.addEventListener("message", (e) => {
    const d = e.data;
    if (!d || d.fragment !== "console" || d.generation !== generation) return;
    if (erreurs.length >= 50) return;
    // Même erreur répétée (boucle d'animation, etc.) : une seule fois
    if (erreurs.some((x) => x.message === d.message && x.ligne === d.ligne)) return;
    erreurs.push(d);
    afficherErreurs();
  });

  // ---------- Aperçu en direct ----------

  let activerOnglet = () => {};
  let apercu;   // CadreDouble : nouvelle version chargée en arrière-plan, sans flash blanc
  let minuterie;
  function planifierApercu() {
    clearTimeout(minuterie);
    minuterie = setTimeout(rafraichirApercu, DELAI_APERCU);
  }

  function marquerModifie() {
    etat.modifie = true;
    planifierApercu();
  }

  // ---------- Interface : éditeurs et bibliothèques ----------

  function creerEditeurs() {
    const onglets = $("onglets");
    const panneaux = $("editeurs");
    const cles = [["html", "HTML", CM.html], ["css", "CSS", CM.css], ["js", "JS", CM.javascript]];

    const activer = (cible) => {
      cles.forEach(([cle]) => {
        $(`onglet-${cle}`).classList.toggle("actif", cle === cible);
        $(`onglet-${cle}`).setAttribute("aria-selected", cle === cible);
        $(`panneau-${cle}`).hidden = cle !== cible;
      });
      editeurs[cible].requestMeasure();
    };
    activerOnglet = activer;

    cles.forEach(([cle, libelle, langage]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "onglet";
      b.id = `onglet-${cle}`;
      b.setAttribute("role", "tab");
      b.textContent = libelle;
      b.addEventListener("click", () => activer(cle));
      onglets.append(b);

      const p = document.createElement("div");
      p.className = "panneau";
      p.id = `panneau-${cle}`;
      panneaux.append(p);

      editeurs[cle] = new CM.EditorView({
        doc: "",
        parent: p,
        extensions: [
          CM.configuration({ numeros: true }),
          langage(),
          CM.oneDark,
          CM.EditorView.updateListener.of((maj) => { if (maj.docChanged) marquerModifie(); }),
        ],
      });
    });

    activer("html");
  }

  let rechercheCdn;

  function creerBibliotheques() {
    rechercheCdn = CDN.monter($("recherche-cdn"), {
      statut,
      ajouter(liste) {
        liste.forEach((nouvelle) => {
          // Pas de doublon : même adresse, ou même clé d'importmap
          const doublon = etat.ressources.some((x) =>
            x.url === nouvelle.url || (nouvelle.type === "module" && x.type === "module" && x.cle === nouvelle.cle));
          if (!doublon) etat.ressources.push(nouvelle);
        });
        afficherBibliotheques();
        marquerModifie();
      },
    });
  }

  // ---------- Bibliothèques (fenêtre Réglages) : édition de etat.ressources ----------

  const TYPES = { css: "CSS", js: "JS", module: "ES" };

  const TYPES_SOURCE = [
    ["css", "CSS"],
    ["js", "JS"],
    ["js-tete", "JS (head)"],
    ["module", "Module ES"],
  ];

  const typeSource = (r) => (r.type === "js" && r.tete ? "js-tete" : r.type);

  function appliquerType(r, valeur) {
    r.type = valeur === "js-tete" ? "js" : valeur;
    if (valeur === "js-tete") r.tete = true;
    else delete r.tete;
    if (r.type === "module" && !r.cle) r.cle = CDN.ressourceDepuisUrl(r.url || "x.js").cle || "";
  }

  // Lignes dépliées (conservées quand la liste est redessinée)
  const deplies = new WeakSet();

  /** Résumé d'une ligne : type, nom lisible, adresse. */
  function resumer(li, r) {
    li.className = `biblio biblio-${r.type}${deplies.has(r) ? " deplie" : ""}`;
    li.querySelector(".type").textContent = TYPES[r.type] + (r.tete ? " · head" : "");
    li.querySelector(".nom").textContent = !r.url ? "(adresse vide)" : r.type === "module" ? r.cle || "(clé d'import manquante)" : CDN.libelle(r);
    li.querySelector(".adresse").textContent = r.url;
  }

  function afficherBibliotheques() {
    const liste = $("liste-biblios");
    liste.innerHTML = "";
    if (!etat.ressources.length) {
      const vide = document.createElement("li");
      vide.className = "biblio-vide";
      vide.innerHTML = `${UI.icone("package", "icone-lg")}<span>Aucune bibliothèque</span>`;
      liste.append(vide);
    }

    etat.ressources.forEach((r, i) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <div class="biblio-ligne">
          <span class="poignee" title="Glisser pour changer l'ordre">${UI.icone("grip-vertical")}</span>
          <span class="type"></span>
          <button type="button" class="biblio-resume" aria-expanded="false">
            <span class="nom"></span><span class="adresse"></span>
          </button>
          <span class="biblio-outils">
            <button type="button" class="btn btn-ghost btn-sm btn-icon biblio-modifier" title="Modifier">${UI.icone("chevron-down")}</button>
            <button type="button" class="btn btn-ghost btn-sm btn-icon biblio-retirer" title="Retirer">${UI.icone("x")}</button>
          </span>
        </div>
        <div class="biblio-details">
          <label class="champ-dialogue champ-type"><span class="label">Type</span>
            <select class="select source-type">
              ${TYPES_SOURCE.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}
            </select>
          </label>
          <label class="champ-dialogue champ-url"><span class="label">Adresse</span>
            <input class="input source-url mono" placeholder="https://…" spellcheck="false" autocomplete="off">
          </label>
          <label class="champ-dialogue champ-cle"><span class="label">Clé d'import</span>
            <input class="input source-cle mono" placeholder="ex. three" spellcheck="false" autocomplete="off">
          </label>
        </div>`;
      resumer(li, r);

      const resume = li.querySelector(".biblio-resume");
      const details = li.querySelector(".biblio-details");
      const type = li.querySelector(".source-type");
      const url = li.querySelector(".source-url");
      const cle = li.querySelector(".source-cle");
      const champCle = li.querySelector(".champ-cle");
      resume.title = r.type === "module" ? `import … from "${r.cle}"\n${r.url}` : r.url;
      type.value = typeSource(r);
      url.value = r.url;
      cle.value = r.cle || "";
      champCle.hidden = r.type !== "module";
      details.hidden = !deplies.has(r);
      resume.setAttribute("aria-expanded", String(deplies.has(r)));

      // Déplier / replier
      const basculer = () => {
        if (deplies.has(r)) deplies.delete(r); else deplies.add(r);
        details.hidden = !deplies.has(r);
        resume.setAttribute("aria-expanded", String(deplies.has(r)));
        li.classList.toggle("deplie", deplies.has(r));
        if (deplies.has(r)) url.focus();
      };
      resume.addEventListener("click", basculer);
      li.querySelector(".biblio-modifier").addEventListener("click", basculer);

      // « + » : autre fichier du même paquet (ex. themes.css de daisyui)
      const paquet = CDN.paquetDepuisUrl(r.url);
      if (paquet && !r.url.endsWith("/")) {
        const plus = document.createElement("button");
        plus.type = "button";
        plus.className = "btn btn-ghost btn-sm btn-icon biblio-ajouter";
        plus.innerHTML = UI.icone("plus");
        plus.title = `Ajouter un autre fichier de ${paquet.nom}@${paquet.version}`;
        plus.addEventListener("click", () => {
          rechercheCdn.fichiers(paquet.nom, paquet.version);
          $("recherche-cdn").scrollIntoView({ block: "nearest" });
        });
        li.querySelector(".biblio-outils").prepend(plus);
      }

      li.querySelector(".biblio-retirer").addEventListener("click", () => {
        etat.ressources.splice(i, 1);
        afficherBibliotheques();
        marquerModifie();
      });

      // Modifications : résumé et aperçu à jour, sans redessiner la liste (garde le focus)
      type.addEventListener("change", () => {
        delete r.auto; // type choisi à la main : plus de détection automatique
        appliquerType(r, type.value);
        champCle.hidden = r.type !== "module";
        cle.value = r.cle || "";
        resumer(li, r);
        sourceModifiee();
      });
      url.addEventListener("input", () => {
        r.url = url.value.trim();
        if (r.auto && r.url) {
          const devine = CDN.ressourceDepuisUrl(r.url);
          appliquerType(r, devine.type);
          if (devine.type === "module") r.cle = devine.cle;
          type.value = typeSource(r);
          champCle.hidden = r.type !== "module";
          cle.value = r.cle || "";
        }
        resumer(li, r);
        sourceModifiee();
      });
      cle.addEventListener("input", () => {
        r.cle = cle.value.trim();
        resumer(li, r);
        sourceModifiee();
      });

      // Glisser-déposer par la poignée seulement (les champs restent sélectionnables)
      const poignee = li.querySelector(".poignee");
      poignee.addEventListener("pointerdown", () => { li.draggable = true; });
      li.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", String(i));
        e.dataTransfer.effectAllowed = "move";
        li.classList.add("glisse");
      });
      li.addEventListener("dragend", () => { li.draggable = false; li.classList.remove("glisse"); });
      li.addEventListener("dragover", (e) => { e.preventDefault(); li.classList.add("cible"); });
      li.addEventListener("dragleave", () => li.classList.remove("cible"));
      li.addEventListener("drop", (e) => {
        e.preventDefault();
        const de = parseInt(e.dataTransfer.getData("text/plain"), 10);
        if (Number.isNaN(de) || de === i) return afficherBibliotheques();
        const [deplacee] = etat.ressources.splice(de, 1);
        etat.ressources.splice(i, 0, deplacee);
        afficherBibliotheques();
        marquerModifie();
      });

      liste.append(li);
    });

    const n = etat.extraTete.length + etat.extraCorps.length;
    $("extra").hidden = !n;
    $("extra").textContent = n
      ? `${n} autre${n > 1 ? "s" : ""} balise${n > 1 ? "s" : ""} de l'index.html conservée${n > 1 ? "s" : ""} telle${n > 1 ? "s" : ""} quelle${n > 1 ? "s" : ""}.`
      : "";
    $("extra").title = [...etat.extraTete, ...etat.extraCorps].join("\n");
    indiquerReglages();
  }

  function sourceModifiee() {
    indiquerReglages();
    marquerModifie();
  }

  // ---------- Fenêtre Réglages : onglets ----------

  function choisirOngletReglages(id) {
    document.querySelectorAll('#config-exemple [role="tab"]').forEach((t) => {
      const actif = t.id === `t-${id}`;
      t.setAttribute("aria-selected", String(actif));
      t.tabIndex = actif ? 0 : -1;
      $(t.getAttribute("aria-controls")).hidden = !actif;
    });
  }

  function brancherOngletsReglages() {
    const onglets = [...document.querySelectorAll('#config-exemple [role="tab"]')];
    onglets.forEach((t, i) => {
      t.addEventListener("click", () => choisirOngletReglages(t.id.slice(2)));
      t.addEventListener("keydown", (e) => {
        const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (!d) return;
        e.preventDefault();
        const suivant = onglets[(i + d + onglets.length) % onglets.length];
        choisirOngletReglages(suivant.id.slice(2));
        suivant.focus();
      });
    });
  }

  function ouvrirReglagesFragment(onglet = "bibliotheques") {
    afficherBibliotheques();
    choisirOngletReglages(onglet);
    $("config-exemple").showModal();
    $(`t-${onglet}`).focus();
  }

  // ---------- Fenêtre de confirmation ----------

  /**
   * Fenêtre de confirmation au style du studio.
   * Résout avec true (ou la valeur du champ, si « champ » est fourni), ou null si annulé.
   */
  function confirmer({ titre, message, bouton, danger = false, champ = null }) {
    const d = $("confirmation");
    $("confirmation-titre").textContent = titre;
    $("confirmation-message").textContent = message;
    $("confirmation-champ").hidden = !champ;
    if (champ) {
      $("confirmation-libelle").textContent = champ.libelle;
      $("confirmation-valeur").value = champ.valeur || "";
    }
    const ok = $("confirmation-ok");
    ok.textContent = bouton;
    ok.className = `btn btn-sm${danger ? " btn-destructive" : ""}`;
    d.returnValue = "";
    d.showModal();
    if (champ) $("confirmation-valeur").select();
    else ok.focus();
    return new Promise((resoudre) => {
      d.addEventListener("close", () => {
        if (d.returnValue !== "ok") return resoudre(null);
        resoudre(champ ? $("confirmation-valeur").value.trim() : true);
      }, { once: true });
    });
  }

  // ---------- Liste des fragments (index central fragments.json) ----------

  /** Texte d'un fichier du répertoire : API GitHub d'abord (à jour), puis le site publié. */
  async function lireTexte(chemin) {
    try {
      const texte = await github().lire(chemin);
      if (texte !== null) return texte;
    } catch (e) { /* API indisponible : on essaie le site */ }
    try {
      const r = await fetch(new URL(chemin, SITE), { cache: "no-store" });
      return r.ok ? await r.text() : null;
    } catch (e) {
      return null;
    }
  }

  const lireJson = async (chemin) => {
    const texte = await lireTexte(chemin);
    if (texte === null) return null;
    try { return JSON.parse(texte); } catch (e) { return null; }
  };

  /** Liste des fragments à partir de l'arbre du répertoire (dossiers f/<nom>/index.html). */
  async function nomsDepuisArbre() {
    const chemins = await github().fichiers();
    const noms = chemins
      .map((c) => c.match(/^f\/([^/]+)\/index\.html$/)?.[1])
      .filter(Boolean)
      .sort();
    noms.jetonRefuse = chemins.jetonRefuse;
    return noms;
  }

  /** Adresse de la page : studio/?ex=<nom> pour un fragment enregistré (rechargement, partage). */
  function majAdresse() {
    const url = new URL(location.href);
    if (etat.ex) url.searchParams.set("ex", etat.ex);
    else url.searchParams.delete("ex");
    history.replaceState(null, "", url);

    // Dupliquer / Voir / Intégrer (pied de page) et Supprimer (Réglages) : fragment enregistré seulement
    $("pied-liens").hidden = !etat.ex;
    $("actions-fragment").hidden = !etat.ex;
    if (etat.ex) $("lien-voir").href = `${new URL("v/", SITE).href}?ex=${etat.ex}`;
  }

  function afficherListe() {
    const tags = [...new Set(etat.fragments.flatMap((f) => f.tags || []))].sort();
    $("tags").placeholder = tags.length ? `ex. ${tags.slice(0, 3).join(", ")}` : "ex. web3, gsap";
    $("tags").title = tags.length ? `Tags existants : ${tags.join(", ")}` : "";
  }

  async function chargerListe() {
    etat.avertissement = "";
    const index = await lireJson("fragments.json");
    if (index && Array.isArray(index.fragments)) {
      etat.fragments = index.fragments;
    } else {
      // Pas d'index : on se rabat sur l'arbre du répertoire
      try {
        const noms = await nomsDepuisArbre();
        etat.fragments = noms.map((nom) => ({ nom, titre: nom, tags: [] }));
        etat.avertissement = noms.jetonRefuse
          ? "Le jeton GitHub enregistré est refusé (invalide, expiré ou sans accès) : vérifier les réglages GitHub."
          : "Index fragments.json introuvable : la liste vient du répertoire. « Reconstruire l'index » (⚙ → Connexion GitHub) le recrée.";
      } catch (e) {
        etat.fragments = [];
        const raison =
          e.limite || e.status === 429 ? "limite de requêtes GitHub atteinte pour ce réseau ; un jeton valide la lève" :
          e.status === 404 ? `répertoire ${reglages.proprietaire}/${reglages.repertoire} ou branche « ${reglages.branche} » introuvable` :
          e.status ? `erreur ${e.status} : ${e.message}` :
          "GitHub injoignable";
        etat.avertissement = `Liste des fragments indisponible (${raison}). La création reste possible.`;
      }
    }
    if (etat.avertissement) statut(etat.avertissement, "erreur");
    afficherListe();
  }

  // ---------- Ouvrir / nouveau ----------

  const aujourdhui = () => new Date().toLocaleDateString("sv"); // AAAA-MM-JJ

  /** « GSAP - to() » → « gsap-to » ; « Dégradé linéaire » → « degrade-lineaire » */
  function slug(texte) {
    const s = texte
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50)
      .replace(/-+$/, "");
    return s || "fragment";
  }

  /** Premier nom libre : « gsap-to », sinon « gsap-to-2 », « gsap-to-3 »… */
  function nomDisponible(base, liste = etat.fragments) {
    const pris = new Set(liste.map((f) => f.nom));
    if (!pris.has(base)) return base;
    let n = 2;
    while (pris.has(`${base}-${n}`)) n++;
    return `${base}-${n}`;
  }

  /** Nom du fragment : fixe une fois créé, sinon généré à partir du titre. */
  const nomCourant = () => etat.ex || nomDisponible(slug($("titre").value));

  /** « Web3, GSAP ,, web3 » → ["web3", "gsap"] */
  const lireTags = (texte) =>
    [...new Set(texte.split(",").map((t) => t.trim().toLowerCase().replace(/\s+/g, "-")).filter(Boolean))];

  function remplir({ ex, titre, tags, html, css, js, analyse, meta }) {
    etat.ex = ex;
    etat.meta = meta || {};
    etat.ressources = analyse ? analyse.ressources : [];
    etat.module = analyse ? analyse.module : false;
    etat.extraTete = analyse ? analyse.extraTete : [];
    etat.extraCorps = analyse ? analyse.extraCorps : [];
    $("titre").value = titre;
    $("tags").value = (tags || []).join(", ");
    $("attrs-html").value = analyse?.attrsHtml || "";
    $("attrs-body").value = analyse?.attrsBody || "";
    indiquerReglages();
    remplacerEditeur("html", html);
    remplacerEditeur("css", css);
    remplacerEditeur("js", js);
    afficherBibliotheques();
    majAdresse();
    etat.modifie = false;
    clearTimeout(minuterie);
    rafraichirApercu();
  }

  async function nouvelExemple() {
    const [html, css, js] = await Promise.all(
      ["index.html", "style.css", "script.js"].map((f) => lireTexte(`_gabarit/${f}`))
    );
    const analyse = html ? analyserIndex(html) : null;
    remplir({
      ex: null,
      titre: "",
      tags: [],
      html: analyse?.corps || DEFAUTS.html,
      css: (css ?? DEFAUTS.css).replace(/\s+$/, ""),
      js: (js ?? DEFAUTS.js).replace(/\s+$/, ""),
      analyse,
    });
    statut("Nouveau fragment.");
  }

  async function ouvrirExemple(nom) {
    statut("Ouverture…");
    const [html, css, js, meta] = await Promise.all([
      lireTexte(`f/${nom}/index.html`),
      lireTexte(`f/${nom}/style.css`),
      lireTexte(`f/${nom}/script.js`),
      lireJson(`f/${nom}/fragment.json`),
    ]);
    if (html === null) return statut("Impossible d'ouvrir ce fragment.", "erreur");
    const analyse = analyserIndex(html);
    remplir({
      ex: nom,
      titre: meta?.titre || analyse.titre,
      tags: meta?.tags || [],
      html: analyse.corps,
      css: (css || "").replace(/\s+$/, ""),
      js: (js || "").replace(/\s+$/, ""),
      analyse,
      meta,
    });
    statut(`« ${meta?.titre || analyse.titre || nom} » ouvert.`);
  }

  // ---------- Enregistrement ----------

  const MESSAGES_ERREUR = {
    401: "jeton invalide ou expiré",
    403: "le jeton n'a pas la permission d'écrire dans ce répertoire",
    404: "répertoire ou branche introuvable (ou jeton sans accès)",
    409: "conflit avec un autre enregistrement, réessayer",
    422: "conflit avec un autre enregistrement, réessayer",
  };

  const json = (objet) => JSON.stringify(objet, null, 2) + "\n";

  /** Index trié : les plus récents d'abord, puis par nom. */
  const trierIndex = (liste) =>
    [...liste].sort((a, b) => (b.modifie || "").localeCompare(a.modifie || "") || a.nom.localeCompare(b.nom));

  async function enregistrer() {
    if (!$("titre").value.trim()) {
      $("titre").focus();
      return statut("Un titre est nécessaire pour enregistrer.", "erreur");
    }
    if (!reglages.jeton) {
      statut("Un jeton GitHub est nécessaire pour enregistrer.", "erreur");
      return ouvrirReglages();
    }

    const titre = $("titre").value.trim();
    const tags = lireTags($("tags").value);
    const date = aujourdhui();

    const bouton = $("btn-enregistrer");
    bouton.disabled = true;
    bouton.querySelector("use").setAttribute("href", "../commun/icones.svg#loader-circle");
    bouton.querySelector(".icone").classList.add("tourne");
    statut("Enregistrement…");
    try {
      // Index à jour, lu juste avant l'écriture
      const index = await lireJson("fragments.json");
      const actuels = index && Array.isArray(index.fragments) ? index.fragments : etat.fragments;

      // Fragment existant : nom fixe. Nouveau : tiré du titre, incrémenté s'il est déjà pris.
      const existe = Boolean(etat.ex);
      const nom = etat.ex || nomDisponible(slug(titre), actuels);
      const meta = {
        titre,
        tags,
        cree: (existe && etat.meta?.cree) || date,
        modifie: date,
      };

      const liste = actuels.filter((f) => f.nom !== nom);
      liste.push({ nom, titre, tags, modifie: date });

      const fichiers = {};
      Object.entries(genererFichiers()).forEach(([f, contenu]) => { fichiers[`f/${nom}/${f}`] = contenu; });
      fichiers[`f/${nom}/fragment.json`] = json(meta);
      fichiers["fragments.json"] = json({ fragments: trierIndex(liste) });

      let message = existe ? `Studio : mise à jour de ${nom}` : `Studio : ajout de ${nom}`;
      if (etat.copieDe) message += ` (copie de ${etat.copieDe})`;

      await github().enregistrer(fichiers, message);

      etat.fragments = trierIndex(liste);
      etat.ex = nom;
      etat.copieDe = null;
      etat.meta = meta;
      etat.modifie = false;
      majAdresse();
      afficherListe();
      suivrePublication(nom, titre, fichiers);
    } catch (e) {
      statut(`Échec de l'enregistrement : ${MESSAGES_ERREUR[e.status] || e.message}.`, "erreur");
    } finally {
      bouton.disabled = false;
      bouton.querySelector("use").setAttribute("href", "../commun/icones.svg#save");
      bouton.querySelector(".icone").classList.remove("tourne");
    }
  }

  /** Recrée fragments.json à partir des dossiers f/<nom>/ (utile après des ajouts faits à la main). */
  async function reconstruireIndex() {
    if (!reglages.jeton) return statut("Un jeton GitHub est nécessaire pour reconstruire l'index.", "erreur");
    statut("Reconstruction de l'index…");
    try {
      const noms = await nomsDepuisArbre();
      const liste = await Promise.all(noms.map(async (nom) => {
        const meta = await lireJson(`f/${nom}/fragment.json`);
        if (meta) return { nom, titre: meta.titre || nom, tags: meta.tags || [], modifie: meta.modifie || "" };
        // Sans fragment.json : titre tiré de <title>
        const html = await lireTexte(`f/${nom}/index.html`);
        const titre = html?.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1].trim();
        return { nom, titre: titre || nom, tags: [], modifie: "" };
      }));
      await github().enregistrer({ "fragments.json": json({ fragments: trierIndex(liste) }) }, "Studio : reconstruction de l'index");
      etat.fragments = trierIndex(liste);
      afficherListe();
      statut(`Index reconstruit : ${liste.length} fragment${liste.length > 1 ? "s" : ""}.`, "succes");
    } catch (e) {
      statut(`Échec de la reconstruction : ${MESSAGES_ERREUR[e.status] || e.message}.`, "erreur");
    }
  }

  /** Retire le fragment du site : un commit supprime f/<nom>/ et son entrée de fragments.json. */
  async function supprimer() {
    if (!etat.ex) return;
    const titre = $("titre").value.trim() || etat.ex;
    const ok = await confirmer({
      titre: `Supprimer « ${titre} » ?`,
      message: "Le fragment sera retiré du site, et les iframes qui l'intègrent afficheront « Fragment introuvable ». " +
        "Il restera récupérable dans l'historique Git.",
      bouton: "Supprimer",
      danger: true,
    });
    if (!ok) return;
    if (!reglages.jeton) {
      $("config-exemple").close();
      statut("Un jeton GitHub est nécessaire pour supprimer.", "erreur");
      return ouvrirReglages();
    }

    const nom = etat.ex;
    const bouton = $("btn-supprimer");
    bouton.disabled = true;
    statut("Suppression…");
    try {
      const chemins = (await github().fichiers()).filter((c) => c.startsWith(`f/${nom}/`));
      const index = await lireJson("fragments.json");
      const actuels = index && Array.isArray(index.fragments) ? index.fragments : etat.fragments;

      const fichiers = {};
      chemins.forEach((c) => { fichiers[c] = null; }); // null = suppression
      fichiers["fragments.json"] = json({ fragments: trierIndex(actuels.filter((f) => f.nom !== nom)) });

      await github().enregistrer(fichiers, `Studio : suppression de ${nom}`);

      etat.modifie = false;
      location.href = `${SITE.href}?supprime=${encodeURIComponent(nom)}`;
    } catch (e) {
      bouton.disabled = false;
      statut(`Échec de la suppression : ${MESSAGES_ERREUR[e.status] || e.message}.`, "erreur");
    }
  }

  /** Le fragment ouvert devient un nouveau fragment (nouveau dossier à l'enregistrement), après confirmation. */
  async function dupliquer() {
    if (!etat.ex) return statut("Ce fragment n'est pas encore enregistré : rien à dupliquer.");
    const actuel = $("titre").value.trim() || etat.ex;
    const titre = await confirmer({
      titre: `Dupliquer « ${actuel} » ?`,
      message: "Le code et les réglages sont copiés dans un nouveau fragment, créé au prochain enregistrement. " +
        "L'original reste inchangé.",
      bouton: "Dupliquer",
      champ: { libelle: "Titre de la copie", valeur: `${actuel} (copie)` },
    });
    if (titre === null) return;
    etat.copieDe = etat.ex;
    etat.ex = null;
    etat.meta = {};
    $("titre").value = titre || `${actuel} (copie)`;
    majAdresse();
    marquerModifie();
    statut("Copie : un nouveau fragment sera créé à l'enregistrement.");
  }

  function integrer() {
    if (!etat.ex) return statut("Enregistrer le fragment avant de l'intégrer.", "erreur");
    if (etat.modifie) statut("Attention : l'intégration montre la dernière version enregistrée.");
    const enAttente = publication && publication.nom === etat.ex && publication.enCours;
    Integrer.ouvrir(etat.ex, {
      racine: SITE.href,
      titre: $("titre").value.trim(),
      publication: enAttente ? publication.promesse : null,
    });
  }

  // ---------- Suivi de la publication (GitHub Pages) ----------

  let publication = null; // { nom, promesse, enCours }

  const heureCourte = () => new Date().toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" });

  // En local (Go Live, serveur de test), le site ne reflète pas GitHub : rien à suivre.
  const siteLocal = () => ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);

  /**
   * Après un enregistrement, GitHub Pages met environ une minute à republier le site.
   * On vérifie toutes les 5 s que les fichiers publiés sont identiques à ceux enregistrés.
   */
  function suivrePublication(nom, titre, fichiers) {
    if (siteLocal()) {
      publication = null;
      return statut(`« ${titre} » enregistré sur GitHub à ${heureCourte()}. Copie locale : faire un git pull pour le voir ici.`, "succes");
    }

    statut(`« ${titre} » enregistré à ${heureCourte()}. Publication en cours…`, "succes");
    const attendus = ["index.html", "style.css", "script.js"].map((f) => [f, fichiers[`f/${nom}/${f}`]]);
    const DELAI_MAX = 5 * 60 * 1000;
    const debut = Date.now();

    const suivi = { nom, enCours: true };
    suivi.promesse = new Promise((resoudre, rejeter) => {
      const verifier = async () => {
        if (publication !== suivi) return rejeter(new Error("remplacé"));
        try {
          const resultats = await Promise.all(attendus.map(async ([f, contenu]) => {
            // Paramètre unique : contourne le cache du CDN de GitHub Pages
            const r = await fetch(new URL(`f/${nom}/${f}?t=${Date.now()}`, SITE), { cache: "no-store" });
            return r.ok && (await r.text()) === contenu;
          }));
          if (resultats.every(Boolean)) return resoudre();
        } catch (e) { /* réseau : on réessaie */ }
        if (Date.now() - debut > DELAI_MAX) return rejeter(new Error("délai"));
        setTimeout(verifier, 5000);
      };
      setTimeout(verifier, 3000);
    });
    publication = suivi;

    suivi.promesse.then(
      () => {
        suivi.enCours = false;
        if (etat.ex === nom) statut(`« ${titre} » en ligne ✓ (${heureCourte()})`, "succes");
      },
      (e) => {
        suivi.enCours = false;
        if (e.message === "délai" && etat.ex === nom) {
          statut("La publication prend plus de temps que prévu : voir l'onglet Actions du répertoire GitHub.", "erreur");
        }
      }
    );
  }

  // ---------- Réglages ----------

  function ouvrirReglages() {
    const f = $("form-reglages");
    ["proprietaire", "repertoire", "branche", "jeton"].forEach((k) => { f.elements[k].value = reglages[k] || ""; });
    $("etat-jeton").textContent = reglages.jeton ? "Un jeton est enregistré dans ce navigateur." : "Aucun jeton enregistré.";
    $("reglages").showModal();
  }

  /** « Connexion GitHub ✓ » dans ⚙ quand un jeton est enregistré dans ce navigateur. */
  function indiquerJeton() {
    const b = $("btn-github");
    b.innerHTML = reglages.jeton
      ? `${UI.icone("circle-check")}<span>Connecté à GitHub</span>`
      : `${UI.icone("key-round")}<span>Connexion GitHub…</span>`;
    b.classList.toggle("connecte", Boolean(reglages.jeton));
    $("btn-github").title = reglages.jeton
      ? "Un jeton est enregistré dans ce navigateur"
      : "Jeton GitHub nécessaire pour enregistrer";
  }

  function sauverReglages() {
    const f = $("form-reglages");
    const anciens = { ...reglages };
    ["proprietaire", "repertoire", "branche", "jeton"].forEach((k) => { reglages[k] = f.elements[k].value.trim(); });
    ecrireReglages(reglages);
    indiquerJeton();
    const repoChange = ["proprietaire", "repertoire", "branche"].some((k) => anciens[k] !== reglages[k]);
    if (repoChange || anciens.jeton !== reglages.jeton) chargerListe();
  }

  async function testerJeton() {
    sauverReglages();
    const etatJeton = $("etat-jeton");
    etatJeton.textContent = "Vérification…";
    try {
      const depot = await github().depot();
      etatJeton.textContent = depot.permissions?.push
        ? `✓ Accès en écriture à ${depot.full_name}.`
        : `Lecture seulement sur ${depot.full_name} : le jeton ne permet pas d'enregistrer.`;
    } catch (e) {
      etatJeton.textContent = `✗ ${e.status === 401 ? "Jeton invalide ou expiré." : e.message}`;
    }
  }

  // ---------- Démarrage ----------

  function brancherEvenements() {
    ["titre", "tags", "attrs-html", "attrs-body"].forEach((id) => $(id).addEventListener("input", marquerModifie));
    $("btn-dupliquer").addEventListener("click", dupliquer);
    ["attrs-html", "attrs-body"].forEach((id) => $(id).addEventListener("input", indiquerReglages));
    $("btn-exemple").addEventListener("click", () => ouvrirReglagesFragment());
    brancherOngletsReglages();
    // Entrée dans un champ des fenêtres : ne pas les fermer (formulaires « dialog »)
    ["config-exemple", "confirmation"].forEach((id) => $(id).addEventListener("keydown", (e) => {
      if (e.key !== "Enter" || !e.target.matches("input, select")) return;
      e.preventDefault();
      if (e.target.id === "confirmation-valeur") $("confirmation").close("ok");
    }));
    // Échap dans la recherche de bibliothèques : ferme les résultats, pas la fenêtre
    $("config-exemple").addEventListener("cancel", (e) => {
      if (document.activeElement?.closest("#recherche-cdn") && !document.querySelector(".cdn-resultats").hidden) e.preventDefault();
    });

    $("btn-enregistrer").addEventListener("click", enregistrer);
    $("btn-erreurs").addEventListener("click", () => { $("console").hidden = !$("console").hidden; });
    $("btn-fermer-console").addEventListener("click", () => { $("console").hidden = true; });
    $("btn-rejouer").addEventListener("click", () => {
      clearTimeout(minuterie);
      rafraichirApercu();
    });
    $("btn-integrer").addEventListener("click", integrer);
    $("btn-reconstruire").addEventListener("click", () => { $("reglages").close(); reconstruireIndex(); });
    $("btn-github").addEventListener("click", () => { $("config-exemple").close(); ouvrirReglages(); });
    $("btn-supprimer").addEventListener("click", supprimer);
    $("form-reglages").addEventListener("change", sauverReglages);
    $("reglages").addEventListener("close", sauverReglages);
    $("btn-tester").addEventListener("click", testerJeton);
    $("btn-oublier").addEventListener("click", () => {
      $("form-reglages").elements.jeton.value = "";
      sauverReglages();
      $("etat-jeton").textContent = "Jeton effacé de ce navigateur.";
    });

    // Cmd/Ctrl + S
    document.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        enregistrer();
      }
    });

    window.addEventListener("beforeunload", (e) => {
      if (etat.modifie) e.preventDefault();
    });
  }

  async function demarrer() {
    if (!window.CM || typeof GitHub === "undefined" || typeof CadreDouble === "undefined" || typeof Integrer === "undefined") {
      document.body.innerHTML = '<p class="message">Le studio n\'a pas pu se charger.</p>';
      return;
    }
    apercu = CadreDouble.creer($("resultat"), { titre: "Aperçu du fragment" });
    creerEditeurs();
    creerBibliotheques();
    brancherEvenements();
    indiquerJeton();

    const demande = new URLSearchParams(location.search).get("ex");
    await chargerListe();
    if (demande && SLUG.test(demande)) await ouvrirExemple(demande);
    else await nouvelExemple();
    if (etat.avertissement) statut(etat.avertissement, "erreur");
    else if (!reglages.jeton) statut("Aucun jeton GitHub : l'aperçu fonctionne, mais l'enregistrement demandera un jeton (⚙ → Connexion GitHub).");
  }

  demarrer();
})();
