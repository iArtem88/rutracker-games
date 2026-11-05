// The settings screenshots in docs/media: node tests/e2e/screenshots.mjs
import { sleep, startBrowser } from './harness.mjs';

const MEDIA = new URL('../../docs/media/', import.meta.url).pathname;
const chrome = await startBrowser();
try {
  await chrome.storage.clear();
  await chrome.storage.setSettings({ uiLanguage: 'ru', pcRam: '16' });

  const settings = await chrome.open(chrome.options, { width: 1280, height: 800 });
  await settings.shot(`${MEDIA}screenshot-settings.png`);

  // The Switch card with the own words open
  await settings.ev(`document.querySelector('.own-words').open = true`);
  await sleep(300);
  const card = await settings.ev(`(() => { const r = document.querySelector('.own-words').closest('section').getBoundingClientRect();
    return { x: r.x - 8, y: r.y + scrollY - 8, width: r.width + 16, height: r.height + 16 }; })()`);
  await settings.shot(`${MEDIA}screenshot-words.png`, card);

  const appearance = await chrome.open(`${chrome.options}#appearance`, { width: 1280, height: 800 });
  await appearance.shot(`${MEDIA}screenshot-appearance.png`);
  console.log('docs/media: screenshot-settings.png, screenshot-words.png, screenshot-appearance.png');
} finally {
  await chrome.close();
}
