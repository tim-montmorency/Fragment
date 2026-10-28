<img width="843" height="363" alt="frag" src="https://github.com/user-attachments/assets/b4a9a1a2-79e6-40b4-9dd7-57e77df4ad23" />

# Fragment

Exemples interactifs (HTML / CSS / JS) à intégrer dans les notes de cours par une simple `<iframe>`.
Remplace les embeds CodePen.

- Chaque exemple est une page web autonome : n'importe quelle technologie peut y être utilisée (GSAP, Tailwind, Three.js…).
- Une **visionneuse** (`v/`) affiche le code et/ou le résultat selon des paramètres d'URL.
- Le site des notes ne contient qu'une iframe : si un exemple brise, seul le cadre reste vide.

## Structure

```
Fragment/
├── index.html            Constructeur d'intégration (génère le code de l'iframe)
├── studio/               Création et modification d'exemples (enregistre sur GitHub)
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

Deux façons de faire :

- **Avec le studio** (`studio/`), directement sur le site publié. Voir plus bas.
- **À la main**, dans la copie locale du répertoire :

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

## Studio

`https://tim-montmorency.github.io/Fragment/studio/`

Interface pour créer ou modifier un exemple avec aperçu en direct, puis l'enregistrer dans le répertoire GitHub.

- **Exemple** : « Nouvel exemple » part du `_gabarit/`. Les exemples existants sont listés à partir du répertoire GitHub.
- **Cours / Nom du dossier / Titre** : l'exemple est enregistré dans `<cours>/<nom>/`. Changer le nom d'un exemple ouvert crée une copie.
- **Bibliothèques** : recherche dans npm, servie par jsDelivr (version exacte, fichier principal choisi automatiquement).
  - **Entrée** ou clic : ajoute le fichier principal du paquet (et sa feuille de style s'il en a une).
  - **Fichiers ▸** (ou flèche droite) : choisir un autre fichier du paquet, par exemple `ScrollTrigger.min.js` dans `gsap`.
  - Une adresse collée (`https://…`) s'ajoute telle quelle.
  - Les fichiers `.css` vont dans `<head>`, les `.js` à la fin du body, les modules ES (`three`, etc.) dans une importmap ; `script.js` passe alors en `type="module"`.
  - Glisser les pastilles pour changer l'ordre de chargement ; × pour retirer.
  - Les autres balises déjà présentes dans un exemple sont conservées.
- **Onglet HTML** : seulement le contenu de `<body>`. Le reste de `index.html` est généré.
- **Enregistrer** (ou Cmd/Ctrl + S) : un seul commit avec `index.html`, `style.css` et `script.js`. GitHub Pages republie le site en moins d'une minute environ.

### Jeton GitHub (une seule fois par navigateur)

1. GitHub → *Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token*.
2. *Resource owner* : `tim-montmorency`. *Repository access* : **Only select repositories** → `Fragment`.
3. *Permissions → Repository permissions → Contents* : **Read and write**.
4. Copier le jeton dans les réglages du studio (⚙), puis **Tester**.

Le jeton reste dans le navigateur seulement (localStorage). Sur un ordinateur partagé, utiliser **Oublier le jeton** à la fin.
Après un enregistrement par le studio, faire un `git pull` dans la copie locale.

## Tester en local

La visionneuse lit les fichiers avec `fetch()`, ce qui ne fonctionne pas en ouvrant les fichiers directement (`file://`).
Un petit serveur local suffit :

```bash
npx serve .
# ou : python3 -m http.server
```

Live Server (Go Live) dans VS Code fonctionne aussi, en ouvrant le dossier `Fragment` lui-même.
Le script qu'il injecte dans les pages est retiré automatiquement de l'onglet HTML.

## Publication avec GitHub Pages

1. Pousser le répertoire sur GitHub.
2. *Settings → Pages → Build and deployment* : source **Deploy from a branch**, branche `main`, dossier `/ (root)`.
3. Le site est publié à `https://<compte>.github.io/<répertoire>/`.

Le fichier `.nojekyll` empêche GitHub d'ignorer les dossiers qui commencent par `_` (comme `_gabarit/`).
