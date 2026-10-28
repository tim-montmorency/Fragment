/**
 * Recherche de bibliothèques sur npm, servies par jsDelivr.
 * ---------------------------------------------------------
 * - Recherche : registre npm (registry.npmjs.org)
 * - Fichier principal et liste des fichiers : API de jsDelivr (data.jsdelivr.com)
 * - Adresses produites : https://cdn.jsdelivr.net/npm/<paquet>@<version>/<fichier>
 *
 * Une « ressource » est un objet :
 *   { type: "css" | "js" | "module", url, cle?, tete? }
 *   - css    → <link rel="stylesheet"> dans <head>
 *   - js     → <script src> (à la fin de <body>, ou dans <head> si tete=true)
 *   - module → entrée de l'importmap (cle = nom utilisé dans « import … from "cle" »)
 */
const CDN = (() => {
  "use strict";

  const RECHERCHE = "https://registry.npmjs.org/-/v1/search";
  const DONNEES = "https://data.jsdelivr.com/v1/packages/npm";
  const BASE = "https://cdn.jsdelivr.net/npm";

  /** Suggestions affichées quand le champ est vide. */
  const POPULAIRES = [
    "gsap", "@tailwindcss/browser", "three", "p5", "animejs", "matter-js",
    "lenis", "swiper", "chart.js", "d3", "alpinejs", "lottie-web",
  ];

  /** Réglages particuliers de certains paquets. */
  const PARTICULIERS = {
    // Tailwind doit être chargé dans <head>
    "@tailwindcss/browser": { tete: true },
    // Three.js : les modules complémentaires (OrbitControls, etc.) via "three/addons/"
    three: { importmap: { "three/addons/": "examples/jsm/" } },
  };

  // ---------- Accès aux API ----------

  async function json(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`${r.status}`);
    return r.json();
  }

  async function chercher(texte, nombre = 8) {
    const d = await json(`${RECHERCHE}?text=${encodeURIComponent(texte)}&size=${nombre}`);
    const resultats = d.objects.map((o) => ({
      nom: o.package.name,
      version: o.package.version,
      description: o.package.description || "",
    }));
    // Le paquet dont le nom correspond exactement passe en premier
    const exact = texte.trim().toLowerCase();
    return resultats.sort((a, b) => (b.nom.toLowerCase() === exact) - (a.nom.toLowerCase() === exact));
  }

  /** Paquet exact (nom + version la plus récente), ou null. */
  async function paquet(nom) {
    const resultats = await chercher(nom, 5);
    return resultats.find((r) => r.nom === nom) || null;
  }

  async function entrees(nom, version) {
    try {
      const d = await json(`${DONNEES}/${nom}@${version}/entrypoints`);
      return { js: d.entrypoints?.js?.file || null, css: d.entrypoints?.css?.file || null };
    } catch (e) {
      return { js: null, css: null };
    }
  }

  async function fichiers(nom, version) {
    const d = await json(`${DONNEES}/${nom}@${version}?structure=flat`);
    return {
      defaut: d.default || null,
      liste: d.files.map((f) => f.name).filter((f) => /\.(m?js|css)$/i.test(f)),
    };
  }

  // ---------- Ressources ----------

  const estModule = (fichier) =>
    /\.mjs$/i.test(fichier) || /\.module(\.min)?\.js$/i.test(fichier) || /\/(esm|es)\//i.test(fichier) || /\+esm$/.test(fichier);

  /** Ressource(s) à ajouter pour un fichier d'un paquet. */
  function ressources(nom, version, fichier) {
    const chemin = fichier.replace(/^\//, "");
    const url = `${BASE}/${nom}@${version}/${chemin}`;
    const particulier = PARTICULIERS[nom] || {};

    if (/\.css$/i.test(chemin)) return [{ type: "css", url }];

    if (estModule(chemin)) {
      const liste = [{ type: "module", cle: nom, url }];
      Object.entries(particulier.importmap || {}).forEach(([cle, sousChemin]) => {
        liste.push({ type: "module", cle, url: `${BASE}/${nom}@${version}/${sousChemin}` });
      });
      return liste;
    }

    return [{ type: "js", url, ...(particulier.tete ? { tete: true } : {}) }];
  }

  /** Ressource à partir d'une adresse collée telle quelle. */
  function ressourceDepuisUrl(url) {
    if (/\.css(\?|#|$)/i.test(url)) return { type: "css", url };
    if (estModule(url.split(/[?#]/)[0])) {
      const m = url.match(/\/npm\/((?:@[^/]+\/)?[^@/]+)/);
      return { type: "module", cle: m ? m[1] : url.split("/").pop().replace(/(\.module)?(\.min)?\.m?js$/i, ""), url };
    }
    return { type: "js", url };
  }

  /** Paquet npm et version d'une adresse jsDelivr, ou null. */
  function paquetDepuisUrl(url) {
    const m = url.match(/cdn\.jsdelivr\.net\/npm\/((?:@[^/@]+\/)?[^/@]+)@([^/]+)/);
    return m ? { nom: m[1], version: m[2] } : null;
  }

  /** Libellé court : « gsap@3.13.0 · ScrollTrigger.min.js ». */
  function libelle(ressource) {
    if (ressource.type === "module" && ressource.url.endsWith("/")) return ressource.cle;
    const m = ressource.url.match(/cdn\.jsdelivr\.net\/npm\/((?:@[^/]+\/)?[^/]+)\/(.*)$/);
    if (m) return `${m[1]} · ${m[2].split("/").pop() || m[2]}`;
    try {
      const u = new URL(ressource.url);
      return `${u.hostname} · ${u.pathname.split("/").pop()}`;
    } catch (e) {
      return ressource.url;
    }
  }

  // ---------- Interface : champ de recherche ----------

  /**
   * Monte la recherche dans « conteneur ».
   * ajouter(liste) est appelé avec les ressources choisies.
   */
  function monter(conteneur, { ajouter, statut = () => {} }) {
    conteneur.classList.add("cdn");
    conteneur.innerHTML = `
      <input type="search" class="cdn-champ" placeholder="Ajouter une bibliothèque (npm) ou coller une adresse…"
             autocomplete="off" spellcheck="false" aria-label="Rechercher une bibliothèque">
      <div class="cdn-resultats" role="listbox" hidden></div>`;

    const champ = conteneur.querySelector(".cdn-champ");
    const boite = conteneur.querySelector(".cdn-resultats");
    let lignes = [];        // [{ element, action }]
    let actif = -1;
    let jeton = 0;          // ignore les réponses arrivées dans le désordre
    let minuterie;

    function fermer() {
      boite.hidden = true;
      boite.innerHTML = "";
      lignes = [];
      actif = -1;
    }

    function surligner(i) {
      lignes.forEach((l, n) => l.element.classList.toggle("actif", n === i));
      actif = i;
      lignes[i]?.element.scrollIntoView({ block: "nearest" });
    }

    function afficher(entete, elements) {
      boite.innerHTML = "";
      lignes = [];
      if (entete) boite.append(entete);
      elements.forEach((el) => {
        if (el.action) {
          el.element.addEventListener("mousedown", (e) => { e.preventDefault(); el.action(); });
          lignes.push(el);
        }
        boite.append(el.element);
      });
      boite.hidden = false;
      surligner(lignes.length ? 0 : -1);
    }

    const message = (texte) => {
      const d = document.createElement("div");
      d.className = "cdn-message";
      d.textContent = texte;
      return { element: d };
    };

    function terminer(liste) {
      ajouter(liste);
      champ.value = "";
      fermer();
      champ.blur();
    }

    // Ajout du fichier principal d'un paquet (ou ouverture de la liste des fichiers)
    async function ajouterPaquet({ nom, version }) {
      afficher(null, [message(`Recherche du fichier principal de ${nom}@${version}…`)]);
      const e = await entrees(nom, version);
      const liste = [];
      if (e.css) liste.push(...ressources(nom, version, e.css));
      if (e.js) liste.push(...ressources(nom, version, e.js));
      if (liste.length) terminer(liste);
      else afficherFichiers({ nom, version });
    }

    function lignePaquet(p) {
      const d = document.createElement("div");
      d.className = "cdn-ligne";
      d.setAttribute("role", "option");
      d.innerHTML = `
        <div class="cdn-texte">
          <strong></strong> <span class="cdn-version"></span>
          <div class="cdn-description"></div>
        </div>
        <button type="button" class="cdn-fichiers" title="Choisir un autre fichier du paquet">Fichiers ▸</button>`;
      d.querySelector("strong").textContent = p.nom;
      d.querySelector(".cdn-version").textContent = p.version;
      d.querySelector(".cdn-description").textContent = p.description;
      d.querySelector(".cdn-fichiers").addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        afficherFichiers(p);
      });
      return { element: d, action: () => ajouterPaquet(p), fichiers: () => afficherFichiers(p) };
    }

    async function afficherFichiers({ nom, version }) {
      afficher(null, [message(`Chargement des fichiers de ${nom}@${version}…`)]);
      let f;
      try {
        f = await fichiers(nom, version);
      } catch (e) {
        return afficher(null, [message("Liste des fichiers indisponible.")]);
      }

      // Fichier par défaut en premier, puis versions minifiées, puis les moins profonds
      const profondeur = (c) => c.split("/").length;
      const tri = (a, b) =>
        (b === f.defaut) - (a === f.defaut) ||
        /\.min\./.test(b) - /\.min\./.test(a) ||
        profondeur(a) - profondeur(b) ||
        a.localeCompare(b);
      const tous = [...f.liste].sort(tri);

      const entete = document.createElement("div");
      entete.className = "cdn-entete";
      entete.innerHTML = `
        <button type="button" class="cdn-retour" title="Retour aux résultats">←</button>
        <span><strong></strong> — choisir un fichier</span>
        <input type="search" class="cdn-filtre" placeholder="Filtrer (ex. scroll)" spellcheck="false">`;
      entete.querySelector("strong").textContent = `${nom}@${version}`;
      entete.querySelector(".cdn-retour").addEventListener("mousedown", (e) => {
        e.preventDefault();
        rechercher(champ.value);
      });

      const filtre = entete.querySelector(".cdn-filtre");
      const remplir = () => {
        const q = filtre.value.trim().toLowerCase();
        const choix = tous.filter((c) => c.toLowerCase().includes(q)).slice(0, 150);
        const elements = choix.map((c) => {
          const d = document.createElement("div");
          d.className = "cdn-ligne cdn-fichier";
          d.textContent = c;
          return { element: d, action: () => terminer(ressources(nom, version, c)) };
        });
        // Garder l'en-tête (et le focus du filtre) en place
        [...boite.children].forEach((el) => { if (el !== entete) el.remove(); });
        lignes = [];
        elements.forEach((el) => {
          el.element.addEventListener("mousedown", (e) => { e.preventDefault(); el.action(); });
          lignes.push(el);
          boite.append(el.element);
        });
        if (!elements.length) boite.append(message("Aucun fichier.").element);
        surligner(lignes.length ? 0 : -1);
      };

      afficher(entete, []);
      filtre.addEventListener("input", remplir);
      filtre.addEventListener("keydown", navigation);
      remplir();
      filtre.focus();
    }

    async function rechercher(texte) {
      const q = texte.trim();
      const numero = ++jeton;

      if (/^https?:\/\//i.test(q)) {
        const d = message(`Ajouter cette adresse : ${q}`);
        d.element.classList.add("cdn-ligne");
        return afficher(null, [{ element: d.element, action: () => terminer([ressourceDepuisUrl(q)]) }]);
      }

      if (!q) {
        const entete = document.createElement("div");
        entete.className = "cdn-entete";
        entete.textContent = "Populaires";
        const elements = POPULAIRES.map((nom) => {
          const d = document.createElement("div");
          d.className = "cdn-ligne";
          d.innerHTML = "<strong></strong>";
          d.querySelector("strong").textContent = nom;
          return {
            element: d,
            action: async () => {
              afficher(null, [message(`Recherche de ${nom}…`)]);
              try {
                const p = await paquet(nom);
                if (p) ajouterPaquet(p);
                else afficher(null, [message(`${nom} introuvable.`)]);
              } catch (e) {
                afficher(null, [message("Recherche indisponible (connexion ?).")]);
              }
            },
          };
        });
        return afficher(entete, elements);
      }

      afficher(null, [message("Recherche…")]);
      try {
        const resultats = await chercher(q);
        if (numero !== jeton) return;
        afficher(null, resultats.length ? resultats.map(lignePaquet) : [message("Aucun résultat.")]);
      } catch (e) {
        if (numero !== jeton) return;
        afficher(null, [message("Recherche indisponible (connexion ?).")]);
        statut("Recherche npm indisponible.", "erreur");
      }
    }

    function navigation(e) {
      if (boite.hidden) return;
      if (e.key === "ArrowDown") { e.preventDefault(); surligner(Math.min(actif + 1, lignes.length - 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); surligner(Math.max(actif - 1, 0)); }
      else if (e.key === "ArrowRight" && lignes[actif]?.fichiers && e.target === champ &&
               champ.selectionStart === champ.value.length) { e.preventDefault(); lignes[actif].fichiers(); }
      else if (e.key === "Enter") { e.preventDefault(); lignes[actif]?.action(); }
      else if (e.key === "Escape") { e.preventDefault(); fermer(); champ.blur(); }
    }

    champ.addEventListener("input", () => {
      clearTimeout(minuterie);
      minuterie = setTimeout(() => rechercher(champ.value), 250);
    });
    champ.addEventListener("focus", () => rechercher(champ.value));
    champ.addEventListener("keydown", navigation);

    // Fermer en cliquant ailleurs
    document.addEventListener("mousedown", (e) => {
      if (!conteneur.contains(e.target)) fermer();
    });

    return {
      /** Ouvre directement la liste des fichiers d'un paquet. */
      fichiers: (nom, version) => afficherFichiers({ nom, version }),
    };
  }

  return { monter, libelle, ressourceDepuisUrl, paquetDepuisUrl };
})();
