'use strict';

// What every game section gets from a topic's first post: thumbnails from the
// "Скриншоты" spoiler(s), the languages of the voice-over and of the text,
// plus the badges and filters built on them. Release descriptions are written
// in Russian, so these are the words looked for, whatever the interface language.

// Some write "Cкриншоты" with a Latin C
const SHOTS_HEAD = /[сc]крин|screen/i;
// "Озвучка: русская, английская" / "• Язык озвучки: ..." / "Язык озвучивания: отсутствует"
const VOICE_FIELD = /^[^\p{L}\p{N}]*(?:язык\s+)?озвуч(?:к[аи]|ивани[яе])\s*:\s*(.+)$/iu;
// "Язык интерфейса: русский" / "Язык интерфейса игры: RUS"
const IFACE_FIELD = /^[^\p{L}\p{N}]*язык\s+интерфейса(?:\s+игры)?\s*:\s*(.+)$/iu;
// PlayStation releases: "Перевод: Текст и Звук" / "Перевод: Текст" / "Перевод: Нет", into Russian
const TRANSLATION_FIELD = /^[^\p{L}\p{N}]*перевод\s*:\s*(.+)$/iu;
const NO_VOICE = /^(?:нет|отсутств|не\s+озвуч|без\s+озвуч)/i;
// How descriptions name each language (see LANGUAGES): in Russian, in English or as a code
const LANGUAGE_NAMES = {
  en: /англ|english|\bENG\b/i,
  uk: /укр(?:аин|\.)|україн|ukrain|\bUKR\b|\bUA\b/i,
  ru: /рус(?:ск|\.)|russian|\bRUS\b/i,
  de: /немец|german|deutsch|\bGER\b|\bDEU\b/i,
  fr: /француз|french|fran[cç]ais|\bFRE\b|\bFRA\b/i,
  es: /испан|spanish|espa[nñ]ol|\bSPA\b|\bESP\b/i,
  it: /итальян|italian|\bITA\b/i,
  pl: /польск|polish|polski|\bPOL\b/i,
  pt: /португал|portug|\bPOR\b|\bPT-?BR\b/i,
  ja: /японск|japan|\bJAP\b|\bJPN?\b/i,
};
// The Russian adjective ("русская озвучка"), the English name ("Russian Voice Mod")
// and the codes in release titles ("RUS sound")
const LANGUAGE_STEMS = {
  en: 'английск', uk: 'украинск', ru: 'русск', de: 'немецк', fr: 'французск',
  es: 'испанск', it: 'итальянск', pl: 'польск', pt: 'португальск', ja: 'японск',
};
const LANGUAGE_ENGLISH = {
  en: 'english', uk: 'ukrainian', ru: 'russian', de: 'german', fr: 'french',
  es: 'spanish', it: 'italian', pl: 'polish', pt: 'portuguese', ja: 'japanese',
};
const TITLE_CODES = {
  en: 'ENG', uk: 'UKR|UA', ru: 'RUS', de: 'GER|DEU', fr: 'FRE|FRA',
  es: 'SPA|ESP', it: 'ITA', pl: 'POL', pt: 'POR', ja: 'JAP|JPN',
};
// Languages the extension doesn't show: they end a language's details too
const OTHER_LANGUAGE = /кита|корей|голланд|чешск|турец|араб|оригинал|выдуман|chinese|korean/i;

function isHttpUrl(url) {
  return /^https?:\/\//i.test(url || '');
}

function findShots(post) {
  const seen = new Set();
  const shots = [];
  for (const wrap of post.querySelectorAll('.sp-wrap')) {
    if (!SHOTS_HEAD.test(wrap.querySelector(':scope > .sp-head')?.textContent || '')) continue;
    // Spoilers can be nested, hence the dedup
    for (const img of wrap.querySelectorAll(':scope > .sp-body var.postImg')) {
      const thumb = img.getAttribute('title');
      if (!isHttpUrl(thumb) || seen.has(thumb)) continue;
      seen.add(thumb);
      const link = img.closest('a.postLink')?.getAttribute('href');
      shots.push({ thumb, link: isHttpUrl(link) ? link : thumb });
    }
  }
  return shots;
}

