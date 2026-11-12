// La PokéAPI : https://pokeapi.co (sans clé)
const API_URL = "https://pokeapi.co/api/v2/pokemon/";

const form = document.querySelector(".form");
const nameInput = document.querySelector(".name");
const pathInput = document.querySelector(".path");
const stepsList = document.querySelector(".steps");
const result = document.querySelector(".result");

let data = null;      // la réponse de l'API
let loadedName = "";  // le Pokémon déjà chargé

// Le type d'une valeur, en mots
function describe(value) {
  if (Array.isArray(value)) return "un tableau [ ] de " + value.length;
  if (value === null) return "null";
  if (typeof value === "object") return "un objet { }";
  return "une valeur : " + typeof value;
}

// Découper le chemin en étapes : .cle, [0] ou ["cle-avec-tiret"]
function splitPath(path) {
  if (!path.startsWith("data")) {
    throw new Error("Le chemin commence toujours par data.");
  }
  const steps = [];
  let rest = path.slice(4);
  const pattern = /^(?:\.([A-Za-z_$][\w$]*)|\[(\d+)\]|\[["']([^"']+)["']\])/;

  while (rest.length > 0) {
    const match = rest.match(pattern);
    if (!match) {
      if (rest.startsWith("-") && steps.length > 0) {
        // Le tiret : JavaScript y voit une soustraction
        const before = steps[steps.length - 1].key;
        const after = rest.slice(1).match(/^[\w-]*/)[0].split("-")[0];
        const key = before + "-" + after;
        throw new Error(`JavaScript lit le tiret comme une soustraction :
          ${before} moins ${after}. Une clé avec un tiret s'écrit entre
          crochets et guillemets : ["${key}"]`);
      }
      throw new Error("Je ne comprends pas cette partie : " + rest);
    }
    if (match[1] !== undefined) steps.push({ key: match[1], text: "." + match[1] });
    if (match[2] !== undefined) steps.push({ index: Number(match[2]), text: "[" + match[2] + "]" });
    if (match[3] !== undefined) steps.push({ key: match[3], text: '["' + match[3] + '"]' });
    rest = rest.slice(match[0].length);
  }
  return steps;
}

function addStep(html, className) {
  const li = document.createElement("li");
  li.className = className;
  li.innerHTML = html;
  stepsList.append(li);
}

// Suivre le chemin, étape par étape
function follow(path) {
  stepsList.innerHTML = "";
  result.innerHTML = "";
  let current = data;
  let soFar = "data";
  addStep(`<code>data</code> <span class="type">: ${describe(data)}</span>`, "ok");

  let steps;
  try {
    steps = splitPath(path.trim());
  } catch (error) {
    addStep(`<span class="conseil">${error.message}</span>`, "erreur");
    return;
  }

  for (const step of steps) {
    soFar += step.text;

    // Un tableau demande un index, un objet demande une clé
    if (Array.isArray(current) && step.key !== undefined) {
      addStep(`<code>${soFar}</code> <span class="conseil">C'est un tableau :
        il faut un index, comme [0].</span>`, "erreur");
      return;
    }
    if (!Array.isArray(current) && step.index !== undefined) {
      addStep(`<code>${soFar}</code> <span class="conseil">Ce n'est pas un
        tableau : il faut une clé, comme .name.</span>`, "erreur");
      return;
    }

    current = step.key !== undefined ? current[step.key] : current[step.index];

    if (current === undefined) {
      addStep(`<code>${soFar}</code> <span class="conseil">undefined : cette
        clé ou cet index n'existe pas ici. Vérifiez l'orthographe.</span>`,
        "erreur");
      return;
    }
    addStep(`<code>${soFar}</code> <span class="type">: ${describe(current)}</span>`, "ok");
  }

  // Le résultat : une image, une valeur ou un morceau de JSON
  if (typeof current === "string" && current.endsWith(".png")) {
    result.innerHTML = `<img src="${current}" alt="">`;
  } else if (typeof current === "object" && current !== null) {
    result.innerHTML = `<pre>${JSON.stringify(current, null, 2)}</pre>`;
  } else {
    result.innerHTML = `<p class="valeur">${current}</p>`;
  }
}

// Charger le Pokémon (seulement s'il a changé), puis suivre le chemin
async function run() {
  const name = nameInput.value.trim().toLowerCase();
  try {
    if (name !== loadedName) {
      stepsList.innerHTML = "<li>Chargement...</li>";
      const response = await fetch(API_URL + name);
      if (!response.ok) throw new Error("Pokémon introuvable : " + name);
      data = await response.json();
      loadedName = name;
    }
    follow(pathInput.value);
  } catch (error) {
    stepsList.innerHTML = "";
    addStep(`<span class="conseil">${error.message}</span>`, "erreur");
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  run();
});

document.querySelectorAll(".examples button").forEach((button) => {
  button.addEventListener("click", () => {
    pathInput.value = button.dataset.path;
    run();
  });
});

run();
