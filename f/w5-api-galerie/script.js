// L'API du Cleveland Museum of Art : sans clé, CORS accepté
// https://openaccess-api.clevelandart.org
const API = "https://openaccess-api.clevelandart.org/api";
const PER_PAGE = 6;

const modeButtons = document.querySelectorAll(".mode");
const explain = document.querySelector(".explain");
const address = document.querySelector(".address");
const progress = document.querySelector(".progress");
const page = document.querySelector(".page");
const form = document.querySelector(".search");
const queryInput = document.querySelector(".query");
const suggestions = document.querySelector(".suggestions");
const hint = document.querySelector(".hint");
const count = document.querySelector(".count");
const grid = document.querySelector(".grid");
const moreButton = document.querySelector(".more");
const requests = document.querySelector(".requests");
const totalLabel = document.querySelector(".total");
const source = document.querySelector(".source");

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

let mode = "app";        // "app" ou "mpa"
let query = "landscape"; // la recherche en cours
let skip = 0;            // combien d'œuvres on saute (la pagination)
let totalBytes = 0;      // tout ce qui a voyagé
let frozen = false;      // true si on utilise les données figées

// ---------- Aller chercher les données ----------

// fetch() avec une limite de temps : un musée lent ne bloque pas la page
async function getJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error("Statut " + response.status);
    const text = await response.text();
    return { data: JSON.parse(text), bytes: text.length };
  } finally {
    clearTimeout(timer);
  }
}

// Les œuvres d'une recherche, une page à la fois
async function loadArtworks(q, start) {
  const url = `${API}/artworks/?q=${encodeURIComponent(q)}`
    + `&limit=${PER_PAGE}&skip=${start}&has_image=1`
    + "&fields=id,title,creators,creation_date,images";
  try {
    const { data, bytes } = await getJson(url);
    setFrozen(false);
    return { works: data.data, total: data.info.total, bytes };
  } catch (error) {
    // Repli : on filtre les données figées
    setFrozen(true);
    const found = FROZEN_ARTWORKS.filter((work) =>
      (work.title + " " + work.creators[0].description)
        .toLowerCase().includes(q.toLowerCase()) || q === "landscape");
    const works = found.slice(start, start + PER_PAGE);
    return { works, total: found.length, bytes: JSON.stringify(works).length };
  }
}

// Les noms d'artistes qui contiennent les lettres tapées
async function loadCreators(q) {
  try {
    const { data, bytes } = await getJson(
      `${API}/creators/?name=${encodeURIComponent(q)}&limit=20`);
    setFrozen(false);
    return { names: data.data.map((c) => c.description), bytes };
  } catch (error) {
    setFrozen(true);
    const names = FROZEN_CREATORS.filter((n) =>
      n.toLowerCase().includes(q.toLowerCase()));
    return { names, bytes: JSON.stringify(names).length };
  }
}

// ---------- Afficher ----------

// « Claude Monet (French, 1840–1926) » devient « Claude Monet »
const shortName = (description) => (description || "").split(" (")[0];

function artworkHtml(work) {
  const creator = work.creators && work.creators[0];
  return `<li>
    <img src="${work.images.web.url}" alt="" loading="lazy">
    <strong>${work.title.trim()}</strong>
    <span>${shortName(creator && creator.description)}, ${work.creation_date}</span>
  </li>`;
}

function showArtworks(result, append) {
  const html = result.works.map(artworkHtml).join("");
  if (append) grid.insertAdjacentHTML("beforeend", html);
  else grid.innerHTML = html;

  const shown = mode === "app" ? grid.children.length : result.works.length;
  if (result.total === 0) {
    count.textContent = frozen
      ? "Aucune œuvre dans les données figées : essayez « Ruisdael »."
      : "Aucune œuvre trouvée.";
    moreButton.hidden = true;
    return;
  }
  count.textContent = mode === "app"
    ? `${shown} œuvres sur ${result.total}`
    : `Page ${skip / PER_PAGE + 1} · œuvres ${skip + 1} à ${skip + shown} sur ${result.total}`;
  moreButton.hidden = skip + PER_PAGE >= result.total;
}

