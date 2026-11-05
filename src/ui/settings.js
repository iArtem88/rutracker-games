'use strict';

// The toolbar popup (settings.html?popup, the short version) and the options page.

const isPopup = new URLSearchParams(location.search).has('popup');
let settings = null;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

async function save(patch) {
  settings = await saveSettings(patch);
}

// The same locale and section files the content script runs, in the manifest's order
async function loadScripts() {
  const files = ext.runtime.getManifest().content_scripts[0].js
    .filter((file) => file.startsWith('locales/') || file.startsWith('sections/'));
  for (const file of files) {
    await new Promise((resolve) => {
      const script = el('script');
      script.src = `../${file}`;
      script.onload = resolve;
      script.onerror = resolve;
      document.head.append(script);
    });
  }
}

function translate(root) {
  root.querySelectorAll('[data-i18n]').forEach((node) => { node.textContent = t(node.dataset.i18n); });
  root.querySelectorAll('[data-i18n-title]').forEach((node) => { node.title = t(node.dataset.i18nTitle); });
  root.querySelectorAll('[data-i18n-placeholder]').forEach((node) => { node.placeholder = t(node.dataset.i18nPlaceholder); });
}

// --- On/off switches, the thumbnail size, the interface language

function bindSwitches(root) {
  for (const input of root.querySelectorAll('input[data-key]')) {
    input.checked = !!settings[input.dataset.key];
    input.addEventListener('change', () => save({ [input.dataset.key]: input.checked }));
  }
}

function bindThumbSize() {
  const buttons = document.querySelectorAll('#thumb-size button');
  const mark = () => buttons.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.height) === settings.thumbHeight)));
  for (const button of buttons) {
    button.addEventListener('click', async () => {
      await save({ thumbHeight: Number(button.dataset.height) });
      mark();
    });
  }
  mark();
}

function bindUiLanguage() {
  const select = document.getElementById('ui-language');
  for (const value of ['auto', ...LANGUAGES]) {
    const option = el('option', '', value === 'auto' ? t('ui.auto') : NATIVE_NAMES[value]);
    option.value = value;
    select.append(option);
  }
  select.value = settings.uiLanguage;
  select.addEventListener('change', async () => {
    await save({ uiLanguage: select.value });
    // Every text on the page changes
    location.reload();
  });
}

// --- My languages: a voice-over and a text badge per language

function renderLanguages() {
  const body = document.getElementById('languages');
  for (const code of LANGUAGES) {
    const row = el('tr');
    const name = el('td', '', languageName(code));
    if (NATIVE_NAMES[code] !== languageName(code)) name.append(el('span', 'muted', ` · ${NATIVE_NAMES[code]}`));
    row.append(name);
    for (const kind of ['voice', 'text']) {
      const cell = el('td');
      const box = el('input');
      box.type = 'checkbox';
      box.checked = !!settings.languages?.[code]?.[kind];
      box.setAttribute('aria-label', `${languageName(code)}: ${t(`ui.${kind}`)}`);
      box.addEventListener('change', () => {
        const languages = { ...settings.languages, [code]: { ...settings.languages?.[code], [kind]: box.checked } };
        save({ languages });
      });
      cell.append(box);
      row.append(cell);
    }
    body.append(row);
  }
}

// --- What the sections declare: a card per section with settings

function sectionControl(setting, refreshHint) {
  const row = el('label', 'row');
  row.append(el('span', '', t(setting.label)));
  let input;
  if (setting.type === 'toggle') {
    const wrap = el('span', 'switch');
    input = el('input');
    input.type = 'checkbox';
    input.checked = !!settings[setting.key];
    input.addEventListener('change', async () => {
      // Access to another site (Steam) is asked for when the feature is turned on
      if (setting.permissions && input.checked && !(await ext.permissions.request(setting.permissions))) {
        input.checked = false;
        return;
      }
      if (setting.permissions && !input.checked) await ext.permissions.remove(setting.permissions);
      save({ [setting.key]: input.checked });
    });
    wrap.append(input, el('span', 'slider'));
    row.append(wrap);
    return row;
  }
  if (setting.type === 'select') {
    input = el('select');
    for (const [value, label] of Object.entries(setting.options)) {
      const option = el('option', '', t(label));
      option.value = value;
      input.append(option);
    }
    input.value = settings[setting.key];
  } else {
    input = el('input');
    input.type = 'text';
    input.inputMode = 'decimal';
    input.className = 'short';
    input.placeholder = setting.placeholder ? t('ui.placeholder', { example: setting.placeholder }) : '';
    input.value = settings[setting.key] ?? '';
  }
  input.addEventListener('change', async () => {
    await save({ [setting.key]: input.value.trim() });
    refreshHint();
  });
  row.append(input);
  return row;
}

