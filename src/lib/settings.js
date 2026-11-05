'use strict';

// Settings shared by the content script, the popup and the options page.
// Firefox has promise-based `browser`, Chrome's MV3 `chrome` returns promises too.
const ext = globalThis.browser ?? globalThis.chrome;

const THUMB_HEIGHTS = { small: 64, medium: 84, large: 120 };
const BADGE_COLORS = ['#d32f2f', '#2e7d32', '#1565c0', '#6a1b9a', '#00838f', '#ef6c00', '#5d4037', '#455a64'];

const DEFAULT_SETTINGS = {
  enabled: true,
  // 'auto' (the browser's language, else English) or one of LANGUAGES
  uiLanguage: 'auto',
  showShots: true,
  showFilterBar: true,
  // A filter loads every release on the page at once, or only those scrolled to
  filterLoadsAll: true,
  thumbHeight: THUMB_HEIGHTS.medium,
  // Which filter chips are on, by filter id
  filters: {},
  // The user's badge colors by style id, see lib/badges.js
  badgeStyles: {},
};

// Topic cache in storage.local, see content.js
const CACHE_PREFIX = 'topic:';

// The user's own badges: shown when the topic title or the release text matches
// `pattern`, see compilePattern. Examples, off until the user turns them on.
function exampleCustomBadges() {
  return [
    { id: 'dlc', label: 'DLC', pattern: 'DLC|дополнения|доповнення', color: '#00838f', filter: false, enabled: false },
    {
      id: 'coop',
      label: t('ui.example.coop'),
      pattern: 'кооператив|co-op|split screen|разделённый экран',
      color: '#ef6c00',
      filter: false,
      enabled: false,
    },
    // A regular expression: the overclock wording, as an example of one
    {
      id: 'overclock',
      label: t('ui.example.overclock'),
      pattern: '/(лучше|рекомендуется|желательно).*разгон/',
      color: '#1565c0',
      filter: false,
      enabled: false,
    },
  ];
}

// Voice-over and text badges for Russian, Ukrainian and the interface language
// (not English: nearly every game has it)
function defaultLanguages() {
  const picked = new Set(['ru', 'uk', uiLanguage]);
  picked.delete('en');
  return Object.fromEntries([...picked].map((code) => [code, { voice: true, text: true }]));
}

// Examples added by an update reach those who already have badges of their own,
// once: an example deleted by hand stays deleted
function withExamples(saved) {
  const examples = exampleCustomBadges();
  const examplesSeen = examples.map((badge) => badge.id);
  if (!saved.customBadges) return { customBadges: examples, examplesSeen };
  const seen = new Set(saved.examplesSeen);
  const have = new Set(saved.customBadges.map((badge) => badge.id));
  const added = examples.filter((badge) => !seen.has(badge.id) && !have.has(badge.id));
  return { customBadges: [...saved.customBadges, ...added], examplesSeen };
}

// Defaults of the settings the sections declare (src/sections/*), when loaded
function sectionDefaults() {
  const defaults = {};
  for (const section of typeof SECTIONS === 'undefined' ? [] : SECTIONS) {
    for (const setting of section.settings || []) defaults[setting.key] = setting.default;
  }
  return defaults;
}

async function loadSettings() {
  const { settings = {} } = await ext.storage.sync.get('settings');
  // The interface language comes first: the defaults below depend on it
  setUiLanguage(settings.uiLanguage ?? DEFAULT_SETTINGS.uiLanguage);
  return {
    ...DEFAULT_SETTINGS,
    ...sectionDefaults(),
    languages: defaultLanguages(),
    ...settings,
    ...withExamples(settings),
    filters: { ...DEFAULT_SETTINGS.filters, ...settings.filters },
  };
}

async function saveSettings(patch) {
  const next = { ...(await loadSettings()), ...patch };
  await ext.storage.sync.set({ settings: next });
  return next;
}

function onSettingsChanged(callback) {
  ext.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.settings) loadSettings().then(callback);
  });
}

// "DLC|дополнения": any of the words, any case. "/\bDLC\b/i": a regular expression.
// null if the pattern is empty or broken.
function compilePattern(pattern) {
  const regex = /^\/(.+)\/([a-z]*)$/i.exec(pattern.trim());
  try {
    if (regex) {
      // g and y would make test() remember where it stopped
      const flags = new Set([...regex[2].replace(/[^imsu]/g, ''), 'i']);
      return new RegExp(regex[1], [...flags].join(''));
    }
    const words = pattern.split('|').map((word) => word.trim()).filter(Boolean)
      .map((word) => word.replace(/[.*+?^${}()[\]\\]/g, '\\$&'));
    return words.length ? new RegExp(words.join('|'), 'i') : null;
  } catch {
    return null;
  }
}
