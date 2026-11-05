'use strict';

// Ties it together on forum and search pages: finds the release rows of the
// supported sections (src/sections/), loads their topic pages politely and
// caches them, shows thumbnails and badges, and runs the filter bar.

// The cache keeps a release's description (its first post) and parses it anew
// each time, so a new version reads it the new way without loading the topic
// again. The description is loaded again when the release is updated (see
// releaseMark) or after a month.
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000;
// A description this long isn't kept: such a topic is loaded each time
const CACHE_MAX_POST = 200_000;
// Polite to the site: a couple of requests at a time with a pause between them,
// and a long pause when it says it's overloaded
const MAX_PARALLEL = 2;
const REQUEST_GAP_MS = 400;
const BACKOFF_MS = [20_000, 60_000, 180_000];
const THUMB_TIMEOUT_MS = 20_000;

let settings = null;
let entries = [];
// Rules, announcements and other forums' results: hidden while filtering
let otherRows = [];
let customBadges = [];
let filterBar = null;
const queue = [];
let running = 0;
let nextStart = 0;
let backoffs = 0;
let pumpTimer = null;
const observer = new IntersectionObserver((items) => {
  for (const item of items) {
    if (!item.isIntersecting) continue;
    observer.unobserve(item.target);
    request(entries.find((entry) => entry.box === item.target));
  }
}, { rootMargin: '600px 0px' });

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// --- Rows

function forumIdOf(href) {
  return /[?&]f=(\d+)/.exec(href || '')?.[1];
}

// What tells an updated release, as the list shows it: the title (it carries
// the version) and the torrent's size
function releaseMark(row, title) {
  const size = /(\d+(?:[.,]\d+)?)\s*([KMGT]?B)\b/i.exec(row.querySelector('a[href*="dl.php"]')?.textContent || '');
  return { title: title.replace(/\s+/g, ' '), size: size ? `${size[1]} ${size[2].toUpperCase()}` : null };
}

// A size only counts when both lists show it (the forum's and the search's)
function sameRelease(a, b) {
  return a.title === b.title && (!a.size || !b.size || a.size === b.size);
}

// [{row, anchor, topicId, title, mark, forumId, section}]: the box goes right after `anchor`
function findEntries() {
  return findRows().map((entry) => ({ ...entry, mark: releaseMark(entry.row, entry.title) }));
}

function findRows() {
  if (location.pathname.endsWith('/viewforum.php')) {
    const forumId = new URLSearchParams(location.search).get('f');
    const section = sectionForForum(forumId);
    if (!section) return [];
    return [...document.querySelectorAll('tr.hl-tr[data-topic_id]')].flatMap((row) => {
      const anchor = row.querySelector('.vf-col-t-title .torTopic');
      // Releases only: rules and announcements have no torrent
      if (!anchor || !row.querySelector('.vf-col-tor a[href*="dl.php"]')) return [];
      const title = (anchor.querySelector('a.tt-text') || anchor).textContent.trim();
      return [{ row, anchor, topicId: row.dataset.topic_id, title, forumId, section }];
    });
  }
  // tracker.php: search results, each row says its forum
  return [...document.querySelectorAll('tr.hl-tr')].flatMap((row) => {
    const link = row.querySelector('a.tLink');
    const forumId = forumIdOf(row.querySelector('.f-name-col a[href*="f="]')?.getAttribute('href'));
    const section = sectionForForum(forumId);
    const topicId = /[?&]t=(\d+)/.exec(link?.getAttribute('href') || '')?.[1];
    if (!section || !topicId) return [];
    return [{ row, anchor: link.closest('div') || link, topicId, title: link.textContent.trim(), forumId, section }];
  });
}

// --- Cache

// {time, mark, post}: kept while fresh, see CACHE_TTL
function isFresh(cached) {
  return !!cached?.post && Date.now() - cached.time < CACHE_TTL;
}

// The cached post, if the release is still the same
async function readCache(entry) {
  const key = CACHE_PREFIX + entry.topicId;
  const { [key]: cached } = await ext.storage.local.get(key);
  return isFresh(cached) && sameRelease(cached.mark || {}, entry.mark) ? cached.post : null;
}

function writeCache(entry, post) {
  if (post.length > CACHE_MAX_POST) return Promise.resolve();
  return ext.storage.local.set({ [CACHE_PREFIX + entry.topicId]: { time: Date.now(), mark: entry.mark, post } });
}

