/**
 * Les silhouettes des navires, en SVG.
 *
 * Chaque navire est dessine deux fois : vu de dessus pour la grille, vu de
 * profil pour la liste des flottes. Les deux dessins partagent le meme repere,
 * long de 100 unites par case occupee et haut de 100, proue a droite. Le
 * placement et la rotation sont l'affaire de l'appelant : ici on ne fait que
 * des traits.
 *
 * Les aplats sont evites : coques, ponts et superstructures prennent leurs
 * teintes dans des degrades declares une fois pour toutes par `mountDefs`, ce
 * qui donne aux coques un peu de galbe. Les epaves, elles, sont volontairement
 * plates — c'est du charbon, plus de la tole peinte.
 */

import { HORIZONTAL } from '../engine/constants.js';

/**
 * Les degrades, poses une fois dans la page. Toutes les silhouettes y
 * renvoient : une seule declaration pour les dizaines de dessins a l'ecran.
 */
export function mountDefs(parent) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'defs');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = `
    <defs>
      <linearGradient id="nav-hull" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#dae4ec"/>
        <stop offset="0.35" stop-color="#b4c5d2"/>
        <stop offset="0.78" stop-color="#8397a9"/>
        <stop offset="1" stop-color="#63788c"/>
      </linearGradient>
      <linearGradient id="nav-deck" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#46596b"/>
        <stop offset="0.55" stop-color="#364757"/>
        <stop offset="1" stop-color="#253442"/>
      </linearGradient>
      <linearGradient id="nav-tower" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#cfdae3"/>
        <stop offset="0.6" stop-color="#9fb3c3"/>
        <stop offset="1" stop-color="#75899c"/>
      </linearGradient>
      <linearGradient id="nav-side-hull" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#b9c9d6"/>
        <stop offset="0.55" stop-color="#8b9fb0"/>
        <stop offset="1" stop-color="#4f6376"/>
      </linearGradient>
    </defs>`;
  parent.append(svg);
}

/**
 * Une coque vue de dessus : un corps parallele, une etrave qui s'effile a
 * droite et une poupe arrondie a gauche. `beam` est la demi-largeur.
 */
function hull(length, beam, stern = 4) {
  const top = 50 - beam;
  const bottom = 50 + beam;
  const shoulder = stern + length * 0.58;
  const bow = length - 3;
  return `M ${stern + 16} ${top}
    H ${shoulder}
    C ${stern + length * 0.8} ${top + beam * 0.06} ${bow - length * 0.09} ${50 - beam * 0.42} ${bow} 50
    C ${bow - length * 0.09} ${50 + beam * 0.42} ${stern + length * 0.8} ${bottom - beam * 0.06} ${shoulder} ${bottom}
    H ${stern + 16}
    C ${stern + 5} ${bottom} ${stern} ${50 + beam * 0.6} ${stern} 50
    C ${stern} ${50 - beam * 0.6} ${stern + 5} ${top} ${stern + 16} ${top} Z`;
}

/** Le liston clair qui court le long du pont, pour poser la lumiere. */
const sheer = (length, beam, stern = 4) => `<path class="mark" d="${hull(length, beam - 7, stern + 6)}"
  fill="none" stroke="rgba(255,255,255,0.32)" stroke-width="3"/>`;

/**
 * Une tourelle vue de dessus : la barbette, et deux canons fins. Des tubes
 * epais donneraient des moignons, illisibles a la taille d'une case.
 */
function turret(x, r, reach) {
  const len = Math.abs(reach);
  const from = reach > 0 ? x : x - len;
  const tube = (y) => `<rect class="mast" x="${from}" y="${y}" width="${len}" height="3.6" rx="1.8"/>`;
  return `<circle class="tower" cx="${x}" cy="50" r="${r}"/>`
    + tube(50 - r * 0.42 - 1.8) + tube(50 + r * 0.42 - 1.8);
}

/** Une cheminee vue de dessus : un ovale coiffe d'un jonc clair. */
const funnel = (x, rx, ry) => `<ellipse class="tower" cx="${x}" cy="50" rx="${rx}" ry="${ry}"/>`
  + `<ellipse cx="${x}" cy="50" rx="${rx * 0.55}" ry="${ry * 0.55}" fill="none"`
  + ` stroke="rgba(255,255,255,0.3)" stroke-width="2.4"/>`;

