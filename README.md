<img width="843" height="363" alt="frag" src="https://github.com/user-attachments/assets/b4a9a1a2-79e6-40b4-9dd7-57e77df4ad23" />

# Fragment

Petits exemples interactifs (HTML / CSS / JS), appelés **fragments**, à intégrer dans les notes de cours par une `<iframe>`.

- **Galerie** : https://tim-montmorency.com/Fragment/
- **Studio** (création et modification) : https://tim-montmorency.com/Fragment/studio/

## Accès

Un compte GitHub avec le rôle **Write** sur le répertoire `tim-montmorency/Fragment` (à demander à un propriétaire de l'organisation).
Dans le studio, **Se connecter avec GitHub** : une seule fois par navigateur.

## Créer ou modifier un fragment

1. Galerie → **Nouveau fragment**, ou clic sur un fragment existant.
2. Écrire le HTML, le CSS et le JS : l'aperçu se met à jour en direct.
3. Bibliothèques (GSAP, Tailwind, Three.js…) et attributs de `<html>` / `<body>` : bouton **Réglages** (engrenage).
4. **Enregistrer** (Cmd/Ctrl + S). Le fragment est en ligne environ une minute plus tard.

Dans le pied de page : **Dupliquer**, **Voir**, **Intégrer**. La suppression se trouve dans Réglages → Fragment.

## Intégrer dans les notes

**Intégrer** → choisir les options → **Copier**, puis coller dans le Markdown :

```html
<iframe src="https://tim-montmorency.com/Fragment/v/?f=gsap-to&onglets=js,resultat" class="aspect-3-2" style="width:100%;border:0" loading="lazy"></iframe>
```

| Paramètre | Effet |
| :--- | :--- |
| `f` | Nom du fragment (obligatoire) |
| `onglets` | Onglets visibles : `html,css,js,resultat` |
| `actif` | Onglet ouvert au départ |
| `disposition` | `onglets`, `cote` (code à côté du résultat) ou `pile` |
| `modifiable=1` | Code modifiable avec aperçu en direct |
| `theme=clair` | Code sur fond clair |
| `numeros=1` | Numéros de ligne |
| `boutons` | `rejouer,ouvrir` ; vide pour les masquer |

Si un fragment est introuvable, l'iframe affiche un simple message : les notes ne sont jamais brisées.

## Bon à savoir

- Le nom d'un fragment (dans l'adresse) est tiré du titre à la création et ne change plus : les iframes en dépendent.
- Chaque enregistrement est un commit : tout reste récupérable dans l'historique.
- Un fragment est un simple dossier `f/<nom>/` (`index.html`, `style.css`, `script.js`) : il peut aussi être modifié dans VS Code,
  puis poussé. Dans ce cas, **Réglages → Fragment → Jeton personnel, répertoire et index… → Reconstruire l'index** met la galerie à jour.
- `avant.js` et `apres.js` (facultatifs, **Réglages → Page**) : code exécuté avant / après `script.js`, jamais affiché dans les onglets
  (mise en place, fonctions utilitaires, etc.).

## Maintenance

- **Connexion GitHub** : GitHub App « Fragment TIM Montmorency » (réglages de l'organisation) et relais Cloudflare
  `fragment-connexion` (`relais/worker.js`, compte Cloudflare TIM). Client ID et adresse du relais : `studio/config.js`.
  Le client secret n'est que dans Cloudflare.
- **Éditeur de code** (CodeMirror) : `cd outils/codemirror && npm install && npm run build`.
- **Formatage** (Prettier, bouton « Formater » du studio) : `cd outils/prettier && npm install && npm run build`
  → `studio/vendor/prettier.js`, chargé seulement au premier formatage.
- **Test local** : servir le dossier (Go Live, ou `python3 -m http.server`).
- Licences : icônes Lucide (ISC), polices Geist (OFL), Prettier (MIT).