async function pruneCache() {
  const all = await ext.storage.local.get(null);
  const stale = Object.keys(all).filter((key) => key.startsWith(CACHE_PREFIX) && !isFresh(all[key]));
  if (stale.length) await ext.storage.local.remove(stale);
}

// --- Loading

// The site said no: not a bug of ours, so not for the extension's error list
class HttpError extends Error {}
// Too many requests (429, 5xx, Cloudflare's 403 when it limits the rate) or no connection
class Overloaded extends HttpError {}

// Load the topic once: from the cache, or through the queue
function request(entry) {
  if (!entry || entry.state) return;
  entry.state = 'queued';
  readCache(entry).then((post) => {
    if (post) {
      show(entry, post);
    } else {
      queue.push(entry);
      pump();
    }
  });
}

function pump() {
  clearTimeout(pumpTimer);
  while (running < MAX_PARALLEL && queue.length) {
    const wait = nextStart - Date.now();
    if (wait > 0) {
      pumpTimer = setTimeout(pump, wait);
      return;
    }
    nextStart = Date.now() + REQUEST_GAP_MS;
    running++;
    load(queue.shift()).finally(() => {
      running--;
      pump();
    });
  }
}

async function load(entry) {
  try {
    const res = await fetch(new URL(`viewtopic.php?t=${entry.topicId}`, location.href), { credentials: 'include' })
      // No connection: wait as if the site were busy
      .catch((err) => { throw new Overloaded(err.message); });
    if (res.status === 403 || res.status === 429 || res.status >= 500) throw new Overloaded(`HTTP ${res.status}`);
    if (!res.ok) throw new HttpError(`HTTP ${res.status}`);
    const charset = /charset=([\w-]+)/i.exec(res.headers.get('content-type'))?.[1] || 'windows-1251';
    const html = new TextDecoder(charset).decode(await res.arrayBuffer());
    const post = new DOMParser().parseFromString(html, 'text/html').querySelector('.post_body');
    // A Cloudflare check or a deleted topic
    if (!post) throw new HttpError('no release description on the topic page');
    backoffs = 0;
    // A full storage only costs the cache
    writeCache(entry, post.outerHTML).catch((err) => console.warn('[RuTracker Games] cache', err));
    show(entry, post.outerHTML);
  } catch (err) {
    entry.retries = (entry.retries || 0) + 1;
    if (err instanceof Overloaded && entry.retries <= BACKOFF_MS.length) {
      // The site is busy: pause everything, then start with this topic
      nextStart = Date.now() + BACKOFF_MS[Math.min(backoffs++, BACKOFF_MS.length - 1)];
      queue.unshift(entry);
      return;
    }
    if (err instanceof HttpError) console.info('[RuTracker Games]', entry.topicId, err.message);
    else console.warn('[RuTracker Games]', entry.topicId, err);
    entry.state = 'error';
    render(entry);
    applyFilters();
  }
}

// The release's first post, parsed with the settings of now
function parse(entry) {
  entry.topic = parseTopic(entry.post, entry.title, entry.section, settings);
}

function show(entry, post) {
  entry.state = 'done';
  entry.post = post;
  parse(entry);
  render(entry);
  applyFilters();
  lookUp(entry);
}

// A section's data from elsewhere (Steam Deck rating), not cached with the topic
function lookUp(entry) {
  if (!entry.section.lookup || !entry.topic) return;
  Promise.resolve(entry.section.lookup(entry.topic, settings, context(entry)))
    .then((result) => {
      entry.lookup = result || null;
      render(entry);
      applyFilters();
    })
    .catch((err) => console.warn('[RuTracker Games] lookup', entry.topicId, err));
}

function context(entry) {
  return { forumId: entry.forumId, title: entry.title, lookup: entry.lookup || null, entry };
}

// --- Badges and thumbnails

function compileCustomBadges() {
  customBadges = (settings.customBadges || [])
    .filter((badge) => badge.enabled)
    .map((badge) => ({ ...badge, re: compilePattern(badge.pattern || '') }))
    .filter((badge) => badge.re);
}

function matchesCustom(badge, entry) {
  return badge.re.test(`${entry.title}\n${entry.topic.text || ''}`);
}

function topicBadges(entry) {
  const ctx = context(entry);
  return [
    ...gameBadges(entry.topic, settings),
    ...(entry.section.badges ? entry.section.badges(entry.topic, settings, ctx) : []),
    ...customBadges.filter((badge) => matchesCustom(badge, entry))
      .map((badge) => ({ text: badge.label, colors: customBadgeColors(badge), title: t('custom.tooltip', { pattern: badge.pattern }) })),
  ];
}

