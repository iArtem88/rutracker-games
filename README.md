<h1 align="center">
  <img src="docs/media/logo.png" alt="" width="120"><br>
  RuTracker Games
</h1>

<p align="center">
  <a href="README.md">🇬🇧&nbsp;English</a> •
  <a href="docs/i18n/README.uk.md">🇺🇦&nbsp;Українська</a> •
  <a href="docs/i18n/README.ru.md">🇷🇺&nbsp;Русский</a> •
  <a href="docs/i18n/README.de.md">🇩🇪&nbsp;Deutsch</a> •
  <a href="docs/i18n/README.fr.md">🇫🇷&nbsp;Français</a> •
  <a href="docs/i18n/README.es.md">🇪🇸&nbsp;Español</a> •
  <a href="docs/i18n/README.it.md">🇮🇹&nbsp;Italiano</a> •
  <a href="docs/i18n/README.pl.md">🇵🇱&nbsp;Polski</a> •
  <a href="docs/i18n/README.pt.md">🇧🇷&nbsp;Português</a> •
  <a href="docs/i18n/README.ja.md">🇯🇵&nbsp;日本語</a>
</p>

<h4 align="center">Screenshots and handy badges right in RuTracker's lists of game releases — no need to open every topic.</h4>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-GPL--3.0--or--later-blue.svg" alt="License: GPL-3.0-or-later"></a>
  <a href="CHANGELOG.md"><img src="https://img.shields.io/badge/version-1.2.0-green.svg" alt="Version 1.2.0"></a>
  <img src="https://img.shields.io/badge/Chrome-Manifest%20V3-4285F4.svg" alt="Chrome, Manifest V3">
  <img src="https://img.shields.io/badge/UI-10%20languages-orange.svg" alt="10 languages">
  <a href="https://github.com/iArtem88/rutracker-games/actions/workflows/ci.yml"><img src="https://github.com/iArtem88/rutracker-games/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
</p>

<p align="center">
  <img src="docs/media/screenshot-switch.png" alt="The Switch list with screenshots, badges and the filter bar" width="900">
</p>

---

## Contents

