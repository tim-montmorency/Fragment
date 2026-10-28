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

  const DEFAUTS = {
    html: "<h1>Bonjour</h1>",
    css: "body {\n  margin: 0;\n  font-family: system-ui, sans-serif;\n}",
    js: 'console.log("Exemple prêt")',
  };

  const $ = (id) => document.getElementById(id);

  // ---------- État ----------

  const etat = {
    ex: null,               // chemin de l'exemple ouvert (null = nouveau)
    ressources: [],         // bibliothèques : { type: "css" | "js" | "module", url, cle?, tete? } (voir cdn.js)
    module: false,          // script.js chargé en type="module"
    extraTete: [],          // balises de <head> non reconnues, conservées telles quelles
    extraCorps: [],         // <script> non reconnus, conservés tels quels
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
    const resultat = { titre: "", corps: "", ressources: [], module: false, extraTete: [], extraCorps: [] };

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

  function importmap(modules) {
    const imports = Object.fromEntries(modules.map((r) => [r.cle, r.url]));
    const json = JSON.stringify({ imports }, null, 2).split("\n").map((l) => "    " + l).join("\n");
    return `<script type="importmap">\n${json}\n  </script>`;
  }

  function genererIndex() {
    const titre = $("titre").value.trim() || $("nom").value.trim() || "Exemple";
    const r = etat.ressources;
    const modules = r.filter((x) => x.type === "module");

    const tete = [
      ...r.filter((x) => x.type === "css").map((x) => `<link rel="stylesheet" href="${x.url}">`),
      ...r.filter((x) => x.type === "js" && x.tete).map((x) => `<script src="${x.url}"></script>`),
      ...(modules.length ? [importmap(modules)] : []),
      ...etat.extraTete,
    ];
    const corps = [
      ...r.filter((x) => x.type === "js" && !x.tete).map((x) => `<script src="${x.url}"></script>`),
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
    CDN.monter($("recherche-cdn"), {
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

  const TYPES = { css: "CSS", js: "JS", module: "ES" };

  function afficherBibliotheques() {
    const liste = $("ressources");
    liste.innerHTML = "";

    etat.ressources.forEach((r, i) => {
      const puce = document.createElement("li");
      puce.className = `puce puce-${r.type}`;
      puce.draggable = true;
      puce.title = r.type === "module" ? `import … from "${r.cle}"\n${r.url}` : r.url;
      puce.innerHTML = `<span class="type"></span><span class="nom"></span><button type="button" class="retirer" title="Retirer">×</button>`;
      puce.querySelector(".type").textContent = TYPES[r.type] + (r.tete ? " · head" : "");
      puce.querySelector(".nom").textContent = r.type === "module" ? r.cle : CDN.libelle(r);
      puce.querySelector(".retirer").addEventListener("click", () => {
        etat.ressources.splice(i, 1);
        afficherBibliotheques();
        marquerModifie();
      });

      // Glisser-déposer pour changer l'ordre de chargement
      puce.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", String(i));
        puce.classList.add("glisse");
      });
      puce.addEventListener("dragend", () => puce.classList.remove("glisse"));
      puce.addEventListener("dragover", (e) => { e.preventDefault(); puce.classList.add("cible"); });
      puce.addEventListener("dragleave", () => puce.classList.remove("cible"));
      puce.addEventListener("drop", (e) => {
        e.preventDefault();
        const de = parseInt(e.dataTransfer.getData("text/plain"), 10);
        if (Number.isNaN(de) || de === i) return afficherBibliotheques();
        const [deplacee] = etat.ressources.splice(de, 1);
        etat.ressources.splice(i, 0, deplacee);
        afficherBibliotheques();
        marquerModifie();
      });
      liste.append(puce);
    });

    const n = etat.extraTete.length + etat.extraCorps.length;
    $("extra").textContent = n ? `+ ${n} autre${n > 1 ? "s" : ""} balise${n > 1 ? "s" : ""} conservée${n > 1 ? "s" : ""}` : "";
    $("extra").title = [...etat.extraTete, ...etat.extraCorps].join("\n");
    $("aucune").hidden = etat.ressources.length > 0;
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
    etat.ressources = analyse ? analyse.ressources : [];
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