function renderBadges(badges) {
  const wrap = el('div', 'rts-badges');
  for (const badge of badges) {
    const node = el(badge.href ? 'a' : 'span', `rts-badge ${badge.cls || ''}`, badge.text);
    if (badge.href) {
      node.href = badge.href;
      node.target = '_blank';
      node.rel = 'noopener';
    }
    if (badge.colors) {
      node.style.color = badge.colors.text;
      node.style.background = badge.colors.background;
      node.style.borderColor = badge.colors.border;
    }
    if (badge.title) node.title = badge.title;
    wrap.append(node);
  }
  return wrap;
}

function renderThumbs(box, shots) {
  const row = el('div', 'rts-row');
  const thumbs = el('div', 'rts-thumbs');
  const more = el('button', 'rts-more');
  more.type = 'button';
  more.hidden = true;
  more.addEventListener('click', () => {
    box.classList.toggle('rts-expanded');
    updateMore();
  });

  // Collapsed, only the first line of thumbnails shows; count the rest
  let scheduled = false;
  function updateMore() {
    scheduled = false;
    const items = [...thumbs.children];
    if (!items.length) return;
    const hidden = items.filter((a) => a.offsetTop > items[0].offsetTop).length;
    more.hidden = hidden === 0;
    more.textContent = box.classList.contains('rts-expanded') ? t('thumbs.less') : t('thumbs.more', { n: hidden });
  }
  function scheduleUpdate() {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(updateMore);
    }
  }

  for (const { thumb, link } of shots) {
    const a = el('a', 'rts-pending');
    a.href = link;
    a.target = '_blank';
    a.rel = 'noopener';
    const img = el('img');
    img.alt = '';
    const drop = () => {
      a.remove();
      if (thumbs.children.length) scheduleUpdate();
      else row.remove();
    };
    img.addEventListener('load', () => {
      a.classList.remove('rts-pending');
      scheduleUpdate();
    });
    // A dead image host, or one blocked where the user is
    img.addEventListener('error', drop);
    setTimeout(() => {
      if (a.classList.contains('rts-pending')) drop();
    }, THUMB_TIMEOUT_MS);
    img.src = thumb;
    a.append(img);
    thumbs.append(a);
  }
  row.append(thumbs, more);
  new ResizeObserver(scheduleUpdate).observe(row);
  return row;
}

function render(entry) {
  const { box } = entry;
  box.className = 'rts-box';
  box.textContent = '';
  box.hidden = false;
  box.removeAttribute('aria-busy');
  box.removeAttribute('title');
  if (entry.state === 'error') {
    box.classList.add('rts-error');
    box.textContent = t('error');
    box.addEventListener('click', () => {
      entry.state = null;
      render(entry);
      request(entry);
    }, { once: true });
    return;
  }
  if (!entry.topic) {
    // A shimmering outline of the badges and thumbnails to come
    box.classList.add('rts-loading');
    box.setAttribute('aria-busy', 'true');
    box.title = t('loading');
    const badges = el('div', 'rts-skeleton-badges');
    badges.append(el('span', 'rts-skeleton rts-skeleton-badge'), el('span', 'rts-skeleton rts-skeleton-badge rts-skeleton-short'));
    box.append(badges);
    if (settings.showShots) {
      const thumbs = el('div', 'rts-skeleton-thumbs');
      for (let i = 0; i < 6; i++) thumbs.append(el('span', 'rts-skeleton rts-skeleton-thumb'));
      box.append(thumbs);
    }
    return;
  }
  const badges = topicBadges(entry);
  const shots = settings.showShots ? entry.topic.shots : [];
  if (badges.length) box.append(renderBadges(badges));
  if (shots.length) box.append(renderThumbs(box, shots));
  box.hidden = !box.children.length;
}

// --- Filters

// Filters for the rows on this page; a section's own filters only judge its rows
function pageFilters() {
  const sections = [...new Set(entries.map((entry) => entry.section))];
  return [
    ...GAME_FILTERS,
    ...sections.flatMap((section) => (section.filters || []).map((filter) => ({ ...filter, section }))),
    ...customBadges.filter((badge) => badge.filter).map((badge) => ({
      id: `custom:${badge.id}`,
      label: () => badge.label,
      test: (topic, _settings, { entry }) => matchesCustom(badge, entry),
    })),
  ];
}

