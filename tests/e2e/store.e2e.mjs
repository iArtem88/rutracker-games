// The Chrome Web Store's build (npm run build): fastpic's own pages aren't
// loaded, its "_…" pictures stay thumbnails; the rest opens in the viewer
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { settled, sleep, startBrowser } from './harness.mjs';
import { startMockSite } from './mock-site.mjs';

const STORE = new URL('../../build/chrome/', import.meta.url).pathname;
let site;
let chrome;

before(async () => {
  site = await startMockSite();
  chrome = await startBrowser({ source: STORE });
});

after(async () => {
  await chrome?.close();
  await site?.close();
});

test("the store's build goes without fastpic.js", async () => {
  const manifest = JSON.parse(await readFile(`${STORE}manifest.json`, 'utf8'));
  assert.ok(!JSON.stringify(manifest).includes('fastpic'));
  await assert.rejects(stat(`${STORE}content/fastpic.js`));
});

test("in the store's build fastpic's pages stay unopened", async () => {
  await chrome.storage.setSettings({ uiLanguage: 'ru' });
  const tab = await chrome.open(`${site.origin}/forum/viewforum.php?f=1605`);
  await settled(tab);
  await sleep(500);
  const zoom = (id) => tab.ev(`[...document.querySelectorAll('tr[data-topic_id="${id}"] .rts-thumbs a')].map((a) => a.classList.contains('rts-zoom'))`);
  // fastpic's "_…" picture: a thumbnail only; a full picture: the viewer as before
  assert.deepEqual(await zoom('102'), [false, false]);
  assert.deepEqual(await zoom('101'), [true, true, true]);
  await tab.ev(`document.querySelector('tr[data-topic_id="102"] .rts-thumbs a').click()`);
  await sleep(500);
  assert.equal(await tab.ev(`!!document.querySelector('.rts-viewer') || document.querySelectorAll('iframe').length`), 0);
  await tab.ev(`document.querySelector('tr[data-topic_id="101"] .rts-thumbs a').click()`);
  await sleep(500);
  assert.equal(await tab.ev(`document.querySelector('.rts-viewer .rts-viewer-count').textContent`), '1 / 3');
});
