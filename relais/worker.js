/**
 * Fragment — relais de connexion GitHub (Cloudflare Worker)
 * ---------------------------------------------------------
 * Le studio est un site statique : il ne peut pas garder le « client secret » de la GitHub App.
 * Ce relais fait les deux seules opérations qui en ont besoin, puis renvoie la réponse de GitHub :
 *
 *   POST /jeton       { code, redirect_uri }  → échange le code de connexion contre un jeton
 *   POST /rafraichir  { refresh_token }       → renouvelle un jeton expiré (toutes les 8 h)
 *
 * Rien n'est conservé ni journalisé. Seules les origines listées dans ORIGINES peuvent l'appeler.
 *
 * Variables (Cloudflare → Worker → Settings → Variables and Secrets) :
 *   GITHUB_CLIENT_ID      Client ID de la GitHub App (texte)
 *   GITHUB_CLIENT_SECRET  Client secret de la GitHub App (secret)
 *   ORIGINES              Origines permises, séparées par des virgules
 *                         ex. https://tim-montmorency.com,http://127.0.0.1:5500
 */
export default {
  async fetch(requete, env) {
    const origine = requete.headers.get("Origin") || "";
    const permises = (env.ORIGINES || "").split(",").map((o) => o.trim().replace(/\/$/, "")).filter(Boolean);
    const permise = permises.includes(origine);

    const cors = permise
      ? {
          "Access-Control-Allow-Origin": origine,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
          Vary: "Origin",
        }
      : { Vary: "Origin" };

    const repondre = (donnees, status = 200) =>
      new Response(JSON.stringify(donnees), {
        status,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...cors },
      });

    if (requete.method === "OPTIONS") return new Response(null, { status: permise ? 204 : 403, headers: cors });
    if (!permise) return repondre({ erreur: "Origine non autorisée." }, 403);
    if (requete.method !== "POST") return repondre({ erreur: "Méthode non autorisée." }, 405);
    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) return repondre({ erreur: "Relais mal configuré." }, 500);

    let corps;
    try {
      corps = await requete.json();
    } catch (e) {
      return repondre({ erreur: "Requête invalide." }, 400);
    }

    const params = new URLSearchParams({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET });
    const chemin = new URL(requete.url).pathname.replace(/\/+$/, "");
    if (chemin === "/jeton" && typeof corps.code === "string" && corps.code) {
      params.set("code", corps.code);
      if (typeof corps.redirect_uri === "string") params.set("redirect_uri", corps.redirect_uri);
    } else if (chemin === "/rafraichir" && typeof corps.refresh_token === "string" && corps.refresh_token) {
      params.set("grant_type", "refresh_token");
      params.set("refresh_token", corps.refresh_token);
    } else {
      return repondre({ erreur: "Requête invalide." }, 400);
    }

    let donnees;
    try {
      const r = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "fragment-relais",
        },
        body: params,
      });
      donnees = await r.json();
    } catch (e) {
      return repondre({ erreur: "GitHub ne répond pas." }, 502);
    }

    if (donnees.error || !donnees.access_token) {
      return repondre({ erreur: donnees.error_description || donnees.error || "Échec de la connexion." }, 400);
    }
    const { access_token, expires_in, refresh_token, refresh_token_expires_in } = donnees;
    return repondre({ access_token, expires_in, refresh_token, refresh_token_expires_in });
  },
};
