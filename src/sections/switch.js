'use strict';

// Игры » Игры для консолей » Switch. On top of the common game badges: whether
// a release needs the console overclocked, and whether Kefir's own overclock is
// enough or it takes 4IFIR ("Чифир"). The badge has two halves: "Желателен" or
// "Обязателен" as the uploader puts it, and Kefir or 4IFIR by how much they
// ask for: 4IFIR when they name it, give clocks above Kefir's or ask for the
// maximum; Kefir otherwise.

// The words the badge goes by, as stems: "рекоменд" is also "рекомендуется".
// The user adds own ones on top, in the settings ("Свои слова").
const OC_WORDS = {
  ocWords: 'разгон|разогн|разгоня|гнать|оверклок|overclock',
  ocAdvised: 'лучше|рекоменд|желател|советую|советуем|советуется|стоит|предпочтител|не помешает|по возможности|recommend|advis|better',
  ocRequired: 'обязател|требу|необходим|нужен|нужна|нужно|нужны|без разгона не|только с разгоном|require|must|mandatory|need',
  ocNone: 'не обязател|не требу|не нужен|не нужна|не нужно|без разгона|на штатных частотах|на стоковых частотах|not required|not needed|no overclock|without overclock',
  ocMax: 'максимал|максимум|на полную|до предела|max',
  ocChifir: '4ifir|4 ifir|4-ifir|чифир|chifir',
  ocKefir: 'кефир|kefir',
};
// The start of a word: \b knows no Cyrillic
const WORD_START = '(?<![\\p{L}\\d])';
const OC_RANK = { none: 1, recommended: 2, required: 3 };
// "CPU: 1963 MHz" / "2397 МГц CPU"
const FREQ_UNIT_FIRST = /(\d{3,4})(?:[.,]\d+)?\s*(?:МГц|MHz)\s*(?:на\s+|по\s+)?(CPU|GPU|RAM|MEM|EMC)\b/gi;
const FREQ_UNIT_LAST = /\b(CPU|GPU|RAM|MEM|EMC)\b[^\d\n]{0,15}?(\d{3,4})/gi;
const UNITS = { cpu: 'CPU', gpu: 'GPU', ram: 'RAM' };

// Kefir's own overclock, MHz. Its kefir.kip DVFS tables top out at CPU 2193 /
// GPU 1267 / RAM 2131 on Mariko and CPU 2091 / GPU 921 / RAM 1862 on Erista,
// and its sys-clk-OC keeps the CPU at the safe 1963 / 1785 unless
// allow_unsafe_freq is set by hand. Higher clocks take 4IFIR.
const KEFIR_LIMITS = {
  mariko: { cpu: 1963.5, gpu: 1267.2, ram: 2131.2 },
  erista: { cpu: 1785, gpu: 921.6, ram: 1862.4 },
};
const REVISIONS = { mariko: 'Mariko', erista: 'Erista' };

function parseFreqs(line, freqs) {
  const found = {};
  const add = (unit, value) => {
    const key = { CPU: 'cpu', GPU: 'gpu' }[unit.toUpperCase()] || 'ram';
    if (found[key]) return;
    found[key] = true;
    freqs[key] = Math.max(freqs[key] || 0, Number(value));
  };
  // "2397 МГц CPU / 1228 МГц GPU": take these first, or 1228 would go to the CPU
  for (const [, value, unit] of line.matchAll(FREQ_UNIT_FIRST)) add(unit, value);
  for (const [, unit, value] of line.matchAll(FREQ_UNIT_LAST)) add(unit, value);
  return Object.keys(found).length > 0;
}

function wordList(key, settings) {
  return `${OC_WORDS[key]}|${settings?.[key] || ''}`.split('|').map((word) => word.trim().toLowerCase()).filter(Boolean);
}

// "не помешает" also with two spaces or a line break between the words
function anyOf(words) {
  return words.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')).join('|');
}

let rulesCache = null;

