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

    function entetes(accept = "application/vnd.github+json") {
      const h = { Accept: accept, "X-GitHub-Api-Version": "2022-11-28" };
      if (jeton) h.Authorization = `Bearer ${jeton}`;
      return h;
    }

    async function requete(chemin, { methode = "GET", corps } = {}) {
      const options = { method: methode, headers: entetes(), cache: "no-store" };
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
        throw erreur;
      }
      return r.status === 204 ? null : r.json();
    }

    return {
      /** Informations du répertoire (sert à tester le jeton). */
      depot: () => requete(""),

      /** Tous les chemins de fichiers de la branche. */
      async fichiers() {
        const arbre = await requete(`/git/trees/${encodeURIComponent(branche)}?recursive=1`);
        return arbre.tree.filter((n) => n.type === "blob").map((n) => n.path);
      },

      /** Contenu texte d'un fichier, ou null s'il n'existe pas. */
      async lire(chemin) {
        const url = `${base}/contents/${chemin.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(branche)}`;
        const r = await fetch(url, { headers: entetes("application/vnd.github.raw+json"), cache: "no-store" });
        if (r.status === 404) return null;
        if (!r.ok) throw new Error(`Lecture impossible : ${chemin} (${r.status})`);
        return r.text();
      },

      /**
       * Écrit plusieurs fichiers en un seul commit.
       * fichiers : { "web3/exemple/index.html": "contenu", … }
       */
      async enregistrer(fichiers, message) {
        const ref = await requete(`/git/ref/heads/${encodeURIComponent(branche)}`);
        const parent = await requete(`/git/commits/${ref.object.sha}`);
        const arbre = await requete("/git/trees", {
          methode: "POST",
          corps: {
            base_tree: parent.tree.sha,
            tree: Object.entries(fichiers).map(([path, content]) => ({
              path, mode: "100644", type: "blob", content,
            })),
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