const TOP = {
  'porte-avions': () => `
    ${/* Le pont d'envol, vu du ciel. Ce qui fait reconnaitre un porte-avions
          d'en haut, c'est son contour dissymetrique : la piste oblique
          deborde a babord sur toute la partie arriere, et l'etrave est
          franche, pas effilee. Les marquages viennent apres. */ ''}
    <path class="hull" d="M20 19 H118 L150 3 H330 L356 13 H462
      C477 13 487 24 487 40 V62 C487 78 477 87 462 87 H20 Z"/>
    <path class="deck" d="M28 27 H124 L155 11 H328 L352 21 H460
      C471 21 479 30 479 41 V61 C479 72 471 79 460 79 H28 Z"/>
    ${/* La piste d'appontage : deux lignes de bord, un axe en pointilles,
          trois brins d'arret en travers. */ ''}
    <g class="mark" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="3">
      <path d="M45 49 L317 13"/>
      <path d="M47 71 L319 35"/>
    </g>
    <path class="mark" d="M46 60 L318 24" stroke="rgba(255,255,255,0.8)" stroke-width="4.5"
      stroke-dasharray="22 20" fill="none"/>
    <g class="mark" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="2.4">
      <path d="M69 46 L71 68"/>
      <path d="M91 43 L93 65"/>
      <path d="M113 40 L115 62"/>
    </g>
    ${/* Les deux catapultes, vers l'etrave. */ ''}
    <g class="mark" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="3">
      <path d="M300 32 H462"/>
      <path d="M286 62 H462"/>
    </g>
    ${/* Les ascenseurs de bord, en saillie de part et d'autre. */ ''}
    <rect class="hull" x="346" y="76" width="58" height="16" rx="2"/>
    <rect class="hull" x="368" y="1" width="54" height="15" rx="2"/>
    ${/* L'ilot, pose a tribord : passerelle, cheminee, radar. */ ''}
    <path class="tower" d="M228 55 H306 C312 55 314 58 314 63 V72 C314 77 311 79 306 79 H228
      C223 79 220 76 220 71 V63 C220 58 223 55 228 55 Z"/>
    <rect class="mast" x="238" y="61" width="15" height="12" rx="3"/>
    <circle class="mast" cx="282" cy="67" r="6.5"/>
    <path class="mark" d="M272 57 H302" stroke="rgba(255,255,255,0.5)" stroke-width="3" fill="none"/>`,

  croiseur: () => `
    <path class="hull" d="${hull(400, 31)}"/>
    <path class="deck" d="${hull(400, 23, 13)}"/>
    ${sheer(400, 31)}
    ${turret(318, 14, 36)}
    ${turret(272, 15, 30)}
    ${/* La passerelle : un bloc qui s'effile vers l'avant, mat compris. */ ''}
    <path class="tower" d="M172 30 H222 L240 40 V60 L222 70 H172 C167 70 164 66 164 61 V39 C164 34 167 30 172 30 Z"/>
    <rect class="mark" x="196" y="42" width="30" height="16" rx="4" opacity="0.3"/>
    <circle class="mast" cx="180" cy="50" r="7"/>
    ${funnel(143, 10, 14)}
    ${funnel(111, 9, 13)}
    <rect class="tower" x="66" y="37" width="30" height="26" rx="6"/>
    <rect class="mark" x="72" y="43" width="18" height="14" rx="3" opacity="0.3"/>
    ${turret(40, 14, -30)}`,

  'contre-torpilleur': () => `
    <path class="hull" d="${hull(300, 26)}"/>
    <path class="deck" d="${hull(300, 19, 11)}"/>
    ${sheer(300, 26)}
    ${turret(224, 12, 28)}
    <path class="tower" d="M146 34 H182 L196 42 V58 L182 66 H146 C141 66 138 62 138 57 V43 C138 38 141 34 146 34 Z"/>
    <circle class="mast" cx="154" cy="50" r="6"/>
    ${funnel(117, 8, 11)}
    ${/* Les tubes lance-torpilles, en travers du pont. */ ''}
    <rect class="tower" x="74" y="38" width="32" height="24" rx="5"/>
    <rect class="mark" x="70" y="43" width="40" height="4" rx="2" opacity="0.45"/>
    <rect class="mark" x="70" y="53" width="40" height="4" rx="2" opacity="0.45"/>
    ${turret(38, 12, -24)}`,

  'sous-marin': () => `
    ${/* Une coque en cigare : ni etrave marquee, ni superstructure. */ ''}
    <path class="hull" d="M62 18 H232 C270 18 300 32 304 50 C300 68 270 82 232 82 H62 C26 82 6 68 6 50 C6 32 26 18 62 18 Z"/>
    <path class="deck" d="M64 30 H230 C256 30 278 39 282 50 C278 61 256 70 230 70 H64 C38 70 22 61 22 50 C22 39 38 30 64 30 Z"/>
    ${/* Les barres de plongee avant, de part et d'autre. */ ''}
    <rect class="tower" x="206" y="10" width="40" height="10" rx="5"/>
    <rect class="tower" x="206" y="80" width="40" height="10" rx="5"/>
    ${/* Le kiosque, son periscope, et la derive arriere. */ ''}
    <rect class="tower" x="132" y="30" width="54" height="40" rx="14"/>
    <circle class="mast" cx="150" cy="50" r="7"/>
    <rect class="mark" x="164" y="46" width="16" height="8" rx="4" opacity="0.4"/>
    <path class="tower" d="M30 34 L4 22 V78 L30 66 Z"/>`,

  torpilleur: () => `
    <path class="hull" d="${hull(200, 24)}"/>
    <path class="deck" d="${hull(200, 17, 10)}"/>
    ${sheer(200, 24)}
    ${turret(140, 11, 22)}
    <path class="tower" d="M82 36 H106 L118 43 V57 L106 64 H82 C77 64 74 60 74 56 V44 C74 40 77 36 82 36 Z"/>
    <circle class="mast" cx="88" cy="50" r="5"/>
    ${funnel(56, 7, 10)}
    <rect class="tower" x="18" y="39" width="26" height="22" rx="5"/>
    <rect class="mark" x="14" y="44" width="34" height="4" rx="2" opacity="0.45"/>
    <rect class="mark" x="14" y="53" width="34" height="4" rx="2" opacity="0.45"/>`,
};

