/**
 * Fragment — configuration du studio
 * ----------------------------------
 * Connexion « Se connecter avec GitHub » (voir README, section « Connexion GitHub »).
 * Les deux valeurs sont publiques : le client secret, lui, reste dans le relais (Cloudflare Worker).
 * Laissées vides, le studio se rabat sur un jeton personnel (fine-grained), saisi dans ses réglages.
 */
const CONFIG = {
  github: {
    clientId: "Iv23liLUgXvej0DVgwTF",                                // Client ID de la GitHub App « Fragment TIM Montmorency »
    relais: "https://fragment-connexion.timmontmorency.workers.dev",  // Relais (Cloudflare Worker)
  },
};
