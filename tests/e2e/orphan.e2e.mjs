// The extension updated or reloaded under an open RuTracker tab: the script
// left on the page stops quietly, with no errors. npm run test:e2e
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { sleep, startBrowser } from './harness.mjs';
import { startMockSite } from './mock-site.mjs';

let site;
let chrome;

before(async () => {
  site = await startMockSite();
  chrome = await startBrowser();
});

after(async () => {
  await chrome?.close();
  await site?.close();
});

test('left behind by the extension, the page script stops quietly', async () => {
  await chrome.storage.setSettings({ uiLanguage: 'ru' });
  // Rows 2000px tall: the lower ones load once scrolled to
  await site.set({ tall: '1' });
  const tab = await chrome.open(`${site.origin}/forum/viewforum.php?f=1605`);
  await sleep(1000);
  await chrome.uninstall();
  await sleep(500);
  // Scrolled down, a filter chip (saves the settings), the settings button
  for (let y = 2000; y <= 10000; y += 2000) {
    await tab.ev(`window.scrollTo(0, ${y})`);
    await sleep(300);
  }
  await tab.ev(`document.querySelector('.rts-chip').click()`);
  await tab.ev(`document.querySelector('.rts-settings').click()`);
  await sleep(1000);
  assert.deepEqual(tab.consoleMessages.filter((m) => /context invalidated/i.test(m.text)), []);
  // The rows scrolled to wait for a reload of the page, as they are
  assert.ok(await tab.ev(`document.querySelectorAll('.rts-box.rts-loading').length`) > 0);
});
