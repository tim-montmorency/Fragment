/**
 * Petit client de l'API GitHub pour le studio.
 * - Lecture : liste des exemples (arbre du répertoire) et contenu des fichiers.
 * - Écriture : plusieurs fichiers en un seul commit (Git Data API).
 */
const GitHub = (() => {
  "use strict";

  const API = "https://api.github.com";

  function client({ proprietaire, repertoire, branche, jeton }) {
    const base = `${API}/repos/${encodeURIComponent(proprietaire)}/${encodeURIComponent(repertoire)}`;

    function entetes(accept = "application/vnd.github+json", anonyme = false) {
      const h = { Accept: accept, "X-GitHub-Api-Version": "2022-11-28" };
      if (jeton && !anonyme) h.Authorization = `Bearer ${jeton}`;
      return h;
    }

    // Un jeton refusé (invalide, expiré, sans accès ou en attente d'approbation)
    // ne doit pas empêcher la lecture d'un répertoire public : on réessaie sans jeton.
    const REFUS = [401, 403, 404];

    async function requete(chemin, { methode = "GET", corps, anonyme = false } = {}) {
      const options = { method: methode, headers: entetes(undefined, anonyme), cache: "no-store" };
      if (corps) {
        options.headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(corps);
      }
      const r = await fetch(base + chemin, options);
      if (!r.ok) {
        let detail = "";
        try { detail = (await r.json()).message || ""; } catch (e) { /* aucun détail */ }
        const erreur = new Error(detail || `Erreur ${r.status}`);
        erreur.status = r.status;
        erreur.limite = r.headers.get("x-ratelimit-remaining") === "0";
        throw erreur;
      }
      return r.status === 204 ? null : r.json();
    }

    return {
      /** Informations du répertoire (sert à tester le jeton). */
      depot: () => requete(""),

      /** Tous les chemins de fichiers de la branche. */
      async fichiers() {
        const chemin = `/git/trees/${encodeURIComponent(branche)}?recursive=1`;
        let arbre;
        try {
          arbre = await requete(chemin);
        } catch (e) {
          if (!jeton || !REFUS.includes(e.status)) throw e;
          arbre = await requete(chemin, { anonyme: true });
          arbre.jetonRefuse = true;
        }
        const liste = arbre.tree.filter((n) => n.type === "blob").map((n) => n.path);
        liste.jetonRefuse = Boolean(arbre.jetonRefuse);
        return liste;
      },

      /** Contenu texte d'un fichier, ou null s'il n'existe pas. */
      async lire(chemin) {
        const url = `${base}/contents/${chemin.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(branche)}`;
        let r = await fetch(url, { headers: entetes("application/vnd.github.raw+json"), cache: "no-store" });
        if (jeton && REFUS.includes(r.status)) {
          r = await fetch(url, { headers: entetes("application/vnd.github.raw+json", true), cache: "no-store" });
        }
        if (r.status === 404) return null;
        if (!r.ok) throw new Error(`Lecture impossible : ${chemin} (${r.status})`);
        return r.text();
      },

      /**
       * Écrit (ou supprime) plusieurs fichiers en un seul commit.
       * fichiers : { "f/exemple/index.html": "contenu", "f/ancien/style.css": null, … }
       * Une valeur null supprime le fichier.
       */
      async enregistrer(fichiers, message) {
        const ref = await requete(`/git/ref/heads/${encodeURIComponent(branche)}`);
        const parent = await requete(`/git/commits/${ref.object.sha}`);
        const arbre = await requete("/git/trees", {
          methode: "POST",
          corps: {
            base_tree: parent.tree.sha,
            tree: Object.entries(fichiers).map(([path, content]) =>
              content === null
                ? { path, mode: "100644", type: "blob", sha: null }
                : { path, mode: "100644", type: "blob", content }),
          },
        });
        const commit = await requete("/git/commits", {
          methode: "POST",
          corps: { message, tree: arbre.sha, parents: [ref.object.sha] },
        });
        await requete(`/git/refs/heads/${encodeURIComponent(branche)}`, {
          methode: "PATCH",
          corps: { sha: commit.sha },
        });
        return commit;
      },
    };
  }

  return { client };
})();