// "Свои слова": the words a section's badges go by, the built-in ones and the
// user's own on top
function ownWords(words) {
  const details = el('details', 'own-words');
  details.append(el('summary', '', t('ui.ownWords')), el('p', 'muted hint-top', t('ui.ownWordsHint')));
  for (const setting of words) {
    const row = el('label', 'words-row');
    const input = el('input');
    input.type = 'text';
    input.placeholder = t('ui.ownWordsPlaceholder');
    input.value = settings[setting.key] || '';
    input.addEventListener('change', () => save({ [setting.key]: input.value.trim() }));
    row.append(el('span', 'words-label', t(setting.label)), el('span', 'muted words-builtin', setting.builtIn.split('|').join(' · ')), input);
    details.append(row);
  }
  return details;
}

function renderSections() {
  const root = document.getElementById('sections');
  for (const section of SECTIONS.filter((s) => s.settings?.length)) {
    const card = el('section', 'card full-only');
    card.append(el('h2', '', t(section.title)));
    const hint = el('p', 'muted hint');
    const refreshHint = () => {
      hint.textContent = section.hint ? section.hint(settings) : '';
    };
    const words = section.settings.filter((setting) => setting.type === 'words');
    for (const setting of section.settings.filter((s) => s.type !== 'words')) card.append(sectionControl(setting, refreshHint));
    refreshHint();
    card.append(hint);
    if (words.length) card.append(ownWords(words));
    root.append(card);
  }
}

// --- The user's own badges

function renderCustomBadges() {
  const root = document.getElementById('custom-badges');
  const template = document.getElementById('badge-row');
  root.textContent = '';
  settings.customBadges.forEach((badge, index) => {
    const row = template.content.firstElementChild.cloneNode(true);
    translate(row);
    const update = (patch) => {
      const customBadges = settings.customBadges.map((b, i) => (i === index ? { ...b, ...patch } : b));
      return save({ customBadges });
    };
    const enabled = row.querySelector('.badge-enabled');
    enabled.checked = badge.enabled;
    enabled.addEventListener('change', () => update({ enabled: enabled.checked }));

    const label = row.querySelector('.badge-label');
    label.value = badge.label;
    label.addEventListener('change', () => update({ label: label.value.trim() || t('ui.badgeDefault') }));

    const pattern = row.querySelector('.badge-pattern');
    pattern.value = badge.pattern;
    const check = () => pattern.classList.toggle('invalid', !compilePattern(pattern.value));
    pattern.addEventListener('input', check);
    pattern.addEventListener('change', () => update({ pattern: pattern.value.trim() }));
    check();

    const color = row.querySelector('.badge-color');
    for (const value of BADGE_COLORS) {
      const option = el('option', '', '■');
      option.value = value;
      option.style.color = value;
      color.append(option);
    }
    color.value = badge.color;
    color.style.color = badge.color;
    color.addEventListener('change', () => {
      color.style.color = color.value;
      update({ color: color.value });
    });

    const filter = row.querySelector('.badge-filter input');
    filter.checked = badge.filter;
    filter.addEventListener('change', () => update({ filter: filter.checked }));

    row.querySelector('.badge-delete').addEventListener('click', async () => {
      await save({ customBadges: settings.customBadges.filter((_, i) => i !== index) });
      renderCustomBadges();
    });
    root.append(row);
  });
}

async function addCustomBadge() {
  const badge = {
    id: Date.now().toString(36),
    label: t('ui.newBadge'),
    pattern: '',
    color: BADGE_COLORS[settings.customBadges.length % BADGE_COLORS.length],
    filter: false,
    enabled: true,
  };
  await save({ customBadges: [...settings.customBadges, badge] });
  renderCustomBadges();
  document.querySelector('#custom-badges .badge-row:last-child .badge-label').select();
}

// --- Appearance: the colors of every badge

const COLOR_PARTS = ['text', 'background', 'border'];

function colorRow(sampleText, cls, colors, { onInput, onChange, onReset }) {
  const row = el('tr');
  const preview = el('span', `rts-badge ${cls || ''}`, sampleText);
  const previewCell = el('td');
  previewCell.append(preview);
  row.append(previewCell);
  for (const part of COLOR_PARTS) {
    const cell = el('td');
    const input = el('input');
    input.type = 'color';
    input.value = colors[part];
    input.title = t(`ui.color${part[0].toUpperCase()}${part.slice(1)}`);
    input.addEventListener('input', () => onInput(part, input.value, preview));
    input.addEventListener('change', () => onChange(part, input.value));
    cell.append(input);
    row.append(cell);
  }
  const resetCell = el('td');
  const reset = el('button', 'icon-button', '↺');
  reset.type = 'button';
  reset.title = t('ui.reset');
  reset.addEventListener('click', onReset);
  resetCell.append(reset);
  row.append(resetCell);
  return row;
}

function colorTable(title, rows) {
  const card = el('section', 'card');
  card.append(el('h2', '', title));
  const table = el('table', 'colors');
  const head = el('tr');
  head.append(el('th'), ...COLOR_PARTS.map((part) => el('th', '', t(`ui.color${part[0].toUpperCase()}${part.slice(1)}`))), el('th'));
  table.append(head, ...rows);
  card.append(table);
  return card;
}

