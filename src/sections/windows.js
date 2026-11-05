'use strict';

// Игры » Игры для Windows. From the system requirements: the minimum RAM and
// video card, whether my PC has enough RAM, and whether a Steam Deck should
// handle them. Optionally, Valve's own Steam Deck rating, looked up on Steam by
// the background script (see background.js).

const WINDOWS_FORUMS = [
  '5', '635', '127', '2203', '647', '646', '50', '53', '1008', '900', '128', '2204', '278', '52', '54',
  '51', '2226', '2118', '1310', '2410', '2205', '2225', '2206', '1007', '2228', '68',
];
// "Оперативная память: 8 GB RAM" / "ОЗУ: 4 Гб минимум" / "RAM: 512 MB" / "Память: 4 GB"
// (but not "Видеопамять" or "Память видеокарты")
const RAM_FIELD = /(?:оперативн\p{L}*\s+памят\p{L}*|(?<!\p{L})памят\p{L}*(?=\s*:)|(?<!\p{L})ОЗУ(?!\p{L})|\bRAM\b)[\s:]*(?:от\s+)?(\d+(?:[.,]\d+)?)\s*(гб|gb|g(?!\p{L})|мб|mb)/iu;
// "Видеокарта: NVIDIA GeForce GTX 1060 (6GB) / AMD Radeon RX 580"
const GPU_FIELD = /^[^\p{L}]*(?:видеокарт\p{L}*|видеоадаптер\p{L}*|графи\p{L}*)\s*:[\s:]*(.+)$/iu;
// The first model named in it
const GPU_MODELS = [
  /\b(?:RTX|GTX|GTS|GT)\s?-?\d{3,4}(?:\s?(?:Ti|Super))?(?![\w])/i,
  /\bGeForce\s+\d{3,4}(?:\s?(?:GTX|GTS|GT|GS))?(?![\w])/i,
  /\b(?:RX|R[579])\s?\d{3,4}X?(?:\s?XT)?(?![\w])/i,
  /\bIntel\s+(?:UHD|HD|Iris(?:\s+Xe)?)(?:\s+Graphics)?(?:\s+\d{3,4}(?![\w]))?/i,
  /\b(?:Radeon\s+)?HD\s?\d{4}(?![\w])/i,
  /\bArc\s+A\d{3}(?![\w])/i,
  /встроенн\p{L}*/iu,
];
const REQUIREMENT_LINE = /^[^\p{L}]*(?:операционн|ОС(?!\p{L})|процессор|оперативн|ОЗУ|видеокарт|видеоадаптер|свободн|место\s+на|directx)/iu;
// Links that name the game's Steam app
const STEAM_APP_LINK = /(?:store\.steampowered\.com|steamcommunity\.com|steamdb\.info)\/app\/(\d+)/;
const STEAM_PERMISSION = { origins: ['https://store.steampowered.com/*'] };

