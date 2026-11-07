<h1 align="center">
  <img src="../media/logo.png" alt="" width="120"><br>
  RuTracker Games
</h1>

<p align="center">
  <a href="../../README.md">🇬🇧&nbsp;English</a> •
  <a href="README.uk.md">🇺🇦&nbsp;Українська</a> •
  <a href="README.ru.md">🇷🇺&nbsp;Русский</a> •
  <a href="README.de.md">🇩🇪&nbsp;Deutsch</a> •
  <a href="README.fr.md">🇫🇷&nbsp;Français</a> •
  <a href="README.es.md">🇪🇸&nbsp;Español</a> •
  <a href="README.it.md">🇮🇹&nbsp;Italiano</a> •
  <a href="README.pl.md">🇵🇱&nbsp;Polski</a> •
  <a href="README.pt.md">🇧🇷&nbsp;Português</a> •
  <a href="README.ja.md">🇯🇵&nbsp;日本語</a>
</p>

<h4 align="center">Des captures d’écran et des étiquettes bien pratiques directement dans les listes de jeux de RuTracker — plus besoin d’ouvrir chaque sujet.</h4>

<p align="center">
  <a href="../../LICENSE"><img src="https://img.shields.io/badge/license-GPL--3.0--or--later-blue.svg" alt="Licence : GPL-3.0-or-later"></a>
  <a href="../../CHANGELOG.md"><img src="https://img.shields.io/badge/version-1.2.2-green.svg" alt="Version 1.2.2"></a>
  <img src="https://img.shields.io/badge/Chrome-Manifest%20V3-4285F4.svg" alt="Chrome, Manifest V3">
  <img src="https://img.shields.io/badge/UI-10%20languages-orange.svg" alt="10 langues">
  <a href="https://github.com/iArtem88/rutracker-games/actions/workflows/ci.yml"><img src="https://github.com/iArtem88/rutracker-games/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
</p>

<p align="center">
  <img src="../media/screenshot-switch.png" alt="La liste Switch avec les captures, les étiquettes et la barre de filtres" width="900">
</p>