- [What it does](#what-it-does)
- [Supported sections](#supported-sections)
- [Install](#install)
- [How to use](#how-to-use)
- [The badges in detail](#the-badges-in-detail)
- [Your own badges and words](#your-own-badges-and-words)
- [Privacy](#privacy)
- [Gentle to the site](#gentle-to-the-site)
- [FAQ](#faq)
- [Contributing](#contributing)
- [Development](#development)
- [License](#license)

## What it does

Right in the list of releases, between the title and the author:

- **Screenshots** from the release's «Скриншоты» spoiler: the same thumbnails as in the topic. One with a magnifier opens full-size in the extension's own viewer, right on the page and without the image host's ads: ← → or the strip of thumbnails below switch between them, Esc closes. Without a magnifier, a click opens the image host's page. One row is shown, «N more» unfolds the rest.
- **In a release's topic** the spoilers with screenshots open by themselves (this can be turned off in the settings), and the screenshots open in the same viewer.
- **Badges from the release description:**
  - <img src="https://img.shields.io/badge/-Russian%20voice--over-d32f2f" alt="Russian voice-over"> — voice-over in your language, with details in brackets: machine, amateur, partial, a mod;
  - <img src="https://img.shields.io/badge/-Russian%20text%20(no%20voice--over)-2e7d32" alt="Russian text (no voice-over)"> — the game is in your language and simply has no voice-over;
  - <img src="https://img.shields.io/badge/-Russian%20text%20(English%20voice--over)-fbc02d" alt="Russian text (English voice-over)"> — text and subtitles in your language, voice-over in another;
  - <img src="https://img.shields.io/badge/-Overclock%20required:%204IFIR-6a1b9a" alt="Overclock required: 4IFIR"> — whether a Switch needs overclocking, and whether Kefir's own overclock is enough;
  - <img src="https://img.shields.io/badge/-Firmware%205.05+-00695c" alt="Firmware 5.05+"> — the PS4 / PS5 firmware the game runs on;
  - <img src="https://img.shields.io/badge/-8%20GB%20RAM%20·%20GTX%201060-455a64" alt="8 GB RAM · GTX 1060"> — the PC's minimum RAM and video card;
  - <img src="https://img.shields.io/badge/-Runs%20on%20Steam%20Deck-8e24aa" alt="Runs on Steam Deck"> — by the system requirements the game should run on a Steam Deck, and <img src="https://img.shields.io/badge/-Steam%20Deck:%20verified-1976d2" alt="Steam Deck: verified"> is Valve's own rating (turn it on in the settings).
- **A filter bar** above the list: «Voice-over in my languages», «In my languages», «Runs on my Switch», «Runs on my firmware», «Enough RAM in my PC», «Runs on Steam Deck», and your own badges.
- **Your languages.** Voice-over and text badges are shown for the languages you tick in «My languages»: English, Ukrainian, Russian, German, French, Spanish, Italian, Polish, Portuguese, Japanese. Russian, Ukrainian and the interface language are ticked by default. The extension's interface speaks these 10 languages too.
- **Your own badges** by words or a regular expression, and **your own words** for the Switch overclock badge.

## Supported sections

The extension works in the section lists, in the search results and in the releases' topics of RuTracker's game sections:

| Section | What it shows |
|---|---|
| Games for consoles » Switch | screenshots, languages, overclock (Kefir / 4IFIR) |
| Games for consoles » PS4, PS5 | screenshots, languages, the firmware needed |
| Other consoles (PS1–PS3, PSP, Vita, Xbox, Wii, DS, Dreamcast…) | screenshots, languages |
| Games for Windows | screenshots, languages, minimum RAM and video card, Steam Deck |
| Games for Mac, games for Linux | screenshots, languages |
| Games for mobile devices (Android, Oculus Quest, Symbian, Windows Mobile) | screenshots, languages |
| Add-ons: mods and translations for Windows games, Train Simulator, flight simulators | screenshots, languages |

Films, music and the rest are out of scope on purpose: they'd better be separate extensions, so that each one stays simple.

<p align="center">
  <img src="docs/media/screenshot-ps4.png" alt="The PS4 list: languages and firmware" width="440">
  <img src="docs/media/screenshot-windows.png" alt="Windows games: requirements, collections and Steam Deck" width="440">
</p>

## Install

- **Chrome, Edge, Brave, Opera, Yandex Browser:** download `rutracker-games-…-chrome.zip` from [Releases](https://github.com/iArtem88/rutracker-games/releases) and unzip it. Open `chrome://extensions`, turn on «Developer mode» and click «Load unpacked».

## How to use

Nothing to set up: open a game section, say [Switch](https://rutracker.org/forum/viewforum.php?f=1605), and it already works.

- **The extension's button** in the browser toolbar turns the extension and its badges on and off and sets the thumbnail size.
- **All the settings** («Your badges and all settings» in that window, or «⚙ Settings» on the filter bar): your languages, your Switch, your PS firmware, your PC's RAM, Steam Deck, your badges and words, the cache.
- **Hover a badge** to see the line of the release it's based on.
- **Appearance:** the tab of that name sets the text, background and border color of every badge, your own ones included. Changes show at once, in open RuTracker tabs too.

<p align="center">
  <img src="docs/media/screenshot-settings.png" alt="Settings" width="440">
  <img src="docs/media/screenshot-appearance.png" alt="The Appearance tab" width="440">
</p>

## The badges in detail

### Voice-over

E.g. «Russian voice-over», «Ukrainian voice-over». Taken from the «Озвучка:» or «Язык озвучки:» line («русская, английская», «ENG+RUS»); if it isn't there, from the description («опциональная русская озвучка…», «Russian Voice Mod») and the title («RUS (Voice Mod.)», «RUS sound»). Phrases like «русской озвучки не будет» set no badge.

### Text

E.g. «Russian text». Set when the language is in the «Язык интерфейса» line, but the voice-over isn't in it:

- green «(no voice-over)» — the game has no voice-over and is fully in your language;
- yellow «(English voice-over)» — text and subtitles in your language, the voice-over in the one in brackets;
- outlined, without brackets — the release doesn't say whether there's a voice-over.

### Language filters

«In my languages» and «Voice-over in my languages» are one choice: pressing one releases the other, pressing it again shows everything. The other filters add up with it.

| Release | All (nothing pressed) | In my languages | Voice-over in my languages |
|---|:-:|:-:|:-:|
| Russian voice-over | ✅ | ✅ | ✅ |
| Russian text (no voice-over) | ✅ | ✅ | ✅ |
| Russian text (English voice-over) | ✅ | ✅ | ❌ |
| «Russian text» — the release doesn’t say about the voice-over | ✅ | ✅ | ❌ |
| Nothing in Russian | ✅ | ❌ | ❌ |

### Switch overclock

The extension looks for whether the uploader asks to overclock the console and what clocks they give, and compares them with what Kefir's own overclock reaches:

| Revision | CPU | GPU | RAM |
|---|---|---|---|
| Mariko (V2, Lite, OLED) | 1963 MHz | 1267 MHz | 2131 MHz |
| Erista (V1) | 1785 MHz | 921 MHz | 1862 MHz |

The badge has two halves:

- **«advised» or «required»** — as the uploader puts it: «лучше», «рекомендуется», «желательно» or «обязательно», «нужен», «требуется». When both are there («стоит обязательно разогнать»), it's required.
- **Kefir or 4IFIR («Чифир»)** — how much they ask for. 4IFIR if they name it (but not «работает и без Чифира»), give clocks above Kefir's limits, or ask for the «максимальный» overclock (except «максимальный разгон Кефира»). Kefir otherwise.

| The uploader writes | Badge |
|---|---|
| «Лучше всего использовать разгон консоли» | Overclock advised: Kefir |
| «Лучше всего максимально разогнать консоль» | Overclock advised: 4IFIR |
| «Обязательно нужен разгон» | Overclock required: Kefir |
| «Обязательно нужен разгон, CPU 2397 МГц» | Overclock required: 4IFIR |

«Required» is filled, «advised» outlined. Set your console's revision and overclock in the settings: a release asking for more than yours gets ⚠, and the «Runs on my Switch» filter hides it.

Where the limits come from: Kefir's own sources. Its `kefir.kip` raises the clocks up to CPU 2193 / GPU 1267 / RAM 2131 MHz on Mariko, and its sys-clk keeps the CPU at the safe 1963 (Mariko) and 1785 (Erista) unless `allow_unsafe_freq` is set by hand.

### PS4 / PS5 firmware

From the «Минимальная версия прошивки» line. Backports count («8.50 + BACKPORT [5.05…]» means it runs from 5.05), and so does an upper limit («работает только до 11.60»). Set your firmware in the settings, and the releases that won't run get ⚠.

### PC: RAM and video card

The minimum RAM and the first video card of the system requirements; the tooltip shows them all: OS, CPU, video card. Set your PC's RAM in the settings, and the releases asking for more get ⚠.

**Collections.** When a release holds several games, each in its own spoiler with its own requirements (anthologies), the badge shows the range and the most demanding card, e.g. «1–6 GB RAM · up to GTX 780», and the tooltip lists every game. The filters and the Steam Deck estimate go by the heaviest game.

### Steam Deck

Two ratings:

- **By the system requirements** (on by default): the purple «Runs on Steam Deck». A Steam Deck is about a GTX 1050 Ti in graphics but plays at 800p, so it handles minimum requirements up to about a GTX 1060 / RX 580 and 16 GB of RAM. The CPU and Proton compatibility aren't taken into account.
- **Valve's own rating** (off by default; when you turn it on, the browser asks for access to the Steam site): «verified» (works fully), «playable» (may need tweaking), «unsupported». The game is found by the Steam or SteamDB link in the release, or else by an exact title match in Steam. Valve's rating wins where it exists. It's about the Steam version: the release's build may differ. Collections don't get it.

## Your own badges and words

**Your badges.** In the settings, add words like `DLC|дополнения` or `кооператив`, or a regular expression between slashes like `/(лучше|рекомендуется|желательно).*разгон/`. The releases whose title or description match get your badge, in the color you pick, and you can put it on the filter bar. A few examples come with the extension, turned off.

<p align="center">
  <img src="docs/media/screenshot-badges.png" alt="Your badges in the settings" width="520">
</p>

**Your words for the Switch overclock.** Under the Switch settings, «Own words for the badges» shows the words the overclock badge goes by — about overclocking, «advised», «required», «not needed», «maximum», the names of 4IFIR and Kefir — and lets you add your own. They add up with the built-in ones and apply at once, to the releases already loaded too.

<p align="center">
  <img src="docs/media/screenshot-words.png" alt="Own words for the Switch overclock badge" width="520">
</p>

## Privacy

- No ads, no analytics, no accounts, no servers of its own.
- It only requests RuTracker's own pages, as if you opened the topic yourself, and loads pictures from the same image hosts the topic uses. The one exception is Valve's Steam Deck rating: if you turn it on, the extension asks Steam for the game's id and rating (without your cookies or data). For fastpic pictures that the host hands out only through its own page, the viewer opens that page unseen, with its scripts and ads off, and takes the picture's link from it, as a click on the thumbnail would. For ImgBB and PostImages pictures it reads the full picture's address off the host's page (without your cookies).
- The settings and the cache of release descriptions stay in your browser.
- The code is open for anyone to check. More in [PRIVACY.md](PRIVACY.md).

## Gentle to the site

- It loads only the releases you scroll to, at most 2 requests at a time and with pauses between them.
- When the site is busy or limits requests (429, 5xx, Cloudflare's 403), it goes quiet for a while and then carries on.
- A release's description is loaded once and kept for a month; again only when the release is updated (its title or size in the list changes). Updates of the extension don't drop the cache: it keeps the description itself and reads it anew.
- An active filter checks the whole page at once. To load only what you scroll to, turn off «A filter checks the whole page at once» in the settings.

## FAQ

**Grey boxes instead of screenshots.** The picture comes from an image host (fastpic, imageban…) that is slow or blocked in your network. Such placeholders go away after 20 seconds.

**A badge is missing, or shouldn't be there.** Release descriptions are written by people, each in their own way. Hover the badge to see what it's based on. If it's wrong, [open an issue](https://github.com/iArtem88/rutracker-games/issues) with a link to the release, and we'll fix the parsing. For the Switch overclock, you can also add your own words right away.

**Why no films?** The extension is about games. Other content deserves an extension of its own: that keeps each one simple.

**Is it official?** No. It's an independent project, not affiliated with RuTracker.

## Contributing

Found a bug or want one more section supported? See [CONTRIBUTING.md](CONTRIBUTING.md) (in Russian): a new section is one small file, and issues are welcome in any language.

## Development

```sh
npm install        # for the tests and the build only; nothing of it goes into the extension
npm test           # the parsing tests, in real Chromium
npm run test:e2e   # the whole extension in Google Chrome against a mock RuTracker, about a minute
npm run build      # dist/rutracker-games-<version>-chrome.zip and …-firefox.zip
```

The extension itself is plain JavaScript with no build step: load `src/` unpacked to try your changes.

## License

Copyright © 2026 [iArtem88](https://github.com/iArtem88).

RuTracker Games is free software under the [GNU General Public License v3.0](LICENSE) or (at your option) any later version: you may use, change and share it, and any copy or modification must stay open under the GPL too.

This is an unofficial extension, not affiliated with RuTracker.