function passes(entry, filters) {
  const ctx = context(entry);
  return filters.every((filter) => (filter.section && filter.section !== entry.section)
    || filter.test(entry.topic, settings, ctx));
}

function applyFilters() {
  const active = pageFilters().filter((filter) => settings.filters[filter.id]);
  let hidden = 0;
  let waiting = 0;
  for (const entry of entries) {
    let hide = false;
    if (active.length && entry.topic) {
      hide = !passes(entry, active);
    } else if (active.length && entry.state !== 'error') {
      waiting++;
      // Filtering needs every release on the page, unless the user spares the
      // site: then a release is checked once scrolled to, and shows till then
      if (settings.filterLoadsAll) request(entry);
    }
    entry.row.classList.toggle('rts-hidden', hide);
    if (hide) hidden++;
  }
  for (const row of otherRows) row.classList.toggle('rts-hidden', active.length > 0);
  updateStatus(active.length, hidden, waiting);
}

function updateStatus(activeCount, hidden, waiting) {
  const status = filterBar?.querySelector('.rts-status');
  if (!status) return;
  if (!activeCount) status.textContent = '';
  else if (waiting) {
    const key = settings.filterLoadsAll ? 'filter.statusWaiting' : 'filter.statusUnchecked';
    status.textContent = t(key, { hidden, total: entries.length, waiting });
  }
  else status.textContent = t('filter.status', { hidden, total: entries.length });
}

function renderFilterBar() {
  filterBar?.remove();
  filterBar = null;
  if (!settings.showFilterBar || !entries.length) return;
  filterBar = el('div', 'rts-filterbar');
  filterBar.append(el('span', 'rts-filterbar-title', t('filter.title')));
  for (const filter of pageFilters()) {
    const chip = el('button', 'rts-chip', filter.label(settings));
    chip.type = 'button';
    if (filter.title) chip.title = filter.title(settings);
    chip.setAttribute('aria-pressed', String(!!settings.filters[filter.id]));
    chip.addEventListener('click', () => {
      const filters = { ...settings.filters, [filter.id]: !settings.filters[filter.id] };
      settings = { ...settings, filters };
      chip.setAttribute('aria-pressed', String(filters[filter.id]));
      applyFilters();
      saveSettings({ filters });
    });
    filterBar.append(chip);
  }
  const settingsButton = el('button', 'rts-settings', t('filter.settings'));
  settingsButton.type = 'button';
  settingsButton.addEventListener('click', () => ext.runtime.sendMessage({ type: 'openOptions' }));
  filterBar.append(el('span', 'rts-status'), settingsButton);
  entries[0].row.closest('table').before(filterBar);
}

// --- Setup

function setup() {
  entries = findEntries();
  const rows = new Set(entries.map((entry) => entry.row));
  otherRows = entries.length ? [...document.querySelectorAll('tr.hl-tr')].filter((row) => !rows.has(row)) : [];
  for (const entry of entries) {
    entry.box = el('div');
    entry.anchor.after(entry.box);
    render(entry);
    observer.observe(entry.box);
  }
  renderFilterBar();
  applyFilters();
}

function teardown() {
  observer.disconnect();
  queue.length = 0;
  for (const entry of entries) {
    entry.box.remove();
    entry.row.classList.remove('rts-hidden');
  }
  entries = [];
  otherRows.forEach((row) => row.classList.remove('rts-hidden'));
  otherRows = [];
  filterBar?.remove();
  filterBar = null;
}

function applySettings(next) {
  const previous = settings;
  const wasEnabled = previous?.enabled;
  settings = next;
  document.documentElement.style.setProperty('--rts-thumb-h', `${settings.thumbHeight}px`);
  applyBadgeCss(settings);
  compileCustomBadges();
  if (!settings.enabled) {
    if (wasEnabled) teardown();
    return;
  }
  if (!wasEnabled) {
    setup();
    return;
  }
  // A filter chip only shows and hides rows: keep the thumbnails as they are
  const withoutFilters = (s) => JSON.stringify({ ...s, filters: null });
  if (withoutFilters(previous) !== withoutFilters(next)) {
    for (const entry of entries) {
      // Own words may read a post differently
      if (entry.post) parse(entry);
      render(entry);
      lookUp(entry);
    }
  }
  renderFilterBar();
  applyFilters();
}

loadSettings().then((loaded) => {
  applySettings(loaded);
  onSettingsChanged(applySettings);
  pruneCache();
});