function setBadgeStyle(id, colors) {
  const badgeStyles = { ...settings.badgeStyles };
  if (colors) badgeStyles[id] = colors;
  else delete badgeStyles[id];
  settings = { ...settings, badgeStyles };
  applyBadgeCss(settings);
}

function renderAppearance() {
  const root = document.getElementById('appearance');
  root.textContent = '';
  applyBadgeCss(settings);
  for (const group of styleGroups()) {
    root.append(colorTable(group.title, group.styles.map((style) => colorRow(
      style.sample(),
      style.cls,
      styleColors(style, settings),
      {
        // Live while picking, saved when the picker closes
        onInput: (part, value) => setBadgeStyle(style.id, { ...styleColors(style, settings), [part]: value }),
        onChange: () => save({ badgeStyles: settings.badgeStyles }),
        onReset: async () => {
          setBadgeStyle(style.id, null);
          await save({ badgeStyles: settings.badgeStyles });
          renderAppearance();
        },
      },
    ))));
  }
  // The user's own badges keep their colors with them
  if (settings.customBadges.length) {
    const fields = { text: 'textColor', background: 'color', border: 'borderColor' };
    root.append(colorTable(t('ui.custom'), settings.customBadges.map((badge, index) => {
      const update = (patch) => settings.customBadges.map((b, i) => (i === index ? { ...b, ...patch } : b));
      const row = colorRow(badge.label, '', customBadgeColors(badge), {
        onInput: (part, value, preview) => {
          settings = { ...settings, customBadges: update({ [fields[part]]: value }) };
          const colors = customBadgeColors(settings.customBadges[index]);
          Object.assign(preview.style, { color: colors.text, background: colors.background, borderColor: colors.border });
        },
        onChange: () => save({ customBadges: settings.customBadges }),
        onReset: async () => {
          await save({ customBadges: update({ textColor: undefined, borderColor: undefined }) });
          renderAppearance();
        },
      });
      const colors = customBadgeColors(badge);
      Object.assign(row.querySelector('.rts-badge').style, { color: colors.text, background: colors.background, borderColor: colors.border });
      return row;
    })));
  }
}

async function resetAllColors() {
  const customBadges = settings.customBadges.map((badge) => ({ ...badge, textColor: undefined, borderColor: undefined }));
  await save({ badgeStyles: {}, customBadges });
  renderAppearance();
}

// --- Tabs (the options page only)

function showTab(name) {
  const tab = name === 'appearance' && !isPopup ? 'appearance' : 'settings';
  document.querySelectorAll('[data-panel]').forEach((panel) => { panel.hidden = panel.dataset.panel !== tab; });
  document.querySelectorAll('[data-tab]').forEach((button) => button.setAttribute('aria-selected', String(button.dataset.tab === tab)));
  if (tab === 'appearance') renderAppearance();
  if (!isPopup) history.replaceState(null, '', `#${tab}`);
}

// --- Cache

async function showCacheInfo() {
  const all = await ext.storage.local.get(null);
  const count = Object.keys(all).filter((key) => key.startsWith(CACHE_PREFIX)).length;
  document.getElementById('cache-info').textContent = count ? t('ui.cacheInfo', { n: count }) : t('ui.cacheEmpty');
}

async function clearCache() {
  const all = await ext.storage.local.get(null);
  // Topic descriptions and Steam Deck ratings (see background.js)
  await ext.storage.local.remove(Object.keys(all).filter((key) => key.startsWith(CACHE_PREFIX) || key.startsWith('steam:')));
  showCacheInfo();
}

// --- Start

async function main() {
  document.body.classList.toggle('popup', isPopup);
  await loadScripts();
  settings = await loadSettings();
  document.documentElement.lang = uiLanguage;
  document.title = isPopup ? 'RuTracker Games' : t('ui.title');
  translate(document);
  const manifest = ext.runtime.getManifest();
  document.getElementById('version').textContent = t('ui.version', { version: manifest.version });
  if (manifest.homepage_url) {
    const link = document.getElementById('project-link');
    link.href = manifest.homepage_url;
    link.hidden = false;
  }
  bindSwitches(document);
  bindThumbSize();
  bindUiLanguage();
  renderLanguages();
  renderSections();
  renderCustomBadges();
  document.getElementById('add-badge').addEventListener('click', addCustomBadge);
  document.getElementById('reset-colors').addEventListener('click', resetAllColors);
  document.querySelectorAll('[data-tab]').forEach((button) => button.addEventListener('click', () => showTab(button.dataset.tab)));
  showTab(location.hash.slice(1));
  document.getElementById('clear-cache').addEventListener('click', clearCache);
  document.getElementById('open-options').addEventListener('click', () => {
    ext.runtime.openOptionsPage();
    window.close();
  });
  showCacheInfo();
}

main();