/** Une piece d'artillerie vue de profil : socle, coupole et canon pointe. */
function gun(x, deck, scale, reach) {
  const w = 13 * scale;
  const h = 9 * scale;
  const dir = Math.sign(reach);
  return `<path class="tower" d="M${x - w} ${deck} V${deck - h} C${x - w} ${deck - h - 5 * scale} ${x - w * 0.5} ${deck - h - 7 * scale} ${x} ${deck - h - 7 * scale}
      C${x + w * 0.5} ${deck - h - 7 * scale} ${x + w} ${deck - h - 5 * scale} ${x + w} ${deck - h} V${deck} Z"/>
    <rect class="mast" x="${dir > 0 ? x : x + reach}" y="${deck - h - 5 * scale}" width="${Math.abs(reach)}" height="${3.4 * scale}" rx="${1.7 * scale}"/>`;
}

/** Une cheminee vue de profil : legerement conique, coiffee d'un chapeau. */
const stack = (x, top, deck, w) => `<path class="tower" d="M${x - w * 0.42} ${deck} L${x - w * 0.5} ${top + 4} H${x + w * 0.5} L${x + w * 0.42} ${deck} Z"/>`
  + `<rect class="mast" x="${x - w * 0.62}" y="${top}" width="${w * 1.24}" height="5" rx="2.5"/>`;

