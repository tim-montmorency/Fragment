/**
 * Galerie des fragments (page d'accueil)
 * --------------------------------------
 * Lit l'index fragments.json, affiche une carte par fragment avec une
 * miniature vivante, une recherche et un filtre par tag.
 * Filtres partageables dans l'URL : ?tag=web3&q=scroll
 */
(() => {
  "use strict";

  const LARGEUR_RENDU = 1280;   // largeur « écran » simulée dans les miniatures
  const HAUTEUR_RENDU = 800;
  const $ = (id) => document.getElementById(id);

  let fragments = [];
  const params = new URLSearchParams(location.search);
  let tagActif = params.get("tag") || "";
  let recherche = params.get("q") || "";

  // ---------- Utilitaires ----------

  const normaliser = (t) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  function majUrl() {
    const p = new URLSearchParams();
    if (tagActif) p.set("tag", tagActif);
    if (recherche) p.set("q", recherche);
    const qs = p.toString();
    history.replaceState(null, "", qs ? `?${qs}` : location.pathname);
  }

  function dateLisible(iso) {
    if (!iso) return "";
    const d = new Date(`${iso}T12:00:00`);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("fr-CA", { year: "numeric", month: "long", day: "numeric" });
  }

  // ---------- Miniatures vivantes ----------

  // Chargement seulement quand la carte approche de l'écran
  const observateur = new IntersectionObserver((entrees) => {
    entrees.forEach((e) => {
      if (!e.isIntersecting) return;
      const iframe = e.target.querySelector("iframe");
      if (iframe && !iframe.src) iframe.src = iframe.dataset.src;
      observateur.unobserve(e.target);
    });
  }, { rootMargin: "200px" });

  // Mise à l'échelle : le fragment est rendu à 1280 px de large, puis réduit à la taille de la carte
  const redimension = new ResizeObserver((entrees) => {
    entrees.forEach((e) => {
      e.target.style.setProperty("--echelle", e.contentRect.width / LARGEUR_RENDU);
    });
  });

  // ---------- Affichage ----------

  function carte(f) {
    const li = document.createElement("li");
    li.className = "carte";
    const voir = `v/?ex=${encodeURIComponent(f.nom)}`;
    li.innerHTML = `
      <a class="miniature" tabindex="-1" aria-hidden="true">
        <iframe loading="lazy" tabindex="-1" scrolling="no"
                style="width:${LARGEUR_RENDU}px;height:${HAUTEUR_RENDU}px"></iframe>
      </a>
      <div class="infos">
        <h2><a class="titre"></a></h2>
        <p class="meta"><code class="nom"></code><span class="date"></span></p>
        <ul class="tags-carte"></ul>
        <div class="actions">
          <a class="action voir">Voir</a>
          <a class="action modifier">Modifier</a>
          <button type="button" class="action bouton-integrer">Intégrer</button>
        </div>
      </div>`;

    li.querySelector(".miniature").href = voir;
    li.querySelector("iframe").dataset.src = `f/${encodeURIComponent(f.nom)}/`;
    li.querySelector("iframe").title = `Aperçu de ${f.titre || f.nom}`;
    const titre = li.querySelector(".titre");
    titre.href = voir;
    titre.textContent = f.titre || f.nom;
    li.querySelector(".nom").textContent = f.nom;
    li.querySelector(".date").textContent = dateLisible(f.modifie);
    li.querySelector(".voir").href = voir;
    li.querySelector(".modifier").href = `studio/?ex=${encodeURIComponent(f.nom)}`;
    li.querySelector(".bouton-integrer").addEventListener("click", () =>
      Integrer.ouvrir(f.nom, { racine: new URL("./", location.href).href }));

    const ul = li.querySelector(".tags-carte");
    (f.tags || []).forEach((t) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "tag";
      b.textContent = t;
      b.addEventListener("click", () => choisirTag(t));
      const item = document.createElement("li");
      item.append(b);
      ul.append(item);
    });

    observateur.observe(li);
    redimension.observe(li.querySelector(".miniature"));
    return li;
  }

  function afficherTags() {
    const compte = {};
    fragments.forEach((f) => (f.tags || []).forEach((t) => { compte[t] = (compte[t] || 0) + 1; }));
    const nav = $("tags");
    nav.innerHTML = "";
    const tags = [["", "Tous", fragments.length], ...Object.keys(compte).sort().map((t) => [t, t, compte[t]])];
    tags.forEach(([valeur, libelle, n]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "tag";
      b.setAttribute("aria-pressed", valeur === tagActif);
      b.innerHTML = `<span></span> <small>${n}</small>`;
      b.querySelector("span").textContent = libelle;
      b.addEventListener("click", () => choisirTag(valeur === tagActif ? "" : valeur));
      nav.append(b);
    });
  }

  function afficherGrille() {
    const q = normaliser(recherche.trim());
    const visibles = fragments.filter((f) => {
      if (tagActif && !(f.tags || []).includes(tagActif)) return false;
      if (!q) return true;
      return normaliser([f.nom, f.titre, ...(f.tags || [])].join(" ")).includes(q);
    });

    const grille = $("grille");
    grille.innerHTML = "";
    visibles.forEach((f) => grille.append(carte(f)));

    $("compte").textContent = `${visibles.length} fragment${visibles.length > 1 ? "s" : ""}` +
      (tagActif ? ` · tag « ${tagActif} »` : "") + (q ? ` · « ${recherche.trim()} »` : "");
    $("vide").hidden = visibles.length > 0;
    $("vide").textContent = fragments.length ? "Aucun fragment ne correspond." : "Aucun fragment pour l'instant.";
  }

  function choisirTag(tag) {
    tagActif = tag;
    majUrl();
    afficherTags();
    afficherGrille();
  }

  // ---------- Démarrage ----------

  async function demarrer() {
    $("recherche").value = recherche;
    let minuterie;
    $("recherche").addEventListener("input", (e) => {
      clearTimeout(minuterie);
      minuterie = setTimeout(() => {
        recherche = e.target.value;
        majUrl();
        afficherGrille();
      }, 150);
    });

    try {
      const r = await fetch("fragments.json", { cache: "no-cache" });
      if (!r.ok) throw new Error(r.status);
      const index = await r.json();
      fragments = Array.isArray(index.fragments) ? index.fragments : [];
    } catch (e) {
      $("vide").hidden = false;
      $("vide").textContent = "Index des fragments introuvable (fragments.json).";
      return;
    }

    if (tagActif && !fragments.some((f) => (f.tags || []).includes(tagActif))) tagActif = "";
    afficherTags();
    afficherGrille();
  }

  demarrer();
})();
