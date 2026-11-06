'use strict';

// fastpic's page of a screenshot, opened from our thumbnails (they mark the
// link with #rutracker-games). The page hands its full picture to whoever
// opened it, newer ones through a signed link; it's taken from here, nothing
// more is asked of fastpic. In a tab the picture replaces the page; inside
// our viewer (an unseen frame, see viewer.js) it goes to the viewer.
(() => {
  if (location.hash !== '#rutracker-games') return;
  // /view/126/2025/1204/_b4ba….png.html: the picture is _b4ba….png
  const file = /\/view\/.+\/([^/]+)\.html$/.exec(location.pathname)?.[1];
  const html = document.documentElement.innerHTML.replace(/&amp;/g, '&');
  const full = file && [...html.matchAll(/https?:\/\/[^\s"'<>[\]]+\/big\/[^\s"'<>[\]]+/g)]
    .map((match) => match[0])
    // dl=1 is the same picture as a download
    .find((url) => url.split(/[?#]/)[0].endsWith(`/${file}`) && !/[?&]dl=/.test(url));
  if (window === top) {
    if (full) location.replace(full);
    return;
  }
  // The link is no secret: anyone may open this page for it
  parent.postMessage({ rutrackerGames: 'fastpic', full: full || null }, '*');
  window.stop();
})();
