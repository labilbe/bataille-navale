# Bataille navale

Une bataille navale jouable dans le navigateur, en HTML et JavaScript vanilla. Aucun build, aucune dépendance.

▶ **[Jouer](https://labilbe.github.io/bataille-navale/)**

Comme pour [tetris](https://github.com/labilbe/tetris), le moteur de jeu est **pur et déterministe** : il ne touche ni au DOM, ni à l'horloge, ni à `Math.random` — le hasard lui est passé en argument. C'est ce qui permet de le tester sous Node, et de rejouer une partie à l'identique à partir d'une graine.

## Lancer le jeu

Le projet utilise des modules ES : il faut le servir en HTTP, un double-clic sur `index.html` ne suffit pas.

```bash
npm start          # sert le dossier sur http://localhost:1986
```

## Règles

Flotte classique, sur une grille de 10 × 10 :

| Navire | Cases |
| --- | --- |
| Porte-avions | 5 |
| Croiseur | 4 |
| Contre-torpilleur | 3 |
| Sous-marin | 3 |
| Torpilleur | 2 |

Les navires peuvent se toucher mais pas se chevaucher. **Un tir qui touche donne droit à un tir de plus** ; on ne rend la main qu'en tombant à l'eau. La partie s'arrête quand une flotte entière est coulée.

Pendant le placement : clic sur votre grille pour poser le navire en attente, **R** pour basculer horizontal/vertical. Les boutons *Au hasard* et *Tout effacer* évitent de tout poser à la main.

## Les navires

Chaque navire est dessiné deux fois, en SVG (`src/view/silhouettes.js`) : **vu de dessus** sur les grilles, **vu de profil** dans la liste des flottes.

Les deux dessins partagent le même repère, long de 100 unités par case occupée et haut de 100, proue à droite ; le placement et la rotation restent à la charge de la vue. Un navire posé n'est donc pas une suite de cases coloriées mais une silhouette unique, calée sur les cases qu'il occupe — le calcul de position se fait en CSS (`--cell`, `--gap`, `--pad`), ce qui la garde juste à toutes les tailles d'écran.

Le pont est plus sombre que la coque : c'est ce contraste qui fait lire le liston comme un bord, et qui laisse ressortir les superstructures, claires. Les impacts sont portés par les cases, pas par la silhouette, et passent par-dessus sans la masquer. Une épave perd ses dégradés : du charbon, plus de la tôle peinte.

## L'adversaire

L'IA travaille en deux temps (`src/engine/ai.js`) :

- **Ratissage** — tant qu'elle n'a rien touché, elle tire au hasard sur les cases d'un damier. Le plus petit navire occupe deux cases, une case sur deux suffit donc à le trouver, et cela divise par deux le nombre de tirs à l'aveugle.
- **Traque** — au premier impact elle vise les quatre voisines ; dès que deux impacts sont alignés, elle suit l'axe et n'essaie plus que les deux prolongements.

Elle coule une flotte en une soixantaine de tirs, contre une centaine pour un tir purement aléatoire.

## Organisation

```
src/engine/    moteur pur : constantes, grille, IA, réducteur d'état
src/view/      rendu DOM : grilles, tableau de bord des flottes
src/main.js    câblage : DOM + horloge + moteur
test/          tests du moteur, exécutés par node --test
```

Le cœur est un réducteur : `reduce(state, action)` rend un nouvel état, sans effet de bord. `main.js` est le seul module impur.

## Tests

```bash
npm test
```

Ils couvrent le placement, la résolution des tirs, la stratégie de l'IA (qui doit gagner en moins de 80 tirs) et l'enchaînement des tours.

## Licence

MIT.
