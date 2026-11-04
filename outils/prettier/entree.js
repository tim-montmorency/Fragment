// Point d'entrée du paquet Prettier utilisé par le studio (bouton « Formater », formatage à l'enregistrement).
// Chargé seulement au premier formatage : le studio reste léger au démarrage.
// Reconstruire : npm install && npm run build  → ../../studio/vendor/prettier.js
import { formatWithCursor } from "prettier/standalone";
import html from "prettier/plugins/html";
import postcss from "prettier/plugins/postcss";
import babel from "prettier/plugins/babel";
import estree from "prettier/plugins/estree";

window.Prettier = { formatWithCursor, plugins: [html, postcss, babel, estree] };
