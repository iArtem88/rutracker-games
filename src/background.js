'use strict';

// Requests a content script can't make itself:
// - open the options page (the filter bar's "Настройки" button);
// - Valve's Steam Deck rating of a game (Windows section). Steam doesn't allow
//   cross-site requests from pages, and the user grants access to it when
//   turning the feature on;
// - the full picture of an ImgBB or PostImages screenshot, opened in the
//   viewer: its page names it in og:image, the tag that's there for link
//   previews.
const ext = globalThis.browser ?? globalThis.chrome;

const STEAM = 'https://store.steampowered.com';
const STEAM_PERMISSION = { origins: [`${STEAM}/*`] };
const STEAM_PREFIX = 'steam:';
const STEAM_TTL = 14 * 24 * 60 * 60 * 1000;

// "The Witcher 3: Wild Hunt" -> "the witcher 3 wild hunt"
function normalizeName(name) {
  return name.toLowerCase().replace(/[’'`]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

async function cached(key, compute) {
  const { [key]: hit } = await ext.storage.local.get(key);
  if (hit && Date.now() - hit.time < STEAM_TTL) return hit.value;
  const value = await compute();
  await ext.storage.local.set({ [key]: { time: Date.now(), value } });
  return value;
}

async function getJson(url) {
  const res = await fetch(url, { credentials: 'omit' });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

// Only an exact name match: a wrong game's rating is worse than none
async function findSteamApp(name) {
  const { items = [] } = await getJson(`${STEAM}/api/storesearch/?term=${encodeURIComponent(name)}&l=english&cc=US`);
  return items.find((item) => normalizeName(item.name) === normalizeName(name))?.id ?? null;
}

// Valve's resolved_category: 3 verified, 2 playable, 1 unsupported, 0 not tested
async function deckCategory(appId) {
  const data = await getJson(`${STEAM}/saleaction/ajaxgetdeckappcompatibilityreport?nAppID=${appId}&l=russian`);
  return data?.results?.resolved_category ?? 0;
}

// {appId, category}, or null when the game isn't found or Steam isn't allowed
async function steamDeck({ appId, name }) {
  if (!(await ext.permissions.contains(STEAM_PERMISSION))) return null;
  const id = appId || (name && await cached(`${STEAM_PREFIX}app:${normalizeName(name)}`, () => findSteamApp(name)));
  if (!id) return null;
  return { appId: String(id), category: await cached(`${STEAM_PREFIX}deck:${id}`, () => deckCategory(id)) };
}

// The pages read, and the pictures they may name:
// https://ibb.co/d4DJp6fq -> https://i.ibb.co/CKQs9vwZ/name.jpg (ibb.co.com is
// ImgBB too)
const PAGE_PICTURES = [
  [/^https?:\/\/ibb\.co(?:\.com)?\/[A-Za-z0-9]+\/?$/i, /^https:\/\/i\.ibb\.co(?:\.com)?\/[^\s"'<>]+$/],
  [/^https?:\/\/postimg\.cc\/(?:image\/)?[A-Za-z0-9]+\/?$/i, /^https:\/\/i\.postimg\.cc\/[^\s"'<>]+$/],
];

async function pagePicture({ link }) {
  const [, picture] = PAGE_PICTURES.find(([page]) => page.test(link || '')) || [];
  if (!picture) return null;
  const res = await fetch(link.replace(/^http:/, 'https:'), { credentials: 'omit' });
  if (!res.ok) return null;
  const meta = /<meta\s[^>]*property=["']og:image["'][^>]*>/i.exec(await res.text())?.[0] || '';
  const url = /\scontent=["']([^"']+)["']/i.exec(meta)?.[1];
  return url && picture.test(url) ? url : null;
}

async function pruneSteamCache() {
  const all = await ext.storage.local.get(null);
  const stale = Object.keys(all).filter((key) => key.startsWith(STEAM_PREFIX) && Date.now() - all[key].time > STEAM_TTL);
  if (stale.length) await ext.storage.local.remove(stale);
}

ext.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'openOptions') {
    ext.runtime.openOptionsPage();
  } else if (message?.type === 'steamDeck') {
    steamDeck(message).then(sendResponse, (err) => {
      console.warn('[RuTracker Games] Steam', err);
      sendResponse(null);
    });
    // The answer comes later
    return true;
  } else if (message?.type === 'pagePicture') {
    pagePicture(message).then(sendResponse, (err) => {
      console.warn('[RuTracker Games] image host', err);
      sendResponse(null);
    });
    return true;
  }
  return false;
});

ext.runtime.onStartup.addListener(pruneSteamCache);