// Rough video card speed, GTX 1050 Ti = 100. Cards that aren't listed get no
// Steam Deck estimate; anything newer and faster than these is far above it.
const GPU_SCORES = {
  'GEFORCE 7600 GT': 6, 'GEFORCE 8600': 10, 'GEFORCE 8800': 25, 'GEFORCE 8800 GT': 28, 'GEFORCE 9600': 18,
  'GEFORCE 9800': 30, 'GTS 250': 30, 'GTX 260': 35, 'GTX 275': 45, 'GTX 280': 45, 'GTX 285': 50,
  'GT 520': 10, 'GT 610': 10, 'GT 620': 12, 'GT 630': 18, 'GT 640': 25, 'GT 710': 12, 'GT 730': 22, 'GT 1030': 35,
  'GEFORCE 450': 35, 'GTS 450': 35, 'GTX 460': 55, 'GTX 470': 65, 'GTX 480': 75, 'GTX 550 TI': 45, 'GTX 560': 60,
  'GTX 560 TI': 65, 'GTX 570': 80, 'GTX 580': 90, 'GTX 650': 40, 'GTX 650 TI': 60, 'GTX 660': 85, 'GTX 660 TI': 95,
  'GTX 670': 105, 'GTX 680': 115, 'GTX 750': 55, 'GTX 750 TI': 65, 'GTX 760': 90, 'GTX 770': 115, 'GTX 780': 135,
  'GTX 780 TI': 160, 'GTX 950': 85, 'GTX 960': 100, 'GTX 970': 150, 'GTX 980': 180, 'GTX 980 TI': 230,
  'GTX 1050': 80, 'GTX 1050 TI': 100, 'GTX 1060': 160, 'GTX 1070': 215, 'GTX 1070 TI': 240, 'GTX 1080': 260,
  'GTX 1080 TI': 330, 'GTX 1630': 70, 'GTX 1650': 120, 'GTX 1650 SUPER': 160, 'GTX 1660': 180,
  'GTX 1660 SUPER': 200, 'GTX 1660 TI': 200, 'RTX 2060': 230, 'RTX 3050': 200,
  'HD 2900': 12, 'HD 3870': 15, 'HD 4850': 30, 'HD 4870': 38, 'HD 4890': 42, 'HD 5670': 20, 'HD 5750': 32,
  'HD 5770': 38, 'HD 5850': 50, 'HD 5870': 60, 'HD 6670': 22, 'HD 6750': 35, 'HD 6770': 38, 'HD 6850': 50,
  'HD 6870': 60, 'HD 6950': 75, 'HD 6970': 80, 'HD 7750': 45, 'HD 7770': 55, 'HD 7790': 70, 'HD 7850': 85,
  'HD 7870': 100, 'HD 7950': 120, 'HD 7970': 135, 'R7 250': 35, 'R7 260': 55, 'R7 260X': 60, 'R7 265': 85,
  'R7 360': 55, 'R7 370': 85, 'R9 270': 95, 'R9 270X': 105, 'R9 280': 120, 'R9 280X': 135, 'R9 285': 125,
  'R9 290': 170, 'R9 290X': 185, 'R9 380': 125, 'R9 380X': 135, 'R9 390': 175, 'R9 390X': 190,
  'RX 460': 70, 'RX 470': 145, 'RX 480': 165, 'RX 550': 55, 'RX 560': 80, 'RX 570': 150, 'RX 580': 165,
  'RX 590': 180, 'RX 5500 XT': 175, 'RX 6400': 130, 'RX 6500 XT': 145,
  'INTEL HD GRAPHICS': 10, 'INTEL HD GRAPHICS 4000': 12, 'INTEL HD GRAPHICS 4600': 18, 'INTEL HD GRAPHICS 520': 18,
  'INTEL HD GRAPHICS 530': 20, 'INTEL HD GRAPHICS 620': 20, 'INTEL HD GRAPHICS 630': 22, 'INTEL UHD GRAPHICS': 20,
  'INTEL UHD GRAPHICS 620': 20, 'INTEL UHD GRAPHICS 630': 22, 'INTEL IRIS XE': 70, 'INTEL IRIS XE GRAPHICS': 70,
  'ARC A380': 160, INTEGRATED: 15,
};
// The Deck's GPU is about a GTX 1050 Ti, but it plays at 800p, so minimum
// requirements up to about a GTX 1060 / RX 580 and its 16 GB of shared memory
const DECK_MAX_GPU = 165;
const DECK_MAX_RAM_GB = 16;
const RAM_MAX_GB = 32;
// Valve's resolved_category: 3 verified, 2 playable, 1 unsupported, 0 not tested
const DECK_VALVE = {
  3: { key: 'verified', cls: 'rts-deck-verified', ok: true },
  2: { key: 'playable', cls: 'rts-deck-playable', ok: true },
  1: { key: 'unsupported', cls: 'rts-deck-unsupported', ok: false },
};

function shortGpu(value) {
  const found = GPU_MODELS.map((re) => re.exec(value)).filter(Boolean).sort((a, b) => a.index - b.index)[0];
  if (!found) return null;
  // A key, shown as t('win.integrated')
  if (/^встроенн/i.test(found[0])) return 'integrated';
  return found[0]
    .replace(/([A-Za-z])(\d)/g, '$1 $2') // "GTX960" -> "GTX 960"
    .replace(/(\d)(ti|xt|super)\b/i, '$1 $2') // "1080TI" -> "1080 TI"
    .replace(/\bti\b/i, 'Ti')
    .replace(/\s+/g, ' ')
    .trim();
}

function gpuScore(gpu) {
  if (!gpu) return null;
  const key = gpu.toUpperCase().replace(/^RADEON\s+/, '').replace(/^NVIDIA\s+/, '');
  return GPU_SCORES[key] ?? null;
}

// One game's requirements: {ramGb, gpu, requirements}, or null
function requirementsIn(lines) {
  const ramLine = lines.find((l) => RAM_FIELD.test(l));
  const gpuLine = lines.find((l) => GPU_FIELD.test(l));
  if (!ramLine && !gpuLine) return null;
  let ramGb = null;
  if (ramLine) {
    const [, size, unit] = RAM_FIELD.exec(ramLine);
    const value = parseFloat(size.replace(',', '.'));
    // A minimum above 32 GB is a slip for MB ("Pentium 2 ... Память: 64 ГБ")
    ramGb = /^[мm]/i.test(unit) || value > RAM_MAX_GB ? value / 1024 : value;
  }
  // The minimum requirements come first
  const at = lines.indexOf(ramLine || gpuLine);
  const requirements = lines.slice(Math.max(0, at - 4), at + 6).filter((l) => REQUIREMENT_LINE.test(l)).join('\n');
  return { ramGb, gpu: gpuLine ? shortGpu(GPU_FIELD.exec(gpuLine)[1]) : null, requirements };
}

