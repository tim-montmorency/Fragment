# Aperçu

Exemples interactifs (HTML / CSS / JS) à intégrer dans les notes de cours par une simple `<iframe>`.
Remplace les embeds CodePen.

- Chaque exemple est une page web autonome : n'importe quelle technologie peut y être utilisée (GSAP, Tailwind, Three.js…).
- Une **visionneuse** (`v/`) affiche le code et/ou le résultat selon des paramètres d'URL.
- Le site des notes ne contient qu'une iframe : si un exemple brise, seul le cadre reste vide.

## Structure

```
apercu/
├── index.html            Constructeur d'intégration (génère le code de l'iframe)
├── v/                    Visionneuse
│   ├── index.html
│   ├── visionneuse.js
│   ├── visionneuse.css
│   └── vendor/           highlight.js et CodeMirror (auto-hébergés)
├── outils/codemirror/    Source du paquet CodeMirror
├── _gabarit/             Point de départ d'un nouvel exemple
└── web3/
    └── gsap-to/          Un exemple = un dossier
        ├── index.html    obligatoire
        ├── style.css     facultatif
        └── script.js     facultatif
```

## Ajouter un exemple

1. Copier `_gabarit/` vers `<cours>/<nom-exemple>/` (lettres, chiffres, `-` et `_` seulement).
2. Écrire l'exemple. Les bibliothèques se chargent directement dans `index.html`.
3. Ouvrir `index.html` à la racine du site pour générer le code de l'iframe.

L'onglet **HTML** n'affiche que le contenu de `<body>`, sans les balises `<script src="…">`.
Le paramètre `html=complet` affiche le fichier entier.

## Paramètres de la visionneuse

```
https://<site>/v/?ex=web3/gsap-to&onglets=js,resultat&actif=js
```

| Paramètre | Valeurs | Défaut | Effet |
| :--- | :--- | :--- | :--- |
| `ex` | `web3/gsap-to` | — | Dossier de l'exemple (obligatoire) |
| `onglets` | `html,css,js,resultat` | les quatre | Onglets visibles, dans l'ordre indiqué |
| `actif` | `html`, `css`, `js`, `resultat` | le premier | Onglet ouvert au chargement |
| `disposition` | `onglets`, `cote`, `pile` | `onglets` | Tout en onglets, code à côté du résultat, ou code au-dessus |
| `theme` | `sombre`, `clair` | `sombre` | Thème du code |
| `numeros` | `1` | — | Numéros de ligne |
| `html` | `corps`, `complet` | `corps` | Partie du HTML affichée |
| `modifiable` | `1` | — | Éditeurs de code + aperçu en direct (voir plus bas) |
| `boutons` | `rejouer,ouvrir` | les deux | Boutons affichés. `boutons=` (vide) les masque |

Par défaut, la disposition est `onglets`, ou `cote` en mode modifiable.

### Exemples

```html
<!-- Résultat seulement -->
<iframe src="https://<site>/v/?ex=web3/gsap-to&onglets=resultat" class="aspect-3-2" style="width:100%;border:0" loading="lazy"></iframe>

<!-- CSS seulement -->
<iframe src="https://<site>/v/?ex=web3/gsap-to&onglets=css" class="aspect-3-2" style="width:100%;border:0" loading="lazy"></iframe>

<!-- JS à côté du résultat, seulement le bouton Rejouer -->
<iframe src="https://<site>/v/?ex=web3/gsap-to&onglets=js,resultat&disposition=cote&boutons=rejouer" class="aspect-3-2" style="width:100%;border:0" loading="lazy"></iframe>
```

Le résultat démarre seulement quand il devient visible à l'écran (pratique pour les animations).
Le bouton **Rejouer** le relance, **Ouvrir** affiche l'exemple seul dans un nouvel onglet
(boutons configurables avec `boutons`).

## Mode modifiable (aperçu en direct)

Avec `modifiable=1`, les onglets de code deviennent des éditeurs (CodeMirror) et le résultat se met à jour
une demi-seconde après la dernière frappe.

```html
<iframe src="https://<site>/v/?ex=web3/gsap-to&onglets=js,resultat&modifiable=1" class="aspect-3-2" style="width:100%;border:0" loading="lazy"></iframe>
```

- Une pastille rouge animée à côté de **Résultat** indique que l'aperçu est en direct.
- Le bouton **Réinitialiser**, toujours présent dans ce mode, revient au code d'origine. Les modifications ne sont pas sauvegardées : un rechargement de la page les efface.
- **Ouvrir** affiche la version modifiée dans un nouvel onglet.
- Les bibliothèques chargées par CDN dans `index.html` continuent de fonctionner. Les chemins relatifs (images, etc.) aussi.
- `numeros=1` affiche aussi les numéros de ligne dans les éditeurs.
- L'éditeur (≈ 560 Ko) n'est chargé qu'en mode modifiable. S'il ne se charge pas, l'exemple s'affiche en lecture seule.

### Mettre à jour CodeMirror

Le paquet `v/vendor/codemirror.js` est généré à partir de `outils/codemirror/` :

```bash
cd outils/codemirror
npm install
npm run build
```

## Tester en local

La visionneuse lit les fichiers avec `fetch()`, ce qui ne fonctionne pas en ouvrant les fichiers directement (`file://`).
Un petit serveur local suffit :

```bash
npx serve .
# ou : python3 -m http.server
```

Live Server (Go Live) dans VS Code fonctionne aussi, en ouvrant le dossier `apercu` lui-même.
Le script qu'il injecte dans les pages est retiré automatiquement de l'onglet HTML.

## Publication avec GitHub Pages

1. Pousser le répertoire sur GitHub.
2. *Settings → Pages → Build and deployment* : source **Deploy from a branch**, branche `main`, dossier `/ (root)`.
3. Le site est publié à `https://<compte>.github.io/<répertoire>/`.

Le fichier `.nojekyll` empêche GitHub d'ignorer les dossiers qui commencent par `_` (comme `_gabarit/`).