const SIDE = {
  'porte-avions': () => `
    ${/* Le pont d'envol, une dalle qui deborde largement la coque. */ ''}
    <path class="hull" d="M40 62 H424 C452 64 476 70 492 78 C470 86 440 90 404 90 H108 C76 88 52 78 40 62 Z"/>
    <path class="deck" d="M8 48 H486 C492 48 496 51 496 55 V60 C496 63 492 66 486 66 H8 C4 66 2 63 2 59 V55 C2 51 4 48 8 48 Z"/>
    <rect class="mark" x="26" y="53" width="446" height="4" rx="2" opacity="0.4"/>
    ${/* L'ilot : passerelle, cheminee integree, mat radar. */ ''}
    <path class="tower" d="M238 48 V24 C238 19 242 16 248 16 H292 C298 16 300 20 300 25 V48 Z"/>
    <rect class="mast" x="248" y="6" width="6" height="12" rx="3"/>
    <rect class="mast" x="262" y="0" width="5" height="18" rx="2.5"/>
    <rect class="mark" x="272" y="8" width="26" height="4" rx="2" opacity="0.7"/>
    <rect class="mast" x="278" y="20" width="18" height="10" rx="3"/>
    ${/* La ligne de flottaison. */ ''}
    <path class="mark" d="M92 82 H430" stroke="rgba(0,0,0,0.35)" stroke-width="6" fill="none"/>`,

  croiseur: () => `
    <path class="hull" d="M14 56 H322 C348 58 372 62 394 68 C374 82 344 88 306 88 H80 C48 84 24 72 14 56 Z"/>
    <path class="deck" d="M14 56 H322 C336 57 348 58 358 60 H20 Z" opacity="0.8"/>
    <path class="mark" d="M60 78 H350" stroke="rgba(0,0,0,0.32)" stroke-width="7" fill="none"/>
    ${gun(316, 56, 1, 30)}
    ${gun(268, 56, 1.15, 26)}
    ${/* Passerelle en gradins, mat tripode, deux cheminees. */ ''}
    <path class="tower" d="M172 56 V34 C172 29 176 26 182 26 H214 C220 26 222 30 222 35 V56 Z"/>
    <path class="tower" d="M186 26 V16 C186 12 189 10 193 10 H205 C209 10 211 13 211 17 V26 Z"/>
    <rect class="mast" x="196" y="0" width="5" height="12" rx="2.5"/>
    <rect class="mark" x="176" y="14" width="10" height="4" rx="2" opacity="0.7"/>
    ${stack(148, 20, 56, 24)}
    ${stack(112, 26, 56, 21)}
    <rect class="tower" x="62" y="44" width="34" height="12" rx="4"/>
    <rect class="mast" x="70" y="30" width="4" height="14" rx="2"/>
    ${gun(38, 56, 1, -26)}`,

  'contre-torpilleur': () => `
    <path class="hull" d="M12 60 H224 C250 62 272 66 292 72 C272 84 244 88 210 88 H66 C38 84 20 74 12 60 Z"/>
    <path class="deck" d="M12 60 H224 C238 61 248 62 258 64 H18 Z" opacity="0.8"/>
    <path class="mark" d="M50 80 H250" stroke="rgba(0,0,0,0.32)" stroke-width="6" fill="none"/>
    ${gun(224, 60, 0.95, 26)}
    <path class="tower" d="M142 60 V40 C142 35 146 32 152 32 H182 C188 32 190 36 190 41 V60 Z"/>
    <path class="tower" d="M154 32 V22 C154 18 157 16 161 16 H172 C176 16 178 19 178 23 V32 Z"/>
    <rect class="mast" x="163" y="2" width="4" height="16" rx="2"/>
    ${stack(118, 28, 60, 19)}
    <rect class="tower" x="76" y="48" width="32" height="12" rx="4"/>
    <rect class="mast" x="72" y="44" width="40" height="4" rx="2"/>
    <rect class="tower" x="52" y="46" width="16" height="14" rx="4"/>
    ${gun(32, 60, 0.9, -22)}`,

  'sous-marin': () => `
    ${/* A demi emerge : le pont affleure, le reste est sous l'eau. */ ''}
    <path class="hull" d="M14 58 C14 48 36 42 70 42 H244 C272 44 292 50 298 60 C286 76 258 84 222 84 H74 C40 80 14 70 14 58 Z"/>
    <path class="deck" d="M40 48 H262 C272 50 278 52 282 54 H44 Z" opacity="0.8"/>
    <path class="mark" d="M46 70 H262" stroke="rgba(0,0,0,0.3)" stroke-width="7" fill="none"/>
    ${/* Le kiosque, ses periscopes et les barres de plongee avant. */ ''}
    <path class="tower" d="M134 44 V20 C134 14 139 11 146 11 H176 C183 11 186 15 186 21 V44 Z"/>
    <rect class="mast" x="150" y="0" width="5" height="12" rx="2.5"/>
    <rect class="mast" x="164" y="3" width="4" height="9" rx="2"/>
    <rect class="mast" x="190" y="30" width="26" height="5" rx="2.5"/>
    <path class="tower" d="M30 50 L6 38 V66 L30 62 Z"/>`,

  torpilleur: () => `
    <path class="hull" d="M10 62 H128 C152 64 172 68 190 74 C172 84 148 88 118 88 H58 C32 84 16 74 10 62 Z"/>
    <path class="deck" d="M10 62 H128 C140 63 148 64 156 66 H16 Z" opacity="0.8"/>
    <path class="mark" d="M40 80 H160" stroke="rgba(0,0,0,0.3)" stroke-width="6" fill="none"/>
    ${gun(132, 62, 0.85, 22)}
    <path class="tower" d="M74 62 V44 C74 39 78 36 84 36 H104 C110 36 112 40 112 45 V62 Z"/>
    <rect class="mast" x="88" y="14" width="4" height="22" rx="2"/>
    ${stack(56, 34, 62, 16)}
    <rect class="tower" x="22" y="52" width="26" height="10" rx="3"/>
    <rect class="mast" x="18" y="48" width="34" height="4" rx="2"/>`,
};

/**
 * La vue de dessus, calee sur `size` cases : proue a droite a l'horizontale,
 * vers le bas a la verticale.
 */
export function topView(id, size, dir) {
  const length = size * 100;
  const art = TOP[id]();
  if (dir === HORIZONTAL) {
    return `<svg class="art" viewBox="0 0 ${length} 100" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${art}</svg>`;
  }
  // Un quart de tour : le point (x, y) du dessin se retrouve en (100 - y, x).
  return `<svg class="art" viewBox="0 0 100 ${length}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">`
    + `<g transform="translate(100 0) rotate(90)">${art}</g></svg>`;
}

/** La vue de profil, pour la liste des flottes. */
export function sideView(id, size) {
  return `<svg class="art side" viewBox="0 0 ${size * 100} 100" preserveAspectRatio="xMidYMid meet" aria-hidden="true">`
    + `${SIDE[id]()}</svg>`;
}