// A spoiler with the requirements themselves ("Рекомендуемые"), not a game
const NOT_A_GAME = /требован|requirement|рекоменд|recommend|минимальн|minimum|оптимальн|optimal|максимальн|maximum|system/i;

// A collection's games: top-level spoilers ("Borderlands", "Borderlands 2", ...)
// with their own requirements each
function collectionGames(post) {
  return [...post.querySelectorAll('.sp-wrap')]
    .filter((wrap) => !wrap.parentElement.closest('.sp-wrap'))
    .map((wrap) => {
      const name = wrap.querySelector(':scope > .sp-head')?.textContent.trim() || '';
      const body = wrap.querySelector(':scope > .sp-body');
      return { name, req: body && !NOT_A_GAME.test(name) ? requirementsIn(postLines(body)) : null };
    })
    .filter((game) => game.req);
}

// The video card that asks the most: by GPU_SCORES, else the one of the game
// that needs the most memory
function heaviestGpu(games) {
  const scored = games.filter((game) => gpuScore(game.req.gpu) !== null);
  if (scored.length) return scored.reduce((a, b) => (gpuScore(b.req.gpu) > gpuScore(a.req.gpu) ? b : a)).req.gpu;
  return games.filter((game) => game.req.gpu).sort((a, b) => (b.req.ramGb ?? 0) - (a.req.ramGb ?? 0))[0]?.req.gpu ?? null;
}

// {ramGb, gpu, requirements}, or null without system requirements. A collection
// takes what its heaviest game takes, so the filters and the Steam Deck estimate
// judge it whole; ramMin and games are for the badge.
function findRequirements(lines, post) {
  const games = post ? collectionGames(post) : [];
  if (games.length < 2) return requirementsIn(lines);
  const rams = games.map((game) => game.req.ramGb).filter((gb) => gb !== null);
  return {
    ramGb: rams.length ? Math.max(...rams) : null,
    ramMin: rams.length ? Math.min(...rams) : null,
    gpu: heaviestGpu(games),
    games: games.length,
    requirements: games.map((game) => `${game.name}:\n${game.req.requirements}`).join('\n\n'),
  };
}

// The game's Steam page; links to several games (a collection) say nothing
function findSteamApp(post) {
  const ids = new Set([...post.querySelectorAll('a[href]')]
    .map((link) => STEAM_APP_LINK.exec(link.getAttribute('href'))?.[1]).filter(Boolean));
  return ids.size === 1 ? [...ids][0] : null;
}