// The words compiled, built-in and the user's own
function overclockRules(settings) {
  const key = Object.keys(OC_WORDS).map((name) => settings?.[name] || '').join('\n');
  if (rulesCache?.key === key) return rulesCache.rules;
  const list = (name) => wordList(name, settings);
  const re = (source, flags = 'iu') => new RegExp(source, flags);
  const oc = list('ocWords');
  const chifir = list('ocChifir');
  const ocWord = re(`${WORD_START}(?:${anyOf(oc)})`);
  // A word next to an overclock word, before or after it. One that has an
  // overclock word in it ("без разгона не") is enough on its own.
  const near = (words, targets) => {
    const plain = words.filter((word) => !ocWord.test(word));
    const whole = words.filter((word) => ocWord.test(word));
    const parts = [];
    if (plain.length) {
      parts.push(`${WORD_START}(?:${anyOf(plain)})\\S*\\s+(?:\\S+\\s+){0,3}?${WORD_START}(?:${anyOf(targets)})\\S*`);
      parts.push(`${WORD_START}(?:${anyOf(targets)})\\S*\\s+(?:\\S+\\s+){0,2}?${WORD_START}(?:${anyOf(plain)})\\S*`);
    }
    if (whole.length) parts.push(`${WORD_START}(?:${anyOf(whole)})\\S*`);
    return re(parts.join('|'));
  };
  // "Не нужен", but not "без разгона": what denies 4IFIR
  const denials = list('ocNone').filter((word) => !ocWord.test(word));
  const rules = {
    word: re(`${WORD_START}(?:${anyOf([...oc, ...chifir])})`),
    none: near(list('ocNone'), oc),
    required: near(list('ocRequired'), [...oc, ...chifir]),
    recommended: near(list('ocAdvised'), [...oc, ...chifir]),
    max: re(`${WORD_START}(?:${anyOf(list('ocMax'))})`),
    chifir: re(`${WORD_START}(?:${anyOf(chifir)})`),
    kefir: re(`${WORD_START}(?:${anyOf(list('ocKefir'))})`),
    // "без Чифира", "не нужен 4IFIR", "4IFIR не обязателен"
    chifirDenied: re(`${WORD_START}(?:без|${anyOf(denials)})\\S*\\s+(?:${anyOf(chifir)})\\S*`
      + `|${WORD_START}(?:${anyOf(chifir)})\\S*[\\s—–-]+(?:${anyOf(denials)})\\S*`, 'giu'),
    // "sysmodule разгона", "модуль разгона": a tool, not a call to overclock
    tool: re(`${WORD_START}(?:sysmodule|сисмодул|модул|sys-?clk|оверле|плагин|утилит)\\S*\\s+(?:${anyOf(oc)})\\S*`, 'giu'),
  };
  rulesCache = { key, rules };
  return rules;
}

// none, required or recommended, as the sentence puts it. A must outweighs a
// should ("стоит обязательно разогнать"); "not needed" wins when its match is
// no shorter: "не нужен разгон" over "нужен разгон", but "без разгона не" over
// "без разгона".
function wording(sentence, rules) {
  const length = (level) => rules[level].exec(sentence)?.[0].length || 0;
  const none = length('none');
  const required = length('required');
  const asked = required ? 'required' : length('recommended') ? 'recommended' : null;
  return none && none >= (required || length('recommended')) ? 'none' : asked;
}

// {level: required|recommended|none, freqs: {cpu, gpu, ram}, fw: '4ifir'|'kefir'|null, max, quote}, or null
function findOverclock(lines, settings) {
  const rules = overclockRules(settings);
  let level = null;
  let named = null;
  let max = false;
  const freqs = {};
  const quotes = [];
  for (const line of lines) {
    if (/МГц|MHz/i.test(line) && parseFreqs(line, freqs)) quotes.push(line);
    for (const said of line.split(/(?<=[.!?;])\s+/)) {
      // "Работает и без Чифира" says nothing about 4IFIR, "sysmodule разгона" nothing at all
      const sentence = said.replace(rules.chifirDenied, ' ').replace(rules.tool, ' ');
      if (!rules.word.test(sentence)) continue;
      const chifir = rules.chifir.test(sentence);
      let found = wording(sentence, rules);
      // Named outright: a release for 4IFIR, required unless only advised
      if (chifir && found !== 'recommended') found = 'required';
      if (!found) continue;
      if (!quotes.includes(line)) quotes.push(said);
      if (OC_RANK[found] > (OC_RANK[level] || 0)) level = found;
      if (found === 'none') continue;
      if (chifir) named = '4ifir';
      else if (!named && rules.kefir.test(sentence)) named = 'kefir';
      if (rules.max.test(sentence)) max = true;
    }
  }
  // Only the clocks the uploader tested with
  if (!level && Object.keys(freqs).length) level = 'recommended';
  if (!level) return null;
  return { level, freqs, fw: named, max, quote: quotes.join(' … ').slice(0, 400) };
}

// What the release takes on a console of this revision: {fw: 'kefir'|'4ifir', why}
function neededFirmware({ freqs, fw, max }, revision) {
  if (fw === '4ifir') return { fw, why: t('switch.why.named') };
  const limits = KEFIR_LIMITS[revision] || KEFIR_LIMITS.mariko;
  const known = Object.keys(freqs);
  const over = known.filter((key) => freqs[key] > limits[key]);
  const name = REVISIONS[revision] || REVISIONS.mariko;
  if (over.length) {
    const list = over.map((key) => `${UNITS[key]} ${freqs[key]} > ${Math.floor(limits[key])}`).join(', ');
    return { fw: '4ifir', why: t('switch.why.over', { revision: name, list }) };
  }
  if (known.length) {
    const list = known.map((key) => `${UNITS[key]} ${freqs[key]}`).join(', ');
    return { fw: 'kefir', why: t('switch.why.within', { revision: name, list }) };
  }
  // "Максимальный разгон Кефира" is Kefir's
  if (fw === 'kefir') return { fw, why: t('switch.why.kefirNamed') };
  if (max) return { fw: '4ifir', why: t('switch.why.max') };
  return { fw: 'kefir', why: t('switch.why.unknown') };
}

