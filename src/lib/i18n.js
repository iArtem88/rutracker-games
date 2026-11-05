'use strict';

// Interface languages, in the order the settings list them: English, then
// Ukrainian and Russian, then the rest. The same languages can be picked for
// the voice-over and text badges. Each has a file in src/locales/.
const LANGUAGES = ['en', 'uk', 'ru', 'de', 'fr', 'es', 'it', 'pl', 'pt', 'ja'];
const NATIVE_NAMES = {
  en: 'English',
  uk: 'Українська',
  ru: 'Русский',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  it: 'Italiano',
  pl: 'Polski',
  pt: 'Português',
  ja: '日本語',
};
// Filled by src/locales/*.js
const LOCALES = {};

let uiLanguage = 'en';

// 'auto' follows the browser, falling back to English
function setUiLanguage(choice) {
  const browser = (globalThis.navigator?.language || 'en').slice(0, 2).toLowerCase();
  if (LANGUAGES.includes(choice)) uiLanguage = choice;
  else uiLanguage = LANGUAGES.includes(browser) ? browser : 'en';
}

// t('filter.status', {hidden: 2, total: 5}) -> "Hidden 2 of 5"
function t(key, params = {}) {
  const text = LOCALES[uiLanguage]?.[key] ?? LOCALES.en[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? ''));
}

// "Russian" in the interface language, for the languages table
function languageName(code) {
  const name = new Intl.DisplayNames([uiLanguage], { type: 'language' }).of(code);
  return name.charAt(0).toLocaleUpperCase(uiLanguage) + name.slice(1);
}

// Badge texts: a locale may give each language its own words (Russian and
// Ukrainian adjectives agree with the noun), else the template with its name.
// `inside`: in parentheses after another badge text ("(английская озвучка)")
function voiceLabel(code, { inside = false } = {}) {
  const form = LOCALES[uiLanguage]?.forms?.[code]?.[0];
  if (form) return inside ? form.charAt(0).toLocaleLowerCase(uiLanguage) + form.slice(1) : form;
  return t('badge.voice', { language: new Intl.DisplayNames([uiLanguage], { type: 'language' }).of(code) });
}

function textLabel(code) {
  return LOCALES[uiLanguage]?.forms?.[code]?.[1]
    ?? t('badge.text', { language: new Intl.DisplayNames([uiLanguage], { type: 'language' }).of(code) });
}
