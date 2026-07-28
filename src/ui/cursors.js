// Curseurs personnalisés, dessinés en SVG inline (aucun asset binaire).
// Valeurs prêtes pour CSS `cursor` / Phaser `input.setDefaultCursor`.
//
// - épée dorée pour les menus (pointe = point actif, en haut à gauche)
// - réticule braise pour l'arène (point actif au centre)

const svgCursor = (svg, hotX, hotY, fallback) =>
  `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${hotX} ${hotY}, ${fallback}`;

const SWORD_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
<path d="M3 2 L9 3.5 L19.5 14 L15.5 18 L5 7.5 Z" fill="#e5d7b4" stroke="#1e1509" stroke-width="1.4" stroke-linejoin="round"/>
<path d="M14.5 20.5 L22 13 L24 15 L16.5 22.5 Z" fill="#c9a24a" stroke="#1e1509" stroke-width="1.4" stroke-linejoin="round"/>
<path d="M19 20 L23.5 24.5" stroke="#6d4a2a" stroke-width="3.4" stroke-linecap="round"/>
<circle cx="24.5" cy="25.5" r="1.9" fill="#c9a24a" stroke="#1e1509" stroke-width="1"/>
</svg>`;

const CROSSHAIR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
<circle cx="14" cy="14" r="8.5" fill="none" stroke="#1e1509" stroke-width="3.4"/>
<circle cx="14" cy="14" r="8.5" fill="none" stroke="#ffd080" stroke-width="1.6"/>
<g stroke="#1e1509" stroke-width="3.2" stroke-linecap="round">
<path d="M14 2.5 V7"/><path d="M14 21 V25.5"/><path d="M2.5 14 H7"/><path d="M21 14 H25.5"/>
</g>
<g stroke="#ffd080" stroke-width="1.6" stroke-linecap="round">
<path d="M14 2.5 V7"/><path d="M14 21 V25.5"/><path d="M2.5 14 H7"/><path d="M21 14 H25.5"/>
</g>
<circle cx="14" cy="14" r="1.7" fill="#ff4d1f"/>
</svg>`;

export const SWORD_CURSOR = svgCursor(SWORD_SVG, 3, 2, 'auto');
export const CROSSHAIR_CURSOR = svgCursor(CROSSHAIR_SVG, 14, 14, 'crosshair');