---

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Sections prises en charge](#sections-prises-en-charge)
- [Installation](#installation)
- [Utilisation](#utilisation)
- [Les étiquettes en détail](#les-étiquettes-en-détail)
- [Vos étiquettes et vos mots](#vos-étiquettes-et-vos-mots)
- [Confidentialité](#confidentialité)
- [Respectueuse du site](#respectueuse-du-site)
- [Questions fréquentes](#questions-fréquentes)
- [Contribuer](#contribuer)
- [Développement](#développement)
- [Licence](#licence)

## Fonctionnalités

Directement dans la liste des publications, entre le titre et l’auteur :

- **Des captures d’écran** tirées du spoiler « Скриншоты » de la publication : les mêmes miniatures que dans le sujet. Celles qui portent une loupe s’ouvrent en taille réelle dans la visionneuse de l’extension, sur la page même et sans les publicités de l’hébergeur : ← → ou le bandeau de miniatures en dessous pour passer de l’une à l’autre, Échap pour fermer. Sans loupe, un clic ouvre la page de l’hébergeur. Une seule rangée est affichée, « N de plus » déplie le reste.
- **Dans le sujet d’une publication**, les spoilers de captures s’ouvrent d’eux-mêmes (désactivable dans les réglages), et les captures s’ouvrent dans la même visionneuse.
- **Des étiquettes tirées de la description de la publication :**
  - <img src="https://img.shields.io/badge/-Doublage%20russe-d32f2f" alt="Doublage russe"> — un doublage dans votre langue, avec des précisions entre parenthèses : automatique, amateur, partiel, mod ;
  - <img src="https://img.shields.io/badge/-Texte%20russe%20(sans%20doublage)-2e7d32" alt="Texte russe (sans doublage)"> — le jeu est dans votre langue et n’a tout simplement pas de doublage ;
  - <img src="https://img.shields.io/badge/-Texte%20russe%20(Doublage%20anglais)-fbc02d" alt="Texte russe (Doublage anglais)"> — textes et sous-titres dans votre langue, doublage dans une autre ;
  - <img src="https://img.shields.io/badge/-Overclocking%20requis%20:%204IFIR-6a1b9a" alt="Overclocking requis : 4IFIR"> — s’il faut overclocker la Switch, et si l’overclocking intégré à Kefir suffit ;
  - <img src="https://img.shields.io/badge/-Firmware%205.05+-00695c" alt="Firmware 5.05+"> — le firmware PS4 / PS5 sur lequel le jeu tourne ;
  - <img src="https://img.shields.io/badge/-8%20Go%20de%20RAM%20·%20GTX%201060-455a64" alt="8 Go de RAM · GTX 1060"> — la RAM et la carte graphique minimales pour le PC ;
  - <img src="https://img.shields.io/badge/-Tourne%20sur%20Steam%20Deck-8e24aa" alt="Tourne sur Steam Deck"> — d’après la configuration requise, le jeu devrait tourner sur Steam Deck, et <img src="https://img.shields.io/badge/-Steam%20Deck%20:%20vérifié-1976d2" alt="Steam Deck : vérifié"> est la note officielle de Valve (à activer dans les paramètres).
- **Une barre de filtres** au-dessus de la liste : « Doublage dans mes langues », « Dans mes langues », « Tourne sur ma Switch », « Tourne sur mon firmware », « Assez de RAM dans mon PC », « Tourne sur Steam Deck », ainsi que vos propres étiquettes.
- **Vos langues.** Les étiquettes de doublage et de texte s’affichent pour les langues que vous cochez dans « Mes langues » : anglais, ukrainien, russe, allemand, français, espagnol, italien, polonais, portugais, japonais. Le russe, l’ukrainien et la langue de l’interface sont cochés par défaut. L’interface de l’extension existe elle aussi dans ces 10 langues.
- **Vos étiquettes**, définies par des mots ou une expression régulière, et **vos propres mots** pour l’étiquette d’overclocking de la Switch.

## Sections prises en charge

L’extension fonctionne dans les listes des sections de jeux de RuTracker, dans leurs résultats de recherche et dans les sujets des publications :

| Section | Ce qui s’affiche |
|---|---|
| Jeux pour consoles » Switch | captures, langues, overclocking (Kefir / 4IFIR) |
| Jeux pour consoles » PS4, PS5 | captures, langues, firmware requis |
| Autres consoles (PS1–PS3, PSP, Vita, Xbox, Wii, DS, Dreamcast…) | captures, langues |
| Jeux pour Windows | captures, langues, RAM et carte graphique minimales, Steam Deck |
| Jeux pour Mac, jeux pour Linux | captures, langues |
| Jeux pour appareils mobiles (Android, Oculus Quest, Symbian, Windows Mobile) | captures, langues |
| Extensions : mods et traductions pour jeux Windows, Train Simulator, simulateurs de vol | captures, langues |

Les films, la musique et le reste sont volontairement laissés de côté : mieux vaut en faire des extensions séparées, pour que chacune reste simple.

<p align="center">
  <img src="../media/screenshot-ps4.png" alt="La liste PS4 : langues et firmware" width="440">
  <img src="../media/screenshot-windows.png" alt="Jeux Windows : configuration requise, compilations et Steam Deck" width="440">
</p>

## Installation

- **Chrome, Edge, Brave, Opera, Yandex Browser :** téléchargez `rutracker-games-…-chrome.zip` depuis les [Releases](https://github.com/iArtem88/rutracker-games/releases) et décompressez-le. Ouvrez `chrome://extensions`, activez le « Mode développeur » et cliquez sur « Charger l’extension non empaquetée ».
- **Firefox :** téléchargez `rutracker-games-…-firefox.xpi` depuis les [Releases](https://github.com/iArtem88/rutracker-games/releases) et ouvrez-le dans Firefox (ou glissez-le dans la fenêtre), puis cliquez sur « Ajouter ». Il est signé par Mozilla et se met à jour tout seul.

## Utilisation

Rien à configurer : ouvrez une section de jeux, par exemple [Switch](https://rutracker.org/forum/viewforum.php?f=1605), et tout fonctionne déjà.

- **Le bouton de l’extension**, dans la barre d’outils du navigateur, active ou désactive l’extension et ses étiquettes, et règle la taille des miniatures.
- **Tous les paramètres** (« Vos étiquettes et tous les paramètres » dans cette fenêtre, ou « ⚙ Paramètres » sur la barre de filtres) : vos langues, votre Switch, votre firmware PS, la RAM de votre PC, Steam Deck, vos étiquettes et vos mots, le cache.
- **Survolez une étiquette** pour voir la ligne de la publication sur laquelle elle se base.
- **Apparence :** l’onglet du même nom règle la couleur du texte, du fond et du cadre de chaque étiquette, y compris les vôtres. Les changements s’appliquent aussitôt, même dans les onglets RuTracker déjà ouverts.

<p align="center">
  <img src="../media/screenshot-settings.png" alt="Paramètres" width="440">
  <img src="../media/screenshot-appearance.png" alt="L’onglet « Apparence »" width="440">
</p>

## Les étiquettes en détail

### Doublage

Par exemple « Doublage russe » ou « Doublage ukrainien ». L’information vient de la ligne « Озвучка: » ou « Язык озвучки: » (« русская, английская », « ENG+RUS ») ; à défaut, de la description (« опциональная русская озвучка… », « Russian Voice Mod ») et du titre (« RUS (Voice Mod.) », « RUS sound »). Des formulations comme « русской озвучки не будет » ne donnent aucune étiquette.

### Texte

Par exemple « Texte russe ». Cette étiquette apparaît quand la langue figure dans la ligne « Язык интерфейса », mais qu’il n’y a pas de doublage dans cette langue :

- en vert « (sans doublage) » — le jeu n’a pas de doublage et il est entièrement dans votre langue ;
- en jaune « (Doublage anglais) » — textes et sous-titres dans votre langue, doublage dans la langue indiquée entre parenthèses ;
- en contour seul, sans parenthèses — la publication ne précise pas s’il y a un doublage.

### Filtres de langue

« Dans mes langues » et « Doublage dans mes langues » sont un seul choix : en activer un désactive l’autre, le réactiver affiche tout. Les autres filtres s’y ajoutent.

| Publication | Tout (rien d’activé) | Dans mes langues | Doublage dans mes langues |
|---|:-:|:-:|:-:|
| Doublage russe | ✅ | ✅ | ✅ |
| Texte russe (sans doublage) | ✅ | ✅ | ✅ |
| Texte russe (Doublage anglais) | ✅ | ✅ | ❌ |
| « Texte russe » — la publication ne dit rien du doublage | ✅ | ✅ | ❌ |
| Rien en russe | ✅ | ❌ | ❌ |

### Overclocking de la Switch

L’extension regarde si l’auteur de la publication demande d’overclocker la console et quelles fréquences il indique, puis les compare à ce qu’atteint l’overclocking intégré à Kefir :

| Révision | CPU | GPU | RAM |
|---|---|---|---|
| Mariko (V2, Lite, OLED) | 1963 MHz | 1267 MHz | 2131 MHz |
| Erista (V1) | 1785 MHz | 921 MHz | 1862 MHz |

L’étiquette se compose de deux moitiés :

- **« conseillé » ou « requis »** — selon la formulation de l’auteur : « лучше », « рекомендуется », « желательно » ou bien « обязательно », « нужен », « требуется ». Quand on trouve les deux (« стоит обязательно разогнать »), c’est requis.
- **Kefir ou 4IFIR (« Чифир »)** — le niveau demandé. 4IFIR si l’auteur le nomme (mais pas dans « работает и без Чифира »), indique des fréquences au-delà des limites de Kefir ou réclame l’overclocking « максимальный » (sauf « максимальный разгон Кефира »). Kefir dans tous les autres cas.

| L’auteur écrit | Étiquette |
|---|---|
| « Лучше всего использовать разгон консоли » | Overclocking conseillé : Kefir |
| « Лучше всего максимально разогнать консоль » | Overclocking conseillé : 4IFIR |
| « Обязательно нужен разгон » | Overclocking requis : Kefir |
| « Обязательно нужен разгон, CPU 2397 МГц » | Overclocking requis : 4IFIR |

« Requis » est plein, « conseillé » seulement en contour. Indiquez dans les paramètres la révision de votre console et votre overclocking : une publication qui en demande plus que votre console ne peut en donner reçoit ⚠, et le filtre « Tourne sur ma Switch » la masque.

D’où viennent ces limites : des sources de Kefir lui-même. Son `kefir.kip` pousse les fréquences jusqu’à CPU 2193 / GPU 1267 / RAM 2131 MHz sur Mariko, et son sys-clk maintient le CPU aux valeurs sûres de 1963 (Mariko) et 1785 (Erista), sauf si `allow_unsafe_freq` est activé à la main.

### Firmware PS4 / PS5

Tiré de la ligne « Минимальная версия прошивки ». Les backports sont pris en compte (« 8.50 + BACKPORT [5.05…] » signifie que le jeu tourne à partir de 5.05), tout comme une limite haute (« работает только до 11.60 »). Indiquez votre firmware dans les paramètres, et les publications qui ne tourneront pas dessus recevront ⚠.

### PC : RAM et carte graphique

La RAM minimale et la première carte graphique de la configuration requise ; l’infobulle affiche tout : OS, CPU, carte graphique. Indiquez la RAM de votre PC dans les paramètres, et les publications qui en demandent davantage recevront ⚠.

**Compilations.** Quand une publication regroupe plusieurs jeux, chacun dans son propre spoiler avec sa propre configuration (anthologies), l’étiquette indique la fourchette et la carte la plus exigeante, par exemple « 1–6 Go de RAM · jusqu’à GTX 780 », et l’infobulle détaille chaque jeu. Les filtres et l’estimation Steam Deck se fondent sur le jeu le plus gourmand.

### Steam Deck

Deux évaluations :

- **D’après la configuration requise** (activée par défaut) : l’étiquette violette « Tourne sur Steam Deck ». Côté graphismes, le Steam Deck équivaut à peu près à une GTX 1050 Ti, mais il affiche en 800p : il tient donc une configuration minimale allant jusqu’à environ une GTX 1060 / RX 580 et 16 Go de RAM. Le processeur et la compatibilité Proton ne sont pas pris en compte.
- **La note officielle de Valve** (désactivée par défaut ; à l’activation, le navigateur demande l’accès au site de Steam) : « vérifié » (fonctionne entièrement), « jouable » (peut demander quelques réglages), « non pris en charge ». Le jeu est retrouvé grâce au lien Steam ou SteamDB de la publication, ou à défaut par une correspondance exacte du titre sur Steam. Quand la note de Valve existe, elle l’emporte. Elle porte sur la version Steam : le build de la publication peut différer. Les compilations n’en ont pas.

## Vos étiquettes et vos mots

**Vos étiquettes.** Dans les paramètres, ajoutez des mots comme `DLC|дополнения` ou `кооператив`, ou une expression régulière entre barres obliques comme `/(лучше|рекомендуется|желательно).*разгон/`. Les publications dont le titre ou la description correspond reçoivent votre étiquette, dans la couleur de votre choix, et vous pouvez l’ajouter à la barre de filtres. Quelques exemples sont fournis avec l’extension, désactivés.

<p align="center">
  <img src="../media/screenshot-badges.png" alt="Vos étiquettes dans les réglages" width="520">
</p>

**Vos mots pour l’overclocking de la Switch.** Dans les paramètres de la Switch, « Mots personnels pour les étiquettes » affiche les mots sur lesquels se base l’étiquette d’overclocking — ceux qui parlent d’overclocking, « conseillé », « requis », « pas nécessaire », « maximal », les noms de 4IFIR et de Kefir — et vous permet d’ajouter les vôtres. Ils s’ajoutent aux mots intégrés et s’appliquent aussitôt, y compris aux publications déjà chargées.

<p align="center">
  <img src="../media/screenshot-words.png" alt="Mots personnels pour l’étiquette d’overclocking de la Switch" width="520">
</p>

## Confidentialité

- Ni publicité, ni statistiques d’utilisation, ni comptes, ni serveurs à elle.
- L’extension ne demande que des pages de RuTracker, comme si vous ouvriez le sujet vous-même, et charge les images depuis les mêmes hébergeurs que ceux du sujet. La seule exception est la note Steam Deck de Valve : si vous l’activez, l’extension demande à Steam l’identifiant et la note du jeu (sans vos cookies ni vos données). Pour les images fastpic que l’hébergeur ne donne que par sa propre page, la visionneuse ouvre cette page sans l’afficher, sans ses scripts ni ses publicités, et y prend le lien vers l’image, comme si vous aviez cliqué vous-même sur la miniature. Pour les images ImgBB et PostImages, elle lit l’adresse de l’image complète sur sa page chez l’hébergeur (sans vos cookies).
- Les paramètres et le cache des descriptions de publications restent dans votre navigateur.
- Le code est ouvert, chacun peut le vérifier. Plus de détails dans [PRIVACY.md](../../PRIVACY.md).

## Respectueuse du site

- L’extension ne charge que les publications que vous atteignez en faisant défiler la page, 2 requêtes à la fois au maximum, avec des pauses entre elles.
- Quand le site est surchargé ou limite les requêtes (429, 5xx, 403 de Cloudflare), elle se met en retrait un moment, puis reprend.
- La description d’une publication est chargée une seule fois et conservée un mois ; elle n’est rechargée que si la publication est mise à jour (son titre ou sa taille change dans la liste). Les mises à jour de l’extension ne vident pas le cache : il conserve la description elle-même et la réanalyse.
- Un filtre actif vérifie toute la page d’un coup. Pour ne charger que ce que vous atteignez en faisant défiler, désactivez « Un filtre vérifie toute la page d’un coup » dans les paramètres.

## Questions fréquentes

**Des cases grises à la place des captures.** L’image vient d’un hébergeur d’images (fastpic, imageban…) lent ou bloqué sur votre réseau. Ces espaces réservés disparaissent au bout de 20 secondes.

**Une étiquette manque, ou n’a rien à faire là.** Les descriptions des publications sont écrites par des humains, chacun à sa façon. Survolez l’étiquette pour voir sur quoi elle se base. Si elle est erronée, [ouvrez un ticket](https://github.com/iArtem88/rutracker-games/issues) avec le lien de la publication, et nous corrigerons l’analyse. Pour l’overclocking de la Switch, vous pouvez aussi ajouter vos propres mots tout de suite.

**Pourquoi pas de films ?** L’extension est consacrée aux jeux. Les autres contenus méritent leur propre extension : ainsi, chacune reste simple.

**Est-ce officiel ?** Non. C’est un projet indépendant, sans lien avec RuTracker.

## Contribuer

Vous avez trouvé un bug ou aimeriez qu’une autre section soit prise en charge ? Consultez [CONTRIBUTING.md](../../CONTRIBUTING.md) (en russe) : une nouvelle section tient dans un seul petit fichier, et les tickets sont les bienvenus dans n’importe quelle langue.

## Développement

```sh
npm install        # uniquement pour les tests et le build ; rien de tout cela n’entre dans l’extension
npm test           # les tests d’analyse, dans un vrai Chromium
npm run test:e2e   # toute l’extension dans Google Chrome face à un faux RuTracker, environ une minute
npm run build      # dist/rutracker-games-<version>-chrome.zip et …-firefox.zip
```

L’extension elle-même est en JavaScript pur, sans étape de build : chargez `src/` comme extension non empaquetée pour essayer vos modifications.

## Licence

Copyright © 2026 [iArtem88](https://github.com/iArtem88).

RuTracker Games est un logiciel libre distribué sous la [GNU General Public License v3.0](../../LICENSE) ou (à votre choix) toute version ultérieure : vous pouvez l’utiliser, le modifier et le partager, et toute copie ou version modifiée doit elle aussi rester ouverte sous la GPL.

Ceci est une extension non officielle, sans lien avec RuTracker.