// The post as trimmed text lines
function postLines(post) {
  const copy = post.cloneNode(true);
  // Spoiler titles and code blocks (bug report templates) say nothing about the game
  copy.querySelectorAll('.sp-head, .c-wrap').forEach((el) => el.remove());
  // A field name ("<b>Язык интерфейса</b>: ...") starts a line even without a <br> before it
  copy.querySelectorAll('.post-b').forEach((el) => {
    if (/^\s*:/.test(el.nextSibling?.textContent || '')) el.before('\n');
  });
  copy.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
  copy.querySelectorAll('div, p, li').forEach((el) => el.append('\n'));
  return copy.textContent.split('\n').map((line) => line.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

function withKinds(label, kinds) {
  return kinds.length ? `${label} (${kinds.join(', ')})` : label;
}

function languagesIn(text) {
  return LANGUAGES.filter((code) => LANGUAGE_NAMES[code].test(text));
}

// A field's value split into parts, each language with its details: the words
// after it up to the next language ("русская, любительская от RG MVO, английская")
function languageParts(value, { ignoreParentheses }) {
  const parts = value.split(/[,;+/]/);
  const found = [];
  parts.forEach((part, i) => {
    // "выдуманный язык (русский в заставке)" is no Russian voice-over
    const named = languagesIn(ignoreParentheses ? part.replace(/\([^)]*\)?/g, '') : part);
    for (const code of named) {
      let details = part;
      for (const next of parts.slice(i + 1)) {
        if (languagesIn(next).length || OTHER_LANGUAGE.test(next)) break;
        details += next;
      }
      found.push({ code, details });
    }
  });
  return found;
}

// "русской озвучки не будет", "без украинской озвучки"
function deniesVoice(text, code) {
  const stem = LANGUAGE_STEMS[code];
  return new RegExp(`(?:без|нет|не\\s+будет)\\s+${stem}\\S*\\s+озвуч|${stem}\\S*\\s+озвуч\\S*\\s+(?:нет|не\\s|отсутств)`, 'i').test(text);
}

// "Синтезированная русская озвучка", "Russian Machine Voice Mod", "русификацию озвучки"
function mentionsVoice(line, code) {
  const stem = LANGUAGE_STEMS[code];
  const m = new RegExp(`${stem}\\S*\\s+((?:\\S+\\s+){0,2})озвуч`, 'i').exec(line);
  if (m && !/текст|интерфейс|субтитр/i.test(m[1]) && !languagesIn(m[1]).length && !OTHER_LANGUAGE.test(m[1])) return true;
  if (new RegExp(`озвуч\\S*\\s+на\\s+${stem}`, 'i').test(line)) return true;
  if (code === 'ru' && /русификац\S*\s+(?:\S+\s+){0,2}озвуч/i.test(line)) return true;
  return new RegExp(`${LANGUAGE_ENGLISH[code]}[\\s\\w+]{0,15}voice`, 'i').test(line);
}

// Keys of the kinds, see 'kind.voice.*'
function voiceKinds(text, title, code) {
  const kinds = [];
  if (/машинн|синтез|нейро|ivona|machine/i.test(text)) kinds.push('machine');
  else if (/любительск|amateur/i.test(text)) kinds.push('amateur');
  if (/для\s+(?:\S+\s+){0,2}глав|частичн/i.test(text)) kinds.push('partial');
  if (/опциональн|скопируйте|разархивируйте|\bmod\b|(?<!\p{L})мод(?:а|ом)?(?!\p{L})/iu.test(text)
    || new RegExp(`\\b(?:${TITLE_CODES[code]})\\b[^\\]]{0,10}\\(voice\\s*mod`, 'i').test(title)) {
    kinds.push('mod');
  }
  return kinds;
}

function textKinds(text) {
  if (/машинн/i.test(text)) return ['machine'];
  if (/любительск/i.test(text)) return ['amateur'];
  return [];
}

// {code: {kinds, source, fromTitle}} in the order the release names them
function findVoices(lines, title) {
  const voices = {};
  const fields = lines.filter((line) => VOICE_FIELD.test(line));
  // Mentions outside the field, usually an optional voice-over mod
  const mentions = (code) => lines.filter((line) => !VOICE_FIELD.test(line) && !deniesVoice(line, code)
    && mentionsVoice(line, code));

  for (const line of fields) {
    const value = VOICE_FIELD.exec(line)[1];
    for (const { code, details } of languageParts(value, { ignoreParentheses: true })) {
      if (voices[code] || deniesVoice(value, code)) continue;
      // "По умолчанию установлена русская озвучка, для английской скопируйте ..." isn't a mod
      const extra = mentions(code).filter((m) => !/по\s+умолчанию/i.test(m));
      voices[code] = { kinds: voiceKinds(`${details} ${extra.join(' ')}`, title, code), source: [line, ...extra].join('\n') };
    }
  }
  for (const code of LANGUAGES) {
    const mention = !voices[code] && mentions(code)[0];
    if (mention) voices[code] = { kinds: voiceKinds(mention, title, code), source: mention };
  }
  const translation = lines.find((line) => TRANSLATION_FIELD.test(line));
  if (!voices.ru && translation && /звук|озвуч/i.test(TRANSLATION_FIELD.exec(translation)[1])) {
    voices.ru = { kinds: [], source: translation };
  }
  // "[RUS (Voice Mod.)]", "[RUS text / RUS sound / USA]"
  for (const code of LANGUAGES) {
    if (voices[code]) continue;
    const codes = TITLE_CODES[code];
    if (new RegExp(`\\b(?:${codes})\\b[^\\]]{0,10}\\(voice`, 'i').test(title)) {
      voices[code] = { kinds: ['mod'], source: title, fromTitle: true };
    } else if (new RegExp(`\\b(?:${codes})\\s+(?:sound|voice)`, 'i').test(title)) {
      voices[code] = { kinds: [], source: title, fromTitle: true };
    }
  }
  return voices;
}

// {code: {kinds, source, fromTitle}} for the interface languages
function findTexts(lines, title) {
  const texts = {};
  const line = lines.find((l) => IFACE_FIELD.test(l));
  if (line) {
    const value = IFACE_FIELD.exec(line)[1];
    // "Multi42 (в т.ч. русский)": here parentheses count
    for (const { code, details } of languageParts(value, { ignoreParentheses: false })) {
      if (!texts[code]) texts[code] = { kinds: textKinds(details), source: line };
    }
    // "Английский [ENG] + опциональный машинный от iks1981" in a [RUS (Mod.)] release
    if (!texts.ru && /машинн|русификатор/i.test(value) && /\bRUS\b/.test(title)) {
      texts.ru = { kinds: textKinds(value), source: line };
    }
  }
  const translation = lines.find((l) => TRANSLATION_FIELD.test(l));
  if (!texts.ru && translation && /текст/i.test(TRANSLATION_FIELD.exec(translation)[1])) {
    texts.ru = { kinds: [], source: translation };
  }
  for (const code of LANGUAGES) {
    if (!texts[code] && new RegExp(`\\b(?:${TITLE_CODES[code]})\\s+text`, 'i').test(title)) {
      texts[code] = { kinds: [], source: title, fromTitle: true };
    }
  }
  return texts;
}

// The first "Озвучка:" says the game isn't voiced at all
function findNoVoice(lines) {
  const line = lines.find((l) => VOICE_FIELD.test(l));
  return line && NO_VOICE.test(VOICE_FIELD.exec(line)[1]) ? line : null;
}

// Kept for the user's own badges (see matchesCustom); the fields come first
const TEXT_LIMIT = 12000;

// {shots, voices, texts, noVoice, text, extra}, or null if the page has no post at all.
// `html` is the topic page, or only its first post (as cached). The settings
// carry the user's own words for the sections (see switch.js).
function parseTopic(html, title, section, settings) {
  const post = new DOMParser().parseFromString(html, 'text/html').querySelector('.post_body');
  if (!post) return null;
  const lines = postLines(post);
  return {
    shots: findShots(post),
    voices: findVoices(lines, title),
    texts: findTexts(lines, title),
    noVoice: findNoVoice(lines),
    text: lines.join('\n').slice(0, TEXT_LIMIT),
    extra: section.parse ? section.parse(lines, title, post, settings) : null,
  };
}

function sourceText({ source, fromTitle }) {
  return fromTitle ? t('source.title', { title: source }) : source;
}

// Badges for the languages ticked in the settings: the voice-over in red; else
// the text: green without voice-over, yellow with one in another language,
// outlined when the release doesn't say
function gameBadges(topic, settings) {
  const badges = [];
  for (const code of LANGUAGES) {
    const pick = settings.languages?.[code] || {};
    const voice = topic.voices?.[code];
    const text = topic.texts?.[code];
    if (pick.voice && voice) {
      badges.push({
        text: withKinds(voiceLabel(code), voice.kinds.map((kind) => t(`kind.voice.${kind}`))),
        cls: 'rts-voice',
        title: sourceText(voice),
      });
    } else if (pick.text && text) {
      const kinds = text.kinds.map((kind) => t(`kind.text.${kind}`));
      const foreign = voice ? null : Object.keys(topic.voices || {}).find((other) => other !== code);
      let cls = 'rts-text rts-soft';
      const notes = [sourceText(text)];
      if (!voice && topic.noVoice) {
        kinds.push(t('kind.text.noVoice'));
        cls = 'rts-text';
        notes.push(topic.noVoice);
      } else if (foreign) {
        kinds.push(voiceLabel(foreign, { inside: true }));
        cls = 'rts-text-foreign';
        notes.push(sourceText(topic.voices[foreign]));
      }
      badges.push({ text: withKinds(textLabel(code), kinds), cls, title: [...new Set(notes)].join('\n') });
    }
  }
  return badges;
}

function pickedLanguages(settings, which) {
  return LANGUAGES.filter((code) => which.some((key) => settings.languages?.[code]?.[key]));
}

const GAME_FILTERS = [
  {
    id: 'myVoice',
    label: () => t('filter.myVoice'),
    title: (settings) => t('filter.myLanguages', { languages: pickedLanguages(settings, ['voice']).map(languageName).join(', ') }),
    test: (topic, settings) => pickedLanguages(settings, ['voice']).some((code) => topic.voices?.[code]),
  },
  {
    id: 'myText',
    label: () => t('filter.myText'),
    title: (settings) => t('filter.myLanguages', { languages: pickedLanguages(settings, ['voice', 'text']).map(languageName).join(', ') }),
    test: (topic, settings) => pickedLanguages(settings, ['voice', 'text'])
      .some((code) => topic.voices?.[code] || topic.texts?.[code]),
  },
];