// From no overclock up to 4IFIR's
const FIRMWARE_TIERS = { stock: 0, kefir: 1, '4ifir': 2 };

// Whether the release asks for no more overclock than mine, required or only
// recommended: a release made for 4IFIR is no good on Kefir either way
function fitsConsole(oc, settings) {
  if (!oc || oc.level === 'none') return true;
  const needed = neededFirmware(oc, settings.switchRevision).fw;
  return FIRMWARE_TIERS[needed] <= (FIRMWARE_TIERS[settings.switchFirmware] ?? FIRMWARE_TIERS.kefir);
}

function overclockBadge(oc, settings) {
  if (oc.level === 'none') return { text: t('switch.badge.none'), cls: 'rts-oc-none', title: oc.quote };
  const { fw, why } = neededFirmware(oc, settings.switchRevision);
  const required = oc.level === 'required';
  const fits = fitsConsole(oc, settings);
  const mine = t('switch.mine', { fw: t(`switch.fw.${settings.switchFirmware}`), revision: REVISIONS[settings.switchRevision] });
  return {
    text: `${fits ? '' : '⚠ '}${t(required ? 'switch.badge.required' : 'switch.badge.recommended', { fw: t(`switch.name.${fw}`) })}`,
    cls: `${fw === '4ifir' ? 'rts-oc-chifir' : 'rts-oc-kefir'}${required ? '' : ' rts-soft'}`,
    title: `${why}\n${mine}${fits ? '' : `: ${t('switch.cant')}`}\n\n«${oc.quote}»`,
  };
}

registerSection({
  id: 'switch',
  // Settings texts are keys of src/locales/*
  title: 'switch.title',
  forumIds: ['1605'],
  settings: [
    { key: 'showOverclock', label: 'switch.setting.show', type: 'toggle', default: true },
    {
      key: 'switchRevision',
      label: 'switch.setting.revision',
      type: 'select',
      default: 'mariko',
      options: { mariko: 'switch.revision.mariko', erista: 'switch.revision.erista' },
    },
    {
      key: 'switchFirmware',
      label: 'switch.setting.firmware',
      type: 'select',
      default: 'kefir',
      options: { stock: 'switch.fw.stock', kefir: 'switch.fw.kefir', '4ifir': 'switch.fw.4ifir' },
    },
    // "Свои слова": the user's words on top of OC_WORDS
    ...Object.entries(OC_WORDS).map(([key, builtIn]) => ({ key, label: `switch.words.${key}`, type: 'words', builtIn, default: '' })),
  ],
  // Badge colors, see lib/badges.js
  styles: [
    ...['kefir', '4ifir'].flatMap((fw) => {
      const cls = fw === 'kefir' ? 'rts-oc-kefir' : 'rts-oc-chifir';
      const color = fw === 'kefir' ? '#1565c0' : '#6a1b9a';
      return [
        {
          id: `switch.${fw}Required`,
          cls,
          selector: `.${cls}:not(.rts-soft)`,
          sample: () => t('switch.badge.required', { fw: t(`switch.name.${fw}`) }),
          colors: { text: '#ffffff', background: color, border: color },
        },
        {
          id: `switch.${fw}Recommended`,
          cls: `${cls} rts-soft`,
          selector: `.${cls}.rts-soft`,
          sample: () => t('switch.badge.recommended', { fw: t(`switch.name.${fw}`) }),
          colors: { text: color, background: '#ffffff', border: color },
        },
      ];
    }),
    {
      id: 'switch.none',
      cls: 'rts-oc-none',
      selector: '.rts-oc-none',
      sample: () => t('switch.badge.none'),
      colors: { text: '#ffffff', background: '#607d8b', border: '#607d8b' },
    },
  ],
  hint(settings) {
    const limits = KEFIR_LIMITS[settings.switchRevision] || KEFIR_LIMITS.mariko;
    return t('switch.hint', {
      revision: REVISIONS[settings.switchRevision] || REVISIONS.mariko,
      cpu: Math.floor(limits.cpu),
      gpu: Math.floor(limits.gpu),
      ram: Math.floor(limits.ram),
    });
  },
  parse: (lines, title, post, settings) => ({ overclock: findOverclock(lines, settings) }),
  badges(topic, settings) {
    const oc = topic.extra?.overclock;
    return settings.showOverclock && oc ? [overclockBadge(oc, settings)] : [];
  },
  filters: [{
    id: 'fitsConsole',
    label: (settings) => t('switch.filter', { fw: t(`switch.fw.${settings.switchFirmware}`) }),
    test: (topic, settings) => fitsConsole(topic.extra?.overclock, settings),
  }],
});
