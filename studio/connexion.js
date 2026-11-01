/**
 * Fragment — « Se connecter avec GitHub »
 * ---------------------------------------
 * 1. connecter() ouvre GitHub dans une petite fenêtre (le travail en cours reste intact).
 * 2. GitHub renvoie vers connexion.html avec un code, que le relais échange contre un jeton.
 * 3. Le jeton (valide 8 h) est gardé dans ce navigateur et renouvelé tout seul pendant 6 mois.
 *
 * Les droits viennent du rôle de la personne sur le répertoire : il faut l'accès en écriture (Write).
 */
const Connexion = (() => {
  "use strict";

  const CLE = "fragment.studio.connexion";
  const CLE_ETAT = "fragment.studio.connexion.etat";
  const MARGE = 5 * 60 * 1000; // renouveler 5 min avant l'expiration
  const CANAL = "fragment-connexion";

  const conf = (typeof CONFIG !== "undefined" && CONFIG.github) || {};
  const relais = (conf.relais || "").replace(/\/+$/, "");
  const configuree = Boolean(conf.clientId && relais);

  const retour = () => new URL("connexion.html", location.href).href.split("?")[0];

  // ---------- Session (localStorage) ----------

  function lire() {
    try { return JSON.parse(localStorage.getItem(CLE) || "null"); } catch (e) { return null; }
  }

  function ecrire(session) {
    try {
      if (session) localStorage.setItem(CLE, JSON.stringify(session));
      else localStorage.removeItem(CLE);
    } catch (e) { /* stockage indisponible */ }
  }

  /** Réponse du relais → session à conserver. */
  function session(d, precedente = {}) {
    const maintenant = Date.now();
    return {
      ...precedente,
      jeton: d.access_token,
      expire: d.expires_in ? maintenant + d.expires_in * 1000 : 0,
      rafraichissement: d.refresh_token || "",
      expireRafraichissement: d.refresh_token_expires_in ? maintenant + d.refresh_token_expires_in * 1000 : 0,
    };
  }

  async function appelerRelais(chemin, corps) {
    const r = await fetch(`${relais}${chemin}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corps),
    });
    let d = {};
    try { d = await r.json(); } catch (e) { /* réponse vide */ }
    if (!r.ok || !d.access_token) throw new Error(d.erreur || `Relais : erreur ${r.status}`);
    return d;
  }

  // ---------- État ----------

  /** Une session existe et peut encore être renouvelée. */
  function connecte() {
    const s = lire();
    if (!s || !s.jeton) return false;
    const limite = s.expireRafraichissement || s.expire;
    return !limite || limite > Date.now();
  }

  function utilisateur() {
    const s = lire();
    return s && s.login ? { login: s.login, avatar: s.avatar || "" } : null;
  }

  let renouvellement = null;

  /** Jeton valide (renouvelé au besoin), ou "" s'il faut se reconnecter. */
  async function jeton() {
    const s = lire();
    if (!s || !s.jeton) return "";
    if (!s.expire || s.expire - MARGE > Date.now()) return s.jeton;
    if (!s.rafraichissement) { ecrire(null); return ""; }
    // Une seule demande de renouvellement à la fois
    renouvellement = renouvellement || appelerRelais("/rafraichir", { refresh_token: s.rafraichissement })
      .then((d) => { const n = session(d, s); ecrire(n); return n.jeton; })
      .catch(() => { ecrire(null); return ""; })
      .finally(() => { renouvellement = null; });
    return renouvellement;
  }

  function deconnecter() {
    ecrire(null);
  }

  // ---------- Connexion (fenêtre GitHub) ----------

  /**
   * Ouvre la fenêtre de connexion GitHub. À appeler directement depuis un clic (sinon la fenêtre est bloquée).
   * Résout true une fois connecté, false si la fenêtre est fermée sans connexion.
   */
  function connecter() {
    if (!configuree) return Promise.reject(new Error("Connexion GitHub non configurée (studio/config.js)."));
    const etat = Array.from(crypto.getRandomValues(new Uint8Array(16)), (o) => o.toString(16).padStart(2, "0")).join("");
    try { localStorage.setItem(CLE_ETAT, JSON.stringify({ etat, t: Date.now() })); } catch (e) { /* stockage indisponible */ }

    const url = new URL("https://github.com/login/oauth/authorize");
    url.searchParams.set("client_id", conf.clientId);
    url.searchParams.set("redirect_uri", retour());
    url.searchParams.set("state", etat);

    const l = 560, h = 720;
    const x = Math.round(window.screenX + (window.outerWidth - l) / 2);
    const y = Math.round(window.screenY + (window.outerHeight - h) / 3);
    const fenetre = window.open(url.href, "fragment-connexion", `popup,width=${l},height=${h},left=${x},top=${y}`);
    if (!fenetre) return Promise.reject(new Error("La fenêtre de connexion a été bloquée par le navigateur."));

    // Le retour passe par un canal commun aux pages du site (BroadcastChannel) et par le stockage :
    // GitHub peut couper le lien entre les deux fenêtres (window.opener), on ne s'y fie donc pas.
    return new Promise((resoudre, rejeter) => {
      const canal = "BroadcastChannel" in window ? new BroadcastChannel(CANAL) : null;
      const terminer = (fn, valeur) => {
        if (canal) canal.close();
        window.removeEventListener("storage", surStockage);
        clearTimeout(delai);
        fn(valeur);
      };
      const surResultat = (d) => {
        if (!d || d.type !== "fragment-connexion") return;
        if (d.ok) terminer(resoudre, true);
        else terminer(rejeter, new Error(d.erreur || "Connexion refusée."));
      };
      if (canal) canal.onmessage = (e) => surResultat(e.data);
      const surStockage = (e) => { if (e.key === CLE && connecte()) terminer(resoudre, true); };
      window.addEventListener("storage", surStockage);
      // Fenêtre abandonnée : on cesse d'attendre (sans erreur ; un nouveau clic relance la connexion)
      const delai = setTimeout(() => terminer(resoudre, connecte()), 10 * 60 * 1000);
    });
  }

  /** Dans connexion.html : échange le code reçu de GitHub, conserve la session, prévient le studio. */
  async function terminerConnexion() {
    const p = new URLSearchParams(location.search);
    let attendu = null;
    try { attendu = JSON.parse(localStorage.getItem(CLE_ETAT) || "null"); } catch (e) { /* rien */ }
    try { localStorage.removeItem(CLE_ETAT); } catch (e) { /* rien */ }

    if (p.get("error")) throw new Error(p.get("error_description") || "Connexion annulée.");
    if (!p.get("code")) throw new Error("Code de connexion absent.");
    if (!attendu || attendu.etat !== p.get("state") || Date.now() - attendu.t > 15 * 60 * 1000) {
      throw new Error("Demande de connexion expirée ou invalide : recommencer depuis le studio.");
    }

    const d = await appelerRelais("/jeton", { code: p.get("code"), redirect_uri: retour() });
    const s = session(d);
    // Nom et avatar, pour l'affichage
    try {
      const r = await fetch("https://api.github.com/user", {
        headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${s.jeton}` },
      });
      if (r.ok) {
        const u = await r.json();
        s.login = u.login;
        s.avatar = u.avatar_url;
      }
    } catch (e) { /* affichage seulement */ }
    ecrire(s);
    return s;
  }

  /** Dans connexion.html : prévient le studio du résultat. */
  function annoncer(resultat) {
    if (!("BroadcastChannel" in window)) return;
    const canal = new BroadcastChannel(CANAL);
    canal.postMessage({ type: "fragment-connexion", ...resultat });
    canal.close();
  }

  return { configuree, connecte, utilisateur, jeton, connecter, deconnecter, terminerConnexion, annoncer };
})();
