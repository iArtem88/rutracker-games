'use strict';

// The colors of every kind of badge: the defaults here and in the sections
// (`styles` in registerSection), the user's own on the "Внешний вид" tab
// (settings.badgeStyles). Both the page and the settings turn them into CSS.
//
// A style is {id, cls, selector, sample(), colors: {text, background, border}}:
// `cls` is what a badge of this kind carries, `selector` matches exactly it
// (".rts-text" but not the outlined ".rts-text.rts-soft").

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

// The language badges, see games.js
const GAME_STYLES = [
  {
    id: 'voice',
    cls: 'rts-voice',
    selector: '.rts-voice',
    sample: () => voiceLabel('ru'),
    colors: { text: '#ffffff', background: '#d32f2f', border: '#d32f2f' },
  },
  {
    id: 'text',
    cls: 'rts-text',
    selector: '.rts-text:not(.rts-soft)',
    sample: () => `${textLabel('ru')} (${t('kind.text.noVoice')})`,
    colors: { text: '#ffffff', background: '#2e7d32', border: '#2e7d32' },
  },
  {
    id: 'textForeign',
    cls: 'rts-text-foreign',
    selector: '.rts-text-foreign',
    sample: () => `${textLabel('ru')} (${voiceLabel('en', { inside: true })})`,
    colors: { text: '#222222', background: '#fbc02d', border: '#fbc02d' },
  },
  {
    id: 'textUnknown',
    cls: 'rts-text rts-soft',
    selector: '.rts-text.rts-soft',
    sample: () => textLabel('ru'),
    colors: { text: '#2e7d32', background: '#ffffff', border: '#2e7d32' },
  },
];

// [{title, styles}]: the language badges, then each section's
function styleGroups() {
  return [
    { title: t('ui.languages'), styles: GAME_STYLES },
    ...SECTIONS.filter((section) => section.styles?.length)
      .map((section) => ({ title: t(section.title), styles: section.styles })),
  ];
}

// The colors in use: the user's where they are valid, else the defaults
function styleColors(style, settings) {
  const own = settings.badgeStyles?.[style.id] || {};
  return Object.fromEntries(Object.entries(style.colors)
    .map(([part, color]) => [part, HEX_COLOR.test(own[part]) ? own[part] : color]));
}

function badgeCss(settings) {
  return styleGroups().flatMap((group) => group.styles).map((style) => {
    const c = styleColors(style, settings);
    return `.rts-badge${style.selector} { color: ${c.text}; background: ${c.background}; border-color: ${c.border}; }`;
  }).join('\n');
}

// Puts the colors into the document, replacing the previous ones
function applyBadgeCss(settings, doc = document) {
  let node = doc.getElementById('rts-badge-colors');
  if (!node) {
    node = doc.createElement('style');
    node.id = 'rts-badge-colors';
    (doc.head || doc.documentElement).append(node);
  }
  node.textContent = badgeCss(settings);
}

// A user's own badge (see settings.customBadges): one color, or all three
function customBadgeColors(badge) {
  const pick = (color, fallback) => (HEX_COLOR.test(color || '') ? color : fallback);
  const background = pick(badge.color, '#607d8b');
  return { text: pick(badge.textColor, '#ffffff'), background, border: pick(badge.borderColor, background) };
}
