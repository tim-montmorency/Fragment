/**
 * Fragment — Studio
 * -----------------
 * Création et modification d'exemples, avec aperçu en direct.
 * L'enregistrement fait un commit dans le répertoire GitHub (voir github.js).
 *
 * Chaque exemple est généré dans la structure habituelle :
 *   <cours>/<nom>/index.html, style.css, script.js
 */
(() => {
  "use strict";

  // ---------- Constantes ----------

  const SITE = new URL("../", location.href);           // racine du site Fragment
  const RESERVES = ["v", "studio", "outils", "_gabarit", "node_modules"];
  const SLUG = /^[a-z0-9_-]+$/i;
  const DELAI_APERCU = 400;
  const CLE_REGLAGES = "fragment.studio.reglages";

  const IMPORTMAP_THREE = `<script type="importmap">
    {
      "imports": {
        "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
        "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"
      }
    }
  </script>`;

  /** Bibliothèques proposées. « detecter » sert à les reconnaître dans un exemple existant. */
  const LIBS = {
    gsap: {
      nom: "GSAP",
      corps: ['<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script>'],
      detecter: /gsap(@[^/"']*)?\/dist\/gsap(\.min)?\.js/i,
    },
    scrolltrigger: {
      nom: "ScrollTrigger",
      requiert: "gsap",
      corps: ['<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js"></script>'],
      detecter: /ScrollTrigger(\.min)?\.js/i,
    },
    tailwind: {
      nom: "Tailwind",
      tete: ['<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>'],
      detecter: /tailwindcss/i,
    },
    three: {
      nom: "Three.js",
      module: true,
      tete: [IMPORTMAP_THREE],
      detecter: /three(@[^/"']*)?\/build\/three(\.module)?(\.min)?\.js/i,
    },
  };

  const DEFAUTS = {
    html: "<h1>Bonjour</h1>",
    css: "body {\n  margin: 0;\n  font-family: system-ui, sans-serif;\n}",
    js: 'console.log("Exemple prêt")',
  };

  const $ = (id) => document.getElementById(id);

  // ---------- État ----------

  const etat = {
    ex: null,               // chemin de l'exemple ouvert (null = nouveau)
    libs: new Set(),
    module: false,          // script.js chargé en type="module"
    extraTete: [],          // balises de <head> non reconnues, conservées telles quelles
    extraCorps: [],         // <script src> non reconnus, conservés tels quels
    modifie: false,
    exemples: [],           // chemins des exemples existants
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

  function analyserIndex(html) {
    const resultat = { titre: "", corps: "", libs: new Set(), module: false, extraTete: [], extraCorps: [] };
    const reconnaitre = (balise) =>
      Object.entries(LIBS).find(([, lib]) => lib.detecter.test(balise))?.[0];

    const titre = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    resultat.titre = titre ? titre[1].trim() : "";

    // <head> : on conserve ce qui n'est ni généré par le studio, ni une bibliothèque connue
    const doc = new DOMParser().parseFromString(html, "text/html");
    [...doc.head.children].forEach((el) => {
      const balise = el.outerHTML;
      if (el.matches('meta[charset], meta[name="viewport"], title, link[href$="style.css"]')) return;
      if (el.matches('script[type="importmap"]') && /three/.test(el.textContent)) { resultat.libs.add("three"); return; }
      const lib = reconnaitre(balise);
      if (lib) resultat.libs.add(lib);
      else resultat.extraTete.push(balise);
    });

    // <body> : contenu tel quel (formatage conservé), sans les <script src>
    const corps = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    let contenu = corps ? corps[1] : "";
    contenu = contenu.replace(/^[ \t]*<!--\s*Code injected by live-server\s*-->[\s\S]*?<\/script>[ \t]*\r?\n?/im, "");
    contenu = contenu.replace(/^[ \t]*(<script\b[^>]*\bsrc=[^>]*>\s*<\/script>)[ \t]*\r?\n?/gim, (m, balise) => {
      if (/src=["']?(\.\/)?script\.js/i.test(balise)) {
        if (/type=["']?module/i.test(balise)) resultat.module = true;
      } else {
        const lib = reconnaitre(balise);
        if (lib) resultat.libs.add(lib);
        else resultat.extraCorps.push(balise);
      }
      return "";
    });
    resultat.corps = desindenter(contenu);
    return resultat;
  }

  // ---------- Génération des fichiers ----------

  function genererIndex() {
    const titre = $("titre").value.trim() || $("nom").value.trim() || "Exemple";
    const tete = [];
    const corps = [];
    Object.entries(LIBS).forEach(([cle, lib]) => {
      if (!etat.libs.has(cle)) return;
      tete.push(...(lib.tete || []));
      corps.push(...(lib.corps || []));
    });
    tete.push(...etat.extraTete);
    corps.push(...etat.extraCorps);

    const module = etat.module || [...etat.libs].some((c) => LIBS[c].module);
    corps.push(`<script${module ? ' type="module"' : ""} src="script.js"></script>`);

    const lignesTete = [
      '<meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1">',
      `<title>${echapper(titre)}</title>`,
      ...tete,
      '<link rel="stylesheet" href="style.css">',
    ];

    return `<!doctype html>
<html lang="fr">
<head>
${lignesTete.map((l) => "  " + l).join("\n")}
</head>
<body>
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
  function genererApercu() {
    const f = genererFichiers();
    const chemin = etat.ex || `${$("cours").value.trim() || "_"}/${$("nom").value.trim() || "_"}`;
    let doc = f["index.html"]
      .replace(/<link rel="stylesheet" href="style\.css">/, () => `<style>\n${f["style.css"]}</style>`)
      .replace(/<script( type="module")? src="script\.js"><\/script>/, (m, type) =>
        `<script${type || ""}>\n${f["script.js"].replace(/<\/script/gi, "<\\/script")}</script>`);
    // Les chemins relatifs (images, etc.) sont résolus dans le dossier de l'exemple
    return doc.replace("<head>", `<head>\n  <base href="${new URL(chemin + "/", SITE).href}">`);
  }

  // ---------- Aperçu en direct ----------

  let minuterie;
  function planifierApercu() {
    clearTimeout(minuterie);
    minuterie = setTimeout(() => { $("resultat").srcdoc = genererApercu(); }, DELAI_APERCU);
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

  function creerBibliotheques() {
    const zone = $("bibliotheques");
    Object.entries(LIBS).forEach(([cle, lib]) => {
      const label = document.createElement("label");
      label.className = "puce";
      label.innerHTML = `<input type="checkbox" value="${cle}"> ${lib.nom}`;
      zone.append(label);
    });
    const extra = document.createElement("span");
    extra.className = "extra";
    extra.id = "extra";
    zone.append(extra);

    zone.addEventListener("change", (e) => {
      const cle = e.target.value;
      if (e.target.checked) {
        etat.libs.add(cle);
        if (LIBS[cle].requiert) etat.libs.add(LIBS[cle].requiert);
      } else {
        etat.libs.delete(cle);
        // Retirer une bibliothèque retire aussi celles qui en dépendent
        Object.entries(LIBS).forEach(([c, l]) => { if (l.requiert === cle) etat.libs.delete(c); });
      }
      afficherBibliotheques();
      marquerModifie();
    });
  }

  function afficherBibliotheques() {
    $("bibliotheques").querySelectorAll("input").forEach((i) => { i.checked = etat.libs.has(i.value); });
    const n = etat.extraTete.length + etat.extraCorps.length;
    $("extra").textContent = n ? `+ ${n} autre${n > 1 ? "s" : ""} balise${n > 1 ? "s" : ""} conservée${n > 1 ? "s" : ""}` : "";
    $("extra").title = [...etat.extraTete, ...etat.extraCorps].join("\n");
  }

  // ---------- Liste des exemples ----------

  async function chargerListe() {
    try {
      const chemins = await github().fichiers();
      etat.exemples = chemins
        .filter((c) => c.endsWith("/index.html"))
        .map((c) => c.slice(0, -"/index.html".length))
        .filter((c) => c.includes("/") && !RESERVES.includes(c.split("/")[0]))
        .sort();
    } catch (e) {
      etat.exemples = [];
      statut(`Liste des exemples indisponible (${e.message}). La création reste possible.`, "erreur");
    }

    const select = $("ouvrir");
    select.length = 1;
    etat.exemples.forEach((c) => select.add(new Option(c, c)));
    select.value = etat.ex || "";

    const cours = [...new Set(etat.exemples.map((c) => c.split("/")[0]))];
    $("liste-cours").innerHTML = cours.map((c) => `<option value="${c}">`).join("");
  }

  // ---------- Ouvrir / nouveau ----------

  async function lireFichierExemple(chemin, fichier) {
    try {
      const texte = await github().lire(`${chemin}/${fichier}`);
      if (texte !== null) return texte;
    } catch (e) { /* API indisponible : on essaie le site */ }
    try {
      const r = await fetch(new URL(`${chemin}/${fichier}`, SITE), { cache: "no-store" });
      return r.ok ? await r.text() : null;
    } catch (e) {
      return null;
    }
  }

  function remplir({ ex, cours, nom, titre, html, css, js, analyse }) {
    etat.ex = ex;
    etat.libs = analyse ? analyse.libs : new Set();
    etat.module = analyse ? analyse.module : false;
    etat.extraTete = analyse ? analyse.extraTete : [];
    etat.extraCorps = analyse ? analyse.extraCorps : [];
    $("cours").value = cours;
    $("nom").value = nom;
    $("titre").value = titre;
    remplacerEditeur("html", html);
    remplacerEditeur("css", css);
    remplacerEditeur("js", js);
    afficherBibliotheques();
    $("ouvrir").value = ex || "";
    etat.modifie = false;
    clearTimeout(minuterie);
    $("resultat").srcdoc = genererApercu();
  }

  async function nouvelExemple() {
    const [html, css, js] = await Promise.all(
      ["index.html", "style.css", "script.js"].map((f) => lireFichierExemple("_gabarit", f))
    );
    const analyse = html ? analyserIndex(html) : null;
    remplir({
      ex: null,
      cours: $("cours").value.trim(),
      nom: "",
      titre: "",
      html: analyse?.corps || DEFAUTS.html,
      css: (css ?? DEFAUTS.css).replace(/\s+$/, ""),
      js: (js ?? DEFAUTS.js).replace(/\s+$/, ""),
      analyse,
    });
    statut("Nouvel exemple.");
  }

  async function ouvrirExemple(chemin) {
    statut(`Ouverture de ${chemin}…`);
    const [html, css, js] = await Promise.all(
      ["index.html", "style.css", "script.js"].map((f) => lireFichierExemple(chemin, f))
    );
    if (html === null) return statut(`Impossible d'ouvrir ${chemin}.`, "erreur");
    const analyse = analyserIndex(html);
    const [cours, ...reste] = chemin.split("/");
    remplir({
      ex: chemin,
      cours,
      nom: reste.join("/"),
      titre: analyse.titre,
      html: analyse.corps,
      css: (css || "").replace(/\s+$/, ""),
      js: (js || "").replace(/\s+$/, ""),
      analyse,
    });
    statut(`${chemin} ouvert.`);
  }

  // ---------- Enregistrement ----------

  async function enregistrer() {
    const cours = $("cours").value.trim();
    const nom = $("nom").value.trim();

    if (!SLUG.test(cours) || !SLUG.test(nom)) {
      return statut("Cours et nom du dossier : lettres, chiffres, « - » et « _ » seulement.", "erreur");
    }
    if (RESERVES.includes(cours)) return statut(`« ${cours} » est un nom réservé.`, "erreur");
    if (!reglages.jeton) {
      statut("Un jeton GitHub est nécessaire pour enregistrer.", "erreur");
      return ouvrirReglages();
    }

    const chemin = `${cours}/${nom}`;
    const existe = etat.exemples.includes(chemin);
    if (existe && chemin !== etat.ex && !confirm(`L'exemple ${chemin} existe déjà. Le remplacer ?`)) return;

    const fichiers = {};
    Object.entries(genererFichiers()).forEach(([f, contenu]) => { fichiers[`${chemin}/${f}`] = contenu; });

    let message = existe ? `Studio : mise à jour de ${chemin}` : `Studio : ajout de ${chemin}`;
    if (etat.ex && etat.ex !== chemin) message += ` (copie de ${etat.ex})`;

    const bouton = $("btn-enregistrer");
    bouton.disabled = true;
    statut("Enregistrement…");
    try {
      await github().enregistrer(fichiers, message);
      etat.ex = chemin;
      etat.modifie = false;
      if (!etat.exemples.includes(chemin)) {
        etat.exemples.push(chemin);
        etat.exemples.sort();
        const select = $("ouvrir");
        select.length = 1;
        etat.exemples.forEach((c) => select.add(new Option(c, c)));
      }
      $("ouvrir").value = chemin;
      statut(`${chemin} enregistré.`, "succes");
      afficherSucces(chemin);
    } catch (e) {
      const raisons = {
        401: "jeton invalide ou expiré",
        403: "le jeton n'a pas la permission d'écrire dans ce répertoire",
        404: "répertoire ou branche introuvable (ou jeton sans accès)",
        409: "conflit avec un autre enregistrement, réessayer",
        422: "conflit avec un autre enregistrement, réessayer",
      };
      statut(`Échec de l'enregistrement : ${raisons[e.status] || e.message}.`, "erreur");
    } finally {
      bouton.disabled = false;
    }
  }

  function afficherSucces(chemin) {
    const src = `${new URL("v/", SITE).href}?ex=${chemin}`;
    $("extrait").textContent =
      `<iframe src="${src}" class="aspect-3-2" style="width:100%;border:0" loading="lazy"></iframe>`;
    $("lien-constructeur").href = `${SITE.href}?ex=${encodeURIComponent(chemin).replace(/%2F/g, "/")}`;
    $("succes").showModal();
  }

  // ---------- Réglages ----------

  function ouvrirReglages() {
    const f = $("form-reglages");
    ["proprietaire", "repertoire", "branche", "jeton"].forEach((k) => { f.elements[k].value = reglages[k] || ""; });
    $("etat-jeton").textContent = reglages.jeton ? "Un jeton est enregistré dans ce navigateur." : "Aucun jeton enregistré.";
    $("reglages").showModal();
  }

  function sauverReglages() {
    const f = $("form-reglages");
    const anciens = { ...reglages };
    ["proprietaire", "repertoire", "branche", "jeton"].forEach((k) => { reglages[k] = f.elements[k].value.trim(); });
    ecrireReglages(reglages);
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
    ["cours", "nom", "titre"].forEach((id) => $(id).addEventListener("input", marquerModifie));

    $("ouvrir").addEventListener("change", async (e) => {
      const choix = e.target.value;
      if (etat.modifie && !confirm("Les modifications non enregistrées seront perdues. Continuer ?")) {
        e.target.value = etat.ex || "";
        return;
      }
      if (choix) await ouvrirExemple(choix);
      else await nouvelExemple();
    });

    $("btn-enregistrer").addEventListener("click", enregistrer);
    $("btn-reglages").addEventListener("click", ouvrirReglages);
    $("form-reglages").addEventListener("change", sauverReglages);
    $("reglages").addEventListener("close", sauverReglages);
    $("btn-tester").addEventListener("click", testerJeton);
    $("btn-oublier").addEventListener("click", () => {
      $("form-reglages").elements.jeton.value = "";
      sauverReglages();
      $("etat-jeton").textContent = "Jeton effacé de ce navigateur.";
    });
    $("btn-copier").addEventListener("click", async (e) => {
      try {
        await navigator.clipboard.writeText($("extrait").textContent);
        e.target.textContent = "Copié !";
        setTimeout(() => (e.target.textContent = "Copier"), 1500);
      } catch (err) { /* presse-papiers indisponible */ }
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
    if (!window.CM || typeof GitHub === "undefined") {
      document.body.innerHTML = '<p class="message">Le studio n\'a pas pu se charger.</p>';
      return;
    }
    creerEditeurs();
    creerBibliotheques();
    brancherEvenements();

    const demande = new URLSearchParams(location.search).get("ex");
    await chargerListe();
    if (demande && /^[a-z0-9_-]+(\/[a-z0-9_-]+)+$/i.test(demande)) await ouvrirExemple(demande);
    else await nouvelExemple();
    if (!reglages.jeton) statut("Aucun jeton GitHub : l'aperçu fonctionne, mais l'enregistrement demandera un jeton (⚙).");
  }

  demarrer();
})();