// 18457 octets deviennent « 18,0 Ko »
const kilo = (bytes) => (bytes / 1024)
  .toLocaleString("fr-CA", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " Ko";

// Ajoute une ligne au panneau « Ce qui voyage »
function logRequest(type, path, bytes, effect) {
  totalBytes += bytes;
  const item = document.createElement("li");
  item.className = type;
  item.innerHTML = `<b>${type === "html" ? "Page HTML complète" : "JSON"}</b>
    <code>${path}</code>
    <span>${kilo(bytes)}${type === "html" ? " (estimé)" : ""}</span>
    <em>${effect}</em>`;
  requests.prepend(item);
  totalLabel.textContent = kilo(totalBytes);
}

// Fait clignoter la seule zone qui a changé
function flash(element) {
  if (reducedMotion) return;
  element.classList.remove("changed");
  void element.offsetWidth; // relance l'animation
  element.classList.add("changed");
}

function setFrozen(value) {
  frozen = value;
  source.textContent = frozen
    ? "Données figées : l'API ne répond pas en ce moment."
    : "Données en direct : API du Cleveland Museum of Art.";
}

// ---------- Site multipage : le serveur envoie la page ----------

// On simule le rechargement : barre de chargement, écran blanc,
// retour en haut, puis toute la page est redessinée
async function reloadPage() {
  const url = `musee.exemple/collection?q=${encodeURIComponent(query)}`
    + (skip ? `&page=${skip / PER_PAGE + 1}` : "");
  address.textContent = url;
  progress.classList.add("loading");
  page.classList.add("reloading");

  const result = await loadArtworks(query, skip);
  if (!reducedMotion) await new Promise((r) => setTimeout(r, 450));

  page.scrollTop = 0;
  showArtworks(result, false);
  progress.classList.remove("loading");
  page.classList.remove("reloading");

  // Une page complète : en-tête, menu, styles, pied de page... et les œuvres
  const pageBytes = 42000 + result.bytes * 1.6;
  logRequest("html", url.replace("musee.exemple", ""), pageBytes,
    "Toute la page est redessinée, et on revient en haut.");
}

// ---------- Application web : le serveur envoie les données ----------

async function updateGrid(append) {
  const result = await loadArtworks(query, skip);
  showArtworks(result, append);
  flash(grid);
  logRequest("json", `/api/artworks/?q=${query}&skip=${skip}`, result.bytes,
    append ? "6 œuvres s'ajoutent en bas. On reste où on est."
           : "Seule la grille change.");
}

let typingTimer;
async function suggest() {
  const q = queryInput.value.trim();
  if (q.length < 2) { suggestions.hidden = true; return; }

  const { names, bytes } = await loadCreators(q);
  // On garde les noms dont un mot commence par les lettres tapées
  const start = new RegExp("(^|\\s)" + q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const best = [...new Set(names.map(shortName))]
    .filter((n) => start.test(n)).slice(0, 5);

  suggestions.innerHTML = best.length
    ? best.map((n) => `<li><button type="button">${n}</button></li>`).join("")
    : "<li class=\"none\">Aucun artiste</li>";
  suggestions.hidden = false;
  flash(suggestions);
  logRequest("json", `/api/creators/?name=${q}`, bytes,
    "Seule la liste de suggestions change.");
}

// ---------- Les gestes de l'utilisateur ----------

queryInput.addEventListener("input", () => {
  if (mode !== "app") return;
  clearTimeout(typingTimer);
  typingTimer = setTimeout(suggest, 300); // on attend une pause dans la frappe
});

suggestions.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  queryInput.value = button.textContent;
  form.requestSubmit();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  suggestions.hidden = true;
  query = queryInput.value.trim() || "landscape";
  skip = 0;
  if (mode === "app") updateGrid(false);
  else reloadPage();
});

moreButton.addEventListener("click", () => {
  skip += PER_PAGE;
  if (mode === "app") updateGrid(true);
  else reloadPage();
});

// ---------- Changer de mode ----------

const TEXTS = {
  mpa: "Le serveur fabrique et envoie la page complète (rendu côté serveur, SSR). "
    + "Chaque recherche ou page suivante charge une nouvelle page : l'adresse change.",
  app: "Le serveur envoie seulement les données, en JSON (rendu côté client, CSR). "
    + "fetch() les va chercher, et JavaScript met à jour une zone : l'adresse ne bouge pas.",
};

function setMode(newMode) {
  mode = newMode;
  modeButtons.forEach((b) =>
    b.setAttribute("aria-pressed", b.dataset.mode === mode));
  explain.textContent = TEXTS[mode];
  moreButton.textContent = mode === "app" ? "Charger plus" : "Page suivante →";
  hint.textContent = mode === "app"
    ? "Tapez quelques lettres : des suggestions apparaissent."
    : "Pas de suggestions : il faudrait charger une nouvelle page à chaque lettre.";
  suggestions.hidden = true;
  requests.innerHTML = "";
  totalBytes = 0;
  totalLabel.textContent = "";
  queryInput.value = "";
  query = "landscape";
  skip = 0;
  address.textContent = mode === "app"
    ? "musee.exemple/collection" : "musee.exemple/collection?q=landscape";
  if (mode === "app") updateGrid(false);
  else reloadPage();
}

modeButtons.forEach((b) =>
  b.addEventListener("click", () => setMode(b.dataset.mode)));

setMode("mpa");