// "[DL] Cyberpunk 2077 [P] [RUS + ENG] (2020, RPG) [GOG]" -> "Cyberpunk 2077"
function gameName(title) {
  return title.replace(/^(?:\s*\[[^\]]*\])+\s*/, '').split(/\s+[[(]|\s+\/\s+/)[0].trim();
}

function formatRam(gb) {
  return gb < 1 ? t('win.mb', { n: Math.round(gb * 1024) }) : t('win.gb', { n: gb });
}

function gpuText(gpu) {
  return gpu === 'integrated' ? t('win.integrated') : gpu;
}

// "1–6 ГБ" for a collection
function ramText(req) {
  const { ramMin: min, ramGb: max } = req;
  if (min == null || min === max) return formatRam(max);
  return min >= 1 ? t('win.gb', { n: `${min}–${max}` }) : `${formatRam(min)}–${formatRam(max)}`;
}

function myRam(settings) {
  const gb = parseFloat(String(settings.pcRam || '').replace(',', '.'));
  return Number.isFinite(gb) ? gb : null;
}

function requirementsBadge(req, settings) {
  const mine = myRam(settings);
  const enough = mine === null || req.ramGb === null || req.ramGb <= mine;
  const collection = req.games > 1;
  const gpu = req.gpu && (collection ? t('win.upTo', { gpu: gpuText(req.gpu) }) : gpuText(req.gpu));
  const parts = [req.ramGb === null ? null : t('win.ram', { size: ramText(req) }), gpu].filter(Boolean);
  if (!parts.length) return null;
  const myPc = mine === null ? '' : `\n\n${t('win.myPc', { size: formatRam(mine) })}${enough ? '' : `, ${t('win.notEnough')}`}`;
  const head = collection ? t('win.collection', { n: req.games }) : t('win.requirements');
  return {
    text: `${enough ? '' : '⚠ '}${parts.join(' · ')}`,
    cls: 'rts-pc',
    title: `${head}\n${req.requirements}${myPc}`,
  };
}

// Would the minimum requirements fit a Steam Deck: true / false, or null when the video card is unknown
function fitsDeck(req) {
  const score = gpuScore(req?.gpu);
  if (score === null) return null;
  return score <= DECK_MAX_GPU && (req.ramGb === null || req.ramGb <= DECK_MAX_RAM_GB);
}

// Valve's rating when there is one, else the estimate from the requirements: {ok, badge} or null
function deckVerdict(topic, settings, lookup) {
  const valve = settings.showSteamDeck && lookup && DECK_VALVE[lookup.category];
  if (valve) {
    return {
      ok: valve.ok,
      badge: {
        text: t(`deck.${valve.key}`),
        cls: valve.cls,
        href: `https://store.steampowered.com/app/${lookup.appId}`,
        title: `${t(`deck.why.${valve.key}`)}\n${t('deck.valveNote')}`,
      },
    };
  }
  const req = topic.extra?.requirements;
  if (!settings.showDeckEstimate || !fitsDeck(req)) return null;
  return {
    ok: true,
    badge: {
      text: t('deck.estimate'),
      cls: 'rts-deck-estimate',
      title: t('deck.estimateWhy', {
        requirements: [gpuText(req.gpu), req.ramGb === null ? null : t('win.ram', { size: formatRam(req.ramGb) })]
          .filter(Boolean).join(', '),
      }),
    },
  };
}

registerSection({
  id: 'windows',
  // Settings texts are keys of src/locales/*
  title: 'win.title',
  forumIds: WINDOWS_FORUMS,
  settings: [
    { key: 'showPcRam', label: 'win.setting.requirements', type: 'toggle', default: true },
    { key: 'pcRam', label: 'win.setting.pcRam', type: 'number', default: '', placeholder: '16' },
    { key: 'showDeckEstimate', label: 'win.setting.deckEstimate', type: 'toggle', default: true },
    {
      key: 'showSteamDeck',
      label: 'win.setting.deckValve',
      type: 'toggle',
      default: false,
      permissions: STEAM_PERMISSION,
    },
  ],
  hint: () => t('win.hint'),
  // Badge colors, see lib/badges.js. Valve's ratings are outlined, the estimate filled.
  styles: [
    {
      id: 'win.requirements',
      cls: 'rts-pc',
      selector: '.rts-pc',
      sample: () => `${t('win.ram', { size: formatRam(8) })} · GTX 1060`,
      colors: { text: '#ffffff', background: '#455a64', border: '#455a64' },
    },
    {
      id: 'win.deckEstimate',
      cls: 'rts-deck-estimate',
      selector: '.rts-deck-estimate',
      sample: () => t('deck.estimate'),
      colors: { text: '#ffffff', background: '#8e24aa', border: '#8e24aa' },
    },
    ...[['verified', '#1976d2'], ['playable', '#0097a7'], ['unsupported', '#d32f2f']].map(([key, color]) => ({
      id: `win.deck.${key}`,
      cls: `rts-deck-${key}`,
      selector: `.rts-deck-${key}`,
      sample: () => t(`deck.${key}`),
      colors: { text: '#222222', background: '#ffffff', border: color },
    })),
  ],
  parse: (lines, title, post) => ({ requirements: findRequirements(lines, post), steamAppId: findSteamApp(post) }),
  // Valve's Steam Deck rating: {appId, category}, from Steam through the background script.
  // Not for a collection: it would be one of its games' rating.
  lookup(topic, settings, { title }) {
    if (!settings.showSteamDeck || topic.extra?.requirements?.games > 1) return null;
    return ext.runtime.sendMessage({ type: 'steamDeck', appId: topic.extra?.steamAppId, name: gameName(title) });
  },
  badges(topic, settings, { lookup }) {
    const req = topic.extra?.requirements;
    return [
      settings.showPcRam && req ? requirementsBadge(req, settings) : null,
      deckVerdict(topic, settings, lookup)?.badge,
    ].filter(Boolean);
  },
  filters: [
    {
      id: 'fitsPc',
      label: (settings) => (myRam(settings) === null
        ? t('win.filter.ramUnset')
        : t('win.filter.ram', { size: formatRam(myRam(settings)) })),
      test: (topic, settings) => {
        const need = topic.extra?.requirements?.ramGb;
        return need == null || myRam(settings) === null || need <= myRam(settings);
      },
    },
    {
      id: 'steamDeck',
      label: (settings) => t(settings.showDeckEstimate || settings.showSteamDeck ? 'win.filter.deck' : 'win.filter.deckOff'),
      test: (topic, settings, { lookup }) => (!settings.showDeckEstimate && !settings.showSteamDeck)
        || !!deckVerdict(topic, settings, lookup)?.ok,
    },
  ],
});
