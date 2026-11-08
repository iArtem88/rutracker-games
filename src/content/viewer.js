'use strict';

// The full-size screenshots of a release on top of the page, instead of the
// image host's page with its ads: ← → or the strip of thumbnails below
// between them, Esc or a click beside the picture closes it. It links out to
// no image host's page.

let viewer = null;

// Full pictures to be had only from the host's page, for the one asked for,
// never ahead of time; kept while the page is open (fastpic's links live a day).
// - fastpic's "_…" files: their page, loaded unseen, hands the full picture
//   over (see fastpic.js). Its scripts (the ads) don't run, nor can it take
//   the tab elsewhere;
// - ImgBB, PostImages: the background reads it off the page (they don't let
//   their pages into frames).
const PAGE_TIMEOUT_MS = 15000;
const fromPages = new Map();

function fromFastpicPage(page) {
  return new Promise((resolve) => {
    const frame = document.createElement('iframe');
    frame.className = 'rts-viewer-frame';
    frame.setAttribute('sandbox', 'allow-same-origin');
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    const done = (url) => {
      clearTimeout(timer);
      window.removeEventListener('message', onMessage);
      frame.remove();
      resolve(url);
    };
    const onMessage = (event) => {
      if (event.source !== frame.contentWindow || event.data?.rutrackerGames !== 'fastpic') return;
      const url = event.data.full;
      done(typeof url === 'string' && /^https?:\/\//.test(url) ? url : null);
    };
    const timer = setTimeout(() => done(null), PAGE_TIMEOUT_MS);
    window.addEventListener('message', onMessage);
    frame.src = page;
    document.body.append(frame);
  });
}

function fullFromPage(link) {
  if (!fromPages.has(link)) {
    const page = fastpicPage(link);
    const full = page ? fromFastpicPage(page)
      : extensionAlive() ? ext.runtime.sendMessage({ type: 'pagePicture', link }).catch(() => null) : Promise.resolve(null);
    fromPages.set(link, full);
    // Another try next time
    full.then((url) => url || fromPages.delete(link));
  }
  return fromPages.get(link);
}

function closeViewer() {
  if (!viewer) return;
  const { root, onKey, opener, overflow } = viewer;
  viewer = null;
  document.removeEventListener('keydown', onKey, true);
  document.documentElement.style.overflow = overflow;
  root.remove();
  opener?.focus();
}

// shots: [{thumb, link, full}], see findShots; viewable() ones
function openViewer(shots, index, opener) {
  closeViewer();
  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const button = (className, text, label) => {
    const node = make('button', className, text);
    node.type = 'button';
    node.title = label;
    node.setAttribute('aria-label', label);
    return node;
  };

  const root = make('div', 'rts-viewer');
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', t('viewer.label'));
  const close = button('rts-viewer-close', '✕', t('viewer.close'));
  const prev = button('rts-viewer-prev', '‹', t('viewer.prev'));
  const next = button('rts-viewer-next', '›', t('viewer.next'));
  const img = make('img', 'rts-viewer-img');
  img.alt = '';
  const count = make('span', 'rts-viewer-count');
  const bar = make('div', 'rts-viewer-bar');
  bar.append(count);
  // While the full picture comes: a shimmer, never the blurry thumbnail
  const wait = make('div', 'rts-viewer-wait rts-skeleton');
  // The full picture never came: a word, no links out to the image host's page
  const none = make('div', 'rts-viewer-none');
  none.append(make('p', '', t('viewer.failed')));
  const stage = make('div', 'rts-viewer-stage');
  stage.append(wait, img, none, prev, next);
  // All the screenshots of the release, the current one lit
  const strip = make('div', 'rts-viewer-strip');
  const tiles = shots.map((shot, i) => {
    const tile = button('rts-viewer-tile', undefined, `${i + 1} / ${shots.length}`);
    const small = make('img', '');
    small.alt = '';
    // A collection may have a hundred and more: they load as the strip scrolls
    small.loading = 'lazy';
    small.src = shot.thumb;
    tile.append(small);
    tile.addEventListener('click', () => show(i));
    return tile;
  });
  strip.append(...tiles);
  // The mouse wheel scrolls the strip sideways
  strip.addEventListener('wheel', (event) => {
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    strip.scrollLeft += event.deltaY;
    event.preventDefault();
  }, { passive: false });
  root.append(stage, bar, strip, close);

  let at = index;
  const show = (i) => {
    at = Math.max(0, Math.min(shots.length - 1, i));
    const shot = shots[at];
    count.textContent = `${at + 1} / ${shots.length}`;
    prev.disabled = at === 0;
    next.disabled = at === shots.length - 1;
    tiles.forEach((tile, i) => tile.classList.toggle('rts-viewer-current', i === at));
    tiles[at].scrollIntoView({ block: 'nearest', inline: 'center' });
    root.classList.remove('rts-viewer-ready', 'rts-viewer-failed');
    img.removeAttribute('src');
    if (shot.full) {
      img.referrerPolicy = '';
      img.src = shot.full;
    } else if (viewable(shot)) {
      fullFromPage(shot.link).then((full) => {
        if (shots[at] !== shot || !root.isConnected) return;
        // As if opened by itself, the way fastpic hands it out
        img.referrerPolicy = 'no-referrer';
        if (full) img.src = full;
        else root.classList.add('rts-viewer-failed');
      });
    } else {
      root.classList.add('rts-viewer-failed');
    }
    // The neighbours with a full picture, ahead of time
    for (const near of [shots[at - 1], shots[at + 1]]) {
      if (near?.full) new Image().src = near.full;
    }
  };

  const onKey = (event) => {
    if (event.key === 'Escape') closeViewer();
    else if (event.key === 'ArrowLeft') show(at - 1);
    else if (event.key === 'ArrowRight') show(at + 1);
    else return;
    event.preventDefault();
    event.stopPropagation();
  };
  img.addEventListener('load', () => root.classList.add('rts-viewer-ready'));
  img.addEventListener('error', () => {
    if (img.getAttribute('src')) root.classList.add('rts-viewer-failed');
  });
  close.addEventListener('click', closeViewer);
  prev.addEventListener('click', () => show(at - 1));
  next.addEventListener('click', () => show(at + 1));
  // A click beside the picture and the buttons
  root.addEventListener('click', (event) => {
    if (event.target === root || event.target === stage) closeViewer();
  });
  if (shots.length < 2) prev.hidden = next.hidden = strip.hidden = true;

  viewer = { root, onKey, opener, overflow: document.documentElement.style.overflow };
  document.addEventListener('keydown', onKey, true);
  document.documentElement.style.overflow = 'hidden';
  document.body.append(root);
  show(index);
  close.focus();
}
