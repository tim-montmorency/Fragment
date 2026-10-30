// Thèmes « GitHub Dark » et « GitHub Light » pour CodeMirror 6.
// Mêmes couleurs que github-dark.css / github.css de highlight.js (code en lecture seule de la visionneuse),
// pour que le code modifiable et le code affiché aient la même coloration.
import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { cssLanguage } from "@codemirror/lang-css";

const PALETTES = {
  sombre: {
    fond: "#0d1117", texte: "#c9d1d9", attenue: "#6e7681", bordure: "#30363d",
    selection: "rgba(56, 139, 253, 0.3)", ligne: "rgba(110, 118, 129, 0.1)", popup: "#161b22", choix: "rgba(56, 139, 253, 0.25)",
    motCle: "#ff7b72", titre: "#d2a8ff", attribut: "#79c0ff", chaine: "#a5d6ff",
    integre: "#ffa657", commentaire: "#8b949e", balise: "#7ee787",
  },
  clair: {
    fond: "#ffffff", texte: "#24292f", attenue: "#8c959f", bordure: "#d0d7de",
    selection: "rgba(84, 174, 255, 0.3)", ligne: "#f6f8fa", popup: "#ffffff", choix: "rgba(84, 174, 255, 0.2)",
    motCle: "#d73a49", titre: "#6f42c1", attribut: "#005cc5", chaine: "#032f62",
    integre: "#e36209", commentaire: "#6a737d", balise: "#22863a",
  },
};

function creer(nom) {
  const c = PALETTES[nom];
  const sombre = nom === "sombre";

  const apparence = EditorView.theme({
    "&": { color: c.texte, backgroundColor: c.fond },
    ".cm-content": { caretColor: c.texte },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: c.texte },
    "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
      { backgroundColor: c.selection },
    ".cm-activeLine": { backgroundColor: c.ligne },
    ".cm-selectionMatch": { backgroundColor: c.choix },
    "&.cm-focused .cm-matchingBracket": { backgroundColor: c.choix, outline: "none" },
    ".cm-gutters": { backgroundColor: c.fond, color: c.attenue, border: "none" },
    ".cm-activeLineGutter": { backgroundColor: "transparent", color: c.texte },
    ".cm-foldPlaceholder": { backgroundColor: "transparent", border: "none", color: c.attenue },
    ".cm-tooltip": { backgroundColor: c.popup, color: c.texte, border: `1px solid ${c.bordure}`, borderRadius: "6px" },
    ".cm-tooltip-autocomplete > ul > li[aria-selected]": { backgroundColor: c.choix, color: c.texte },
    ".cm-panels": { backgroundColor: c.popup, color: c.texte },
    ".cm-searchMatch": { backgroundColor: c.choix },
  }, { dark: sombre });

  const coloration = HighlightStyle.define([
    { tag: [t.keyword, t.controlKeyword, t.moduleKeyword, t.operatorKeyword, t.definitionKeyword,
            t.modifier, t.self, t.typeName, t.invalid], color: c.motCle },
    { tag: [t.function(t.variableName), t.function(t.propertyName), t.definition(t.className),
            t.definition(t.function(t.variableName))], color: c.titre },
    { tag: [t.attributeName, t.definition(t.propertyName), t.number, t.bool, t.null, t.atom,
            t.className, t.documentMeta, t.processingInstruction, t.unit, t.color], color: c.attribut },
    { tag: [t.string, t.special(t.string), t.regexp, t.attributeValue], color: c.chaine },
    { tag: [t.standard(t.variableName), t.special(t.variableName)], color: c.integre },
    { tag: [t.comment, t.lineComment, t.blockComment], color: c.commentaire },
    { tag: [t.tagName, t.constant(t.className), t.heading], color: c.balise },
    { tag: t.strong, fontWeight: "bold" },
    { tag: t.emphasis, fontStyle: "italic" },
    { tag: t.link, textDecoration: "underline" },
  ]);

  // CSS : noms de propriétés en bleu (comme highlight.js), valeurs-mots (flex, center…) en couleur de texte
  const colorationCss = HighlightStyle.define([
    { tag: t.propertyName, color: c.attribut },
    { tag: t.atom, color: c.texte },
  ], { scope: cssLanguage });

  return [apparence, syntaxHighlighting(colorationCss), syntaxHighlighting(coloration)];
}

export const githubSombre = creer("sombre");
export const githubClair = creer("clair");
