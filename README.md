<img width="843" height="363" alt="frag" src="https://github.com/user-attachments/assets/b4a9a1a2-79e6-40b4-9dd7-57e77df4ad23" />

# Fragment

Petits exemples interactifs (HTML / CSS / JS), appelés **fragments**, à intégrer dans les notes de cours par une simple `<iframe>`.
Remplace les embeds CodePen.

Site : `https://tim-montmorency.com/Fragment/`

- **Galerie** (page d'accueil) : tous les fragments, avec recherche et filtre par tag.
- **Studio** (`studio/`) : création et modification des fragments, enregistrement direct dans GitHub.
- Chaque fragment est une page web autonome : n'importe quelle technologie peut y être utilisée (GSAP, Tailwind, Three.js…).
- Une **visionneuse** (`v/`) affiche le code et/ou le résultat selon des paramètres d'URL.
- Le site des notes ne contient qu'une iframe : si un fragment brise, seul le cadre reste vide.

## Structure

```
Fragment/
├── index.html            Galerie des fragments
├── fragments.json        Index de la galerie (titre, tags, date de chaque fragment)
├── f/                    Les fragments, un dossier chacun
│   └── gsap-to/
│       ├── index.html    obligatoire
│       ├── style.css     facultatif
│       ├── script.js     facultatif
│       └── fragment.json titre, tags, dates
├── studio/               Création et modification des fragments
├── v/                    Visionneuse (code + résultat, utilisée dans les iframes)
│   └── vendor/           highlight.js et CodeMirror (auto-hébergés)
├── commun/               Galerie et fenêtre « Intégrer » (partagée galerie / studio)
├── outils/codemirror/    Source du paquet CodeMirror
└── _gabarit/             Point de départ d'un nouveau fragment
```

Les fragments ne sont pas classés en sous-dossiers : le classement se fait avec les **tags** (`web3`, `gsap`…),
et un fragment peut en avoir plusieurs.

Le dossier d'un fragment est nommé automatiquement à partir de son titre, à la création
(« GSAP - to() » → `gsap-to`, puis `gsap-to-2` si le nom est déjà pris). Il ne change plus ensuite,
même si le titre change, parce que les iframes des notes en dépendent (`?ex=gsap-to`).

### fragment.json

```json
{
  "titre": "GSAP - to()",
  "tags": ["web3", "gsap"],
  "cree": "2026-10-28",
  "modifie": "2026-10-28"
}
```

## Galerie

La page d'accueil lit `fragments.json` et affiche une carte par fragment, avec une miniature vivante
(chargée quand la carte devient visible).

- **Recherche** dans le titre et les tags (accents ignorés).
- **Tags** : un clic filtre la galerie ; un deuxième clic retire le filtre.
- Les filtres sont dans l'adresse, donc partageables : `…/Fragment/?tag=web3`, `…/Fragment/?q=scroll`.
- Un **clic sur une carte** ouvre le fragment dans le studio ; **+ Nouveau fragment** en crée un.

## Intégrer un fragment

Le lien **Intégrer**, dans le pied de page du studio, ouvre une fenêtre pour choisir les options de la visionneuse,
voir l'aperçu et copier le code de l'iframe à coller dans le Markdown.
Les dernières options choisies sont mémorisées dans le navigateur et réappliquées à la prochaine ouverture,
pour n'importe quel fragment. **Options par défaut** les réinitialise.

## Ajouter un fragment à la main

Le studio s'en occupe normalement. À la main, dans la copie locale du répertoire :

1. Copier `_gabarit/` vers `f/<nom>/` (lettres, chiffres, `-` et `_` seulement).
2. Écrire le fragment. Les bibliothèques se chargent directement dans `index.html`.
3. Ajouter `f/<nom>/fragment.json` (titre et tags).
4. Pousser, puis dans le studio : **⚙ → Connexion GitHub… → Reconstruire l'index**, pour que la galerie le liste.

L'onglet **HTML** de la visionneuse n'affiche que le contenu de `<body>`, sans les balises `<script src="…">`.
Le paramètre `html=complet` affiche le fichier entier.

## Paramètres de la visionneuse

```
https://<site>/v/?ex=gsap-to&onglets=js,resultat&actif=js
```

| Paramètre | Valeurs | Défaut | Effet |
| :--- | :--- | :--- | :--- |
| `ex` | `gsap-to` | — | Nom du fragment (dossier `f/<nom>/`, obligatoire) |
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
<iframe src="https://<site>/v/?ex=gsap-to&onglets=resultat" class="aspect-3-2" style="width:100%;border:0" loading="lazy"></iframe>

<!-- CSS seulement -->
<iframe src="https://<site>/v/?ex=gsap-to&onglets=css" class="aspect-3-2" style="width:100%;border:0" loading="lazy"></iframe>

<!-- JS à côté du résultat, seulement le bouton Rejouer -->
<iframe src="https://<site>/v/?ex=gsap-to&onglets=js,resultat&disposition=cote&boutons=rejouer" class="aspect-3-2" style="width:100%;border:0" loading="lazy"></iframe>
```

Le résultat démarre seulement quand il devient visible à l'écran (pratique pour les animations).
Le bouton **Rejouer** le relance, **Ouvrir** affiche le fragment seul dans un nouvel onglet
(boutons configurables avec `boutons`).

## Mode modifiable (aperçu en direct)

Avec `modifiable=1`, les onglets de code deviennent des éditeurs (CodeMirror) et le résultat se met à jour
une demi-seconde après la dernière frappe.

```html
<iframe src="https://<site>/v/?ex=gsap-to&onglets=js,resultat&modifiable=1" class="aspect-3-2" style="width:100%;border:0" loading="lazy"></iframe>
```

- Une pastille rouge animée à côté de **Résultat** indique que l'aperçu est en direct.
- Le bouton **Réinitialiser**, toujours présent dans ce mode, revient au code d'origine. Les modifications ne sont pas sauvegardées : un rechargement de la page les efface.
- **Ouvrir** affiche la version modifiée dans un nouvel onglet.
- Les bibliothèques chargées par CDN dans `index.html` continuent de fonctionner. Les chemins relatifs (images, etc.) aussi.
- `numeros=1` affiche aussi les numéros de ligne dans les éditeurs.
- L'éditeur (≈ 560 Ko) n'est chargé qu'en mode modifiable. S'il ne se charge pas, le fragment s'affiche en lecture seule.

### Mettre à jour CodeMirror

Le paquet `v/vendor/codemirror.js` est généré à partir de `outils/codemirror/` :

```bash
cd outils/codemirror
npm install
npm run build
```

## Studio

`https://tim-montmorency.com/Fragment/studio/` — ou `studio/?ex=<nom>` pour ouvrir directement un fragment.

Interface pour créer ou modifier un fragment avec aperçu en direct, puis l'enregistrer dans le répertoire GitHub.

- **Ouvrir un fragment** : clic sur sa carte dans la galerie (adresse `studio/?ex=<nom>`). **+ Nouveau fragment**, dans la galerie, repart du `_gabarit/`.
- **Titre / Tags** : le dossier du nouveau fragment est tiré du titre (voir *Structure*). Les tags sont séparés par des virgules,
  mis en minuscules et dédoublonnés.
- **Bibliothèques** : recherche dans npm, servie par jsDelivr (version exacte, fichier principal choisi automatiquement).
  - **Entrée** ou clic : ajoute le fichier principal du paquet (et sa feuille de style s'il en a une).
  - **Fichiers ▸** (ou flèche droite) : choisir un autre fichier du paquet, par exemple `ScrollTrigger.min.js` dans `gsap`.
  - **+** sur une pastille : ajouter un autre fichier du même paquet, par exemple `themes.css` dans `daisyui`.
  - Une adresse collée (`https://…`) s'ajoute telle quelle.
  - Les fichiers `.css` vont dans `<head>`, les `.js` à la fin du body, les modules ES (`three`, etc.) dans une importmap ; `script.js` passe alors en `type="module"`.
  - Glisser les pastilles pour changer l'ordre de chargement ; × pour retirer.
  - Les autres balises déjà présentes dans un fragment sont conservées.
- **⚙ Réglages du fragment** :
  - **Dupliquer** : crée un nouveau fragment à partir de celui-ci.
  - **Supprimer…** : un commit retire le dossier du fragment et son entrée de l'index. Les iframes qui l'intègrent
    affichent alors « Fragment introuvable ». Le fragment reste récupérable dans l'historique Git.
  - **Connexion GitHub…** : jeton, test, reconstruction de l'index.
  - Attributs de `<html>` et `<body>` : par exemple `data-theme="dark"` pour daisyUI, ou `class="…"` sur le body. `lang="fr"` est ajouté automatiquement, sauf si un autre `lang` est indiqué.
- **↻ Rejouer**, dans la barre du résultat : relance le fragment (animations, scripts) sans attendre une modification.
- **Pied de page** (fragment enregistré) : **Voir ↗** ouvre la visionneuse, **Intégrer** ouvre la fenêtre d'intégration.
- **Onglet HTML** : seulement le contenu de `<body>`. Le reste de `index.html` est généré.
- **Enregistrer** (ou Cmd/Ctrl + S) : un seul commit avec les fichiers du fragment, son `fragment.json` et l'index `fragments.json`.
  La confirmation s'affiche dans le pied de page. GitHub Pages republie ensuite le site (environ une minute) :
  le studio vérifie la publication et affiche **en ligne ✓** quand elle est terminée. Pendant ce temps, la fenêtre
  **Intégrer** le signale et son aperçu se recharge tout seul une fois le fragment en ligne.
  En local (Go Live), ce suivi est désactivé : faire un `git pull` pour voir le fragment.
- **⚙ → Connexion GitHub… → Reconstruire l'index** : recrée `fragments.json` à partir des dossiers `f/`, après des ajouts ou suppressions faits à la main.

### Jeton GitHub (une seule fois par navigateur)

1. GitHub → *Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token*.
2. *Resource owner* : `tim-montmorency`. *Repository access* : **Only select repositories** → `Fragment`.
3. *Permissions → Repository permissions → Contents* : **Read and write**.
4. Copier le jeton dans le studio (**⚙ → Connexion GitHub…**), puis **Tester**.

Le jeton est conservé dans le navigateur (localStorage) : pas besoin de le saisir à nouveau. Chaque adresse a sa propre mémoire
(le site publié et une copie locale avec Go Live, par exemple), et une fenêtre de navigation privée ne le garde pas.
Dans ⚙, le lien devient **Connexion GitHub ✓** quand un jeton est enregistré.
Sur un ordinateur partagé, utiliser **Oublier le jeton** à la fin.
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
