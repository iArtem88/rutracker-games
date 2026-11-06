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

const IMAGE_URL = /\.(?:jpe?g|png|gif|webp)(?:[?#].*)?$/i;

// The full-size picture behind a thumbnail, worked out from the URLs alone,
// without opening the image host's page: a link straight to a picture, a
// thumbnail that is the full picture already, or the URL schemes of fastpic
// (and its old fastpic.ru) and imageban, the hosts RuTracker recommends; old
// releases have them over http://, the browser asks for pictures over https
// on an https page. null when there's none to have: imagebam gives its
// pictures out only through its own page, and so does fastpic with files
// named "_…" (most of the newer ones), see FASTPIC_PROTECTED.
function fullImage(thumb, link) {
  const full = guessFullImage(thumb, link);
  return full && !FASTPIC_PROTECTED.test(full) ? full : null;
}

// fastpic hands these out only through a signed link on its own page
const FASTPIC_PROTECTED = /\.fastpic\.(?:org|ru)\/big\/.*\/_[^/]*$/i;

// fastpic's page of a picture, marked: in a tab it gives way to the picture
// itself, in our viewer it hands the picture over (see fastpic.js)
const FASTPIC_VIEW = /^https?:\/\/(?:www\.)?fastpic\.(?:org|ru)\/view\//i;
// i128.fastpic.org/big/2026/0923/77/_6c1d….jpg, a "_…" one linked as is (it
// opens no more): its page is fastpic.org/view/128/2026/0923/_6c1d….jpg.html
const FASTPIC_BIG = /^https?:\/\/i(\d+)\.fastpic\.(org|ru)\/big\/(\d{4})\/(\d{4})\/[^/]+\/([^/?#]+)$/i;
function fastpicPage(link) {
  if (FASTPIC_VIEW.test(link)) return `${link.replace(/#.*$/, '')}#rutracker-games`;
  const big = FASTPIC_PROTECTED.test(link) && FASTPIC_BIG.exec(link);
  return big ? `https://fastpic.${big[2]}/view/${big[1]}/${big[3]}/${big[4]}/${big[5]}.html#rutracker-games` : null;
}

// ImgBB's and PostImages' page of a picture: the full one is in its og:image
// (see background.js)
const IMAGE_PAGE = /^https?:\/\/(?:ibb\.co\/[A-Za-z0-9]+|postimg\.cc\/(?:image\/)?[A-Za-z0-9]+)\/?$/i;
const IMAGEBAM = /^https?:\/\/[^/]*imagebam\.com\//i;

// The link of a thumbnail
function hostLink(link) {
  return fastpicPage(link) || link;
}

// Opens in our viewer: a full picture to have, or a page to get it from
function viewable(shot) {
  return Boolean(shot.full || fastpicPage(shot.link) || IMAGE_PAGE.test(shot.link));
}

function guessFullImage(thumb, link) {
  if (link && link !== thumb && IMAGE_URL.test(link)) return link;
  if (/^https?:\/\/i\d+\.fastpic\.(?:org|ru)\/big\//i.test(thumb) || /^https?:\/\/i\d+\.imageban\.ru\/out\//i.test(thumb)) return thumb;
  // i123.fastpic.org/thumb/2024/0325/08/hash.jpeg -> i123.fastpic.org/big/2024/0325/08/hash.jpg,
  // the extension from the link: fastpic.org/view/123/2024/0325/hash.jpg.html
  const fastpic = /^https?:\/\/(i\d+)\.fastpic\.(org|ru)\/thumb\/(.+)\/([^/.]+)\.\w+$/i.exec(thumb);
  const ext = /\/([^/.]+)\.(\w+)\.html$/i.exec(link || '');
  if (fastpic && ext && ext[1] === fastpic[4]) return `https://${fastpic[1]}.fastpic.${fastpic[2]}/big/${fastpic[3]}/${fastpic[4]}.${ext[2]}`;
  // i5.imageban.ru/thumbs/2026.09.29/hash.jpg -> i5.imageban.ru/out/2026/09/29/hash.jpg
  const imageban = /^https?:\/\/(i\d+)\.imageban\.ru\/thumbs\/(\d{4})\.(\d{2})\.(\d{2})\/([^/]+)$/i.exec(thumb);
  if (imageban) return `https://${imageban[1]}.imageban.ru/out/${imageban[2]}/${imageban[3]}/${imageban[4]}/${imageban[5]}`;
  // GOG's own screenshots: <hash>.jpg is the picture, <hash>_<format>.jpg a smaller copy
  const gog = /^https?:\/\/images\.gog-statics\.com\/([0-9a-f]{64})(?:_\w+)?\.(jpe?g|png|webp)$/i.exec(thumb);
  if (gog) return `https://images.gog-statics.com/${gog[1]}.${gog[2]}`;
  // riotpixels: ….jpg.240p.jpg is the thumbnail of ….jpg
  const riotpixels = /^https?:\/\/(s\d+\.riotpixels\.net\/data\/.+\.(?:jpe?g|png))\.\d+p\.jpe?g$/i.exec(thumb);
  if (riotpixels) return `https://${riotpixels[1]}`;
  return null;
}

// [{thumb, link, full}]: the thumbnail, where a click on it leads in the
// release, and the full-size picture if it can be worked out (see fullImage)
function findShots(post) {
  const seen = new Set();
  const shots = [];
  for (const wrap of post.querySelectorAll('.sp-wrap')) {
    if (!SHOTS_HEAD.test(wrap.querySelector(':scope > .sp-head')?.textContent || '')) continue;
    // Spoilers can be nested, hence the dedup
    for (const img of wrap.querySelectorAll(':scope > .sp-body var.postImg')) {
      const thumb = img.getAttribute('title');
      // imagebam gives other sites a "Thumbnail Temporarily Unavailable" stub
      if (!isHttpUrl(thumb) || seen.has(thumb) || IMAGEBAM.test(thumb)) continue;
      seen.add(thumb);
      const href = img.closest('a.postLink')?.getAttribute('href');
      const link = isHttpUrl(href) ? href : thumb;
      shots.push({ thumb, link, full: fullImage(thumb, isHttpUrl(href) ? href : null) });
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

// «Есть мои языки» and «Озвучка на моих языках» are levels of one choice, the
// broadest first: one of them is on at a time (see `group` in registry.js)
const GAME_FILTERS = [
  {
    id: 'myText',
    group: 'language',
    label: () => t('filter.myText'),
    title: (settings) => t('filter.myLanguages', { languages: pickedLanguages(settings, ['voice', 'text']).map(languageName).join(', ') }),
    test: (topic, settings) => pickedLanguages(settings, ['voice', 'text'])
      .some((code) => topic.voices?.[code] || topic.texts?.[code]),
  },
  {
    id: 'myVoice',
    group: 'language',
    label: () => t('filter.myVoice'),
    title: (settings) => t('filter.myVoiceTitle', { languages: pickedLanguages(settings, ['voice']).map(languageName).join(', ') }),
    // A game with no voice-over at all and the text in my language has nothing
    // foreign to hear, so it passes too (the green "без озвучки" badge)
    test: (topic, settings) => pickedLanguages(settings, ['voice'])
      .some((code) => topic.voices?.[code] || (topic.noVoice && topic.texts?.[code])),
  },
];
