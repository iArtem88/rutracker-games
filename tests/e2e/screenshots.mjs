// The settings screenshots in docs/media: node tests/e2e/screenshots.mjs
import { sleep, startBrowser } from './harness.mjs';

const MEDIA = new URL('../../docs/media/', import.meta.url).pathname;
const chrome = await startBrowser();
try {
  await chrome.storage.clear();
  // The example badges, DLC on and in the filters, to show what it looks like
  const customBadges = [
    { id: 'dlc', label: 'DLC', pattern: 'DLC|дополнения|доповнення', color: '#00838f', filter: true, enabled: true },
    { id: 'coop', label: 'Кооператив', pattern: 'кооператив|co-op|split screen|разделённый экран', color: '#ef6c00', filter: false, enabled: false },
    { id: 'overclock', label: 'Желателен разгон', pattern: '/(лучше|рекомендуется|желательно).*разгон/', color: '#1565c0', filter: false, enabled: false },
  ];
  await chrome.storage.setSettings({ uiLanguage: 'ru', pcRam: '16', customBadges, examplesSeen: customBadges.map((b) => b.id) });

  const settings = await chrome.open(chrome.options, { width: 1280, height: 800 });
  await settings.shot(`${MEDIA}screenshot-settings.png`);

  // The Switch card with the own words open
  await settings.ev(`document.querySelector('.own-words').open = true`);
  await sleep(300);
  const card = await settings.ev(`(() => { const r = document.querySelector('.own-words').closest('section').getBoundingClientRect();
    return { x: r.x - 8, y: r.y + scrollY - 8, width: r.width + 16, height: r.height + 16 }; })()`);
  await settings.shot(`${MEDIA}screenshot-words.png`, card);

  // The own badges card
  const badges = await settings.ev(`(() => { const r = document.querySelector('#custom-badges').closest('section').getBoundingClientRect();
    return { x: r.x - 8, y: r.y + scrollY - 8, width: r.width + 16, height: r.height + 16 }; })()`);
  await settings.shot(`${MEDIA}screenshot-badges.png`, badges);

  const appearance = await chrome.open(`${chrome.options}#appearance`, { width: 1280, height: 800 });
  await appearance.shot(`${MEDIA}screenshot-appearance.png`);
  console.log('docs/media: screenshot-settings.png, screenshot-words.png, screenshot-badges.png, screenshot-appearance.png');
} finally {
  await chrome.close();
}
