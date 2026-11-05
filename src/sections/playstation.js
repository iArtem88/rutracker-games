'use strict';

// Игры для консолей » PS4 и PS5. Releases state "Минимальная версия прошивки",
// often with a backport for lower firmware ("8.50 + BACKPORT [5.05-6.72]") or
// an upper limit ("4.xx+ - работает только до 11.60"). The badge shows the
// firmware range and warns when mine is outside of it.

const PS_CONSOLES = { 973: 'ps4', 546: 'ps5' };
const PS_NAMES = { ps4: 'PS4', ps5: 'PS5' };
// "Минимальная версия прошивки: ..." / "Требуемая версия прошивки: ..." / "Версия прошивки: ..."
const FIRMWARE_FIELD = /(?<!\p{L})(?:минимальн\p{L}*\s+|требуем\p{L}*\s+)?верси\p{L}*\s+прошивки\s*:\s*(.+)$/iu;
// "5.05", "4.xx", "12.XX", "4.0"; not "v0.4.2.1" or the date "06.09.2026"
const DOTTED_VERSION = /(?<![\d.v])(\d{1,2})\.(\d{1,2}|[xхXХ]{1,2})(?!\.?\d)/g;
// "4xx", "9хх"
const SHORT_VERSION = /(?<![\d.])(\d{1,2})\s?[xхXХ]{2}(?![\p{L}\d])/gu;
const BACKPORT = /backport|backpork|бэкпорт|бекпорт/i;

function psVersion(major, minor) {
  const text = /\d/.test(minor) ? `${Number(major)}.${minor}` : `${Number(major)}.xx`;
  return { value: Number(/\d/.test(minor) ? text : major), text };
}

// {min, max, backport, source}: versions as {value, text}; max may be null
function findFirmware(lines) {
  const line = lines.find((l) => FIRMWARE_FIELD.test(l));
  if (!line) return null;
  const value = FIRMWARE_FIELD.exec(line)[1];
  const found = [];
  for (const m of value.matchAll(DOTTED_VERSION)) found.push({ index: m.index, ...psVersion(m[1], m[2]) });
  for (const m of value.matchAll(SHORT_VERSION)) found.push({ index: m.index, ...psVersion(m[1], 'xx') });
  const versions = found.filter((v) => v.value >= 1 && v.value < 20).sort((a, b) => a.index - b.index);
  if (!versions.length) return null;

  // "работает только до 11.60" / "от 4xx до 13.60", or a range right at the start: "4.xx - 13.60"
  const upTo = /(?<!\p{L})до\s+(\d{1,2}\.\d{1,2})(?!\.?\d)/iu.exec(value);
  const range = /^[^\d]{0,4}\d{1,2}(?:\.\d{1,2}|\.?[xхXХ]{2})\+?\s*[-–—]\s*(\d{1,2}\.\d{1,2})(?!\.?\d)/u.exec(value);
  const maxText = (upTo || range)?.[1];
  const max = maxText ? psVersion(...maxText.split('.')) : null;
  const rest = versions.filter((v) => !max || v.value !== max.value);
  // With a backport ("8.50 + BACKPORT [5.05-6.72]", "8.50 (5.05)") the lowest version counts
  const backport = BACKPORT.test(value) || /\(/.test(value);
  const min = backport && rest.length
    ? rest.reduce((a, b) => (b.value < a.value ? b : a))
    : rest[0] || versions[0];
  return { min, max, backport: BACKPORT.test(value), source: line };
}

function myFirmware(settings, forumId) {
  const fw = parseFloat(String(settings[`${PS_CONSOLES[forumId]}Firmware`] || '').replace(',', '.'));
  return Number.isFinite(fw) ? fw : null;
}

// true / false, or null when my firmware isn't set
function runsOnMine(firmware, settings, forumId) {
  const mine = myFirmware(settings, forumId);
  if (mine === null || !firmware) return null;
  return mine >= firmware.min.value && (!firmware.max || mine <= firmware.max.value);
}

registerSection({
  id: 'playstation',
  // Settings texts are keys of src/locales/*
  title: 'ps.title',
  forumIds: Object.keys(PS_CONSOLES),
  settings: [
    { key: 'showFirmware', label: 'ps.setting.show', type: 'toggle', default: true },
    { key: 'ps4Firmware', label: 'ps.setting.ps4', type: 'number', default: '', placeholder: '9.00' },
    { key: 'ps5Firmware', label: 'ps.setting.ps5', type: 'number', default: '', placeholder: '4.03' },
  ],
  hint: () => t('ps.hint'),
  // Badge colors, see lib/badges.js
  styles: [{
    id: 'ps.firmware',
    cls: 'rts-firmware',
    selector: '.rts-firmware',
    sample: () => t('ps.badge', { range: '5.05+' }),
    colors: { text: '#ffffff', background: '#00695c', border: '#00695c' },
  }],
  parse: (lines) => ({ firmware: findFirmware(lines) }),
  badges(topic, settings, { forumId }) {
    const firmware = topic.extra?.firmware;
    if (!settings.showFirmware || !firmware) return [];
    const runs = runsOnMine(firmware, settings, forumId);
    const range = firmware.max ? `${firmware.min.text}–${firmware.max.text}` : `${firmware.min.text}+`;
    const mine = myFirmware(settings, forumId);
    const myConsole = mine === null ? ''
      : t('ps.mine', { console: PS_NAMES[PS_CONSOLES[forumId]], firmware: mine }) + (runs ? '' : `, ${t('ps.wontRun')}`);
    return [{
      text: `${runs === false ? '⚠ ' : ''}${t('ps.badge', { range })}`,
      cls: 'rts-firmware',
      title: [firmware.source, firmware.backport ? t('ps.backport') : '', myConsole].filter(Boolean).join('\n'),
    }];
  },
  filters: [{
    id: 'fitsPlaystation',
    label: (settings) => t(settings.ps4Firmware || settings.ps5Firmware ? 'ps.filter' : 'ps.filterUnset'),
    test: (topic, settings, { forumId }) => runsOnMine(topic.extra?.firmware, settings, forumId) !== false,
  }],
});
