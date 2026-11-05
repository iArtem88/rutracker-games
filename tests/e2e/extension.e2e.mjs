// The extension in real Chrome against a mock RuTracker: npm run test:e2e
import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, test } from 'node:test';
import { ROWS, settled, sleep, startBrowser } from './harness.mjs';
import { startMockSite } from './mock-site.mjs';

let site;
let chrome;
const forum = (f, options) => chrome.open(`${site.origin}/forum/viewforum.php?f=${f}`, options);
const clickChip = (tab, start) => tab.ev(`[...document.querySelectorAll('.rts-chip')].find((c) => c.textContent.startsWith(${JSON.stringify(start)})).click()`);

before(async () => {
  site = await startMockSite();
  chrome = await startBrowser();
});

after(async () => {
  await chrome?.close();
  await site?.close();
});

beforeEach(async () => {
  await site.reset();
  await chrome.storage.clear();
  // The tests read Russian texts
  await chrome.storage.setSettings({ uiLanguage: 'ru' });
});

describe('Switch', () => {
  test('badges and thumbnails, the rules row untouched', async () => {
    const rows = await settled(await forum('1605'));
    assert.equal(rows['1'].state, 'none');
    assert.deepEqual(rows['101'].badges, ['Русская озвучка', 'Желателен разгон: Кефир']);
    assert.equal(rows['101'].thumbs, 3);
    assert.deepEqual(rows['102'].badges, ['Русский текст (английская озвучка)', '⚠ Желателен разгон: 4IFIR']);
    assert.deepEqual(rows['103'].badges, ['⚠ Обязателен разгон: 4IFIR']);
    assert.deepEqual(rows['104'].badges, ['Русский текст (без озвучки)', 'Без разгона']);
  });

  test('filters: my Switch, then voice-over in my languages', async () => {
    const tab = await forum('1605');
    await settled(tab);
    await clickChip(tab, 'Потянет моя Switch');
    await sleep(300);
    let rows = await tab.ev(ROWS);
    assert.deepEqual(['1', '101', '102', '103', '104'].map((id) => rows[id].hidden), [true, false, true, true, false]);
    await clickChip(tab, 'Озвучка на моих языках');
    await sleep(300);
    rows = await tab.ev(ROWS);
    assert.deepEqual(['101', '104'].map((id) => rows[id].hidden), [false, true]);
    assert.match(await tab.ev(`document.querySelector('.rts-status').textContent`), /^Скрыто 3 из 4/);
  });
});

test('PlayStation: firmware', async () => {
  const rows = await settled(await forum('973'));
  assert.ok(rows['201'].badges.some((b) => b.includes('9.00')), rows['201'].badges.join(' | '));
  assert.ok(rows['202'].badges.some((b) => b.includes('5.05')), rows['202'].badges.join(' | '));
});

test('Windows: requirements, a collection, the Steam Deck estimate, my PC', async () => {
  await chrome.storage.setSettings({ uiLanguage: 'ru', pcRam: '16', filters: { fitsPc: true } });
  const tab = await forum('647');
  const rows = await settled(tab);
  assert.deepEqual(rows['301'].badges, ['8 ГБ ОЗУ · GTX 1060', 'Пойдёт на Steam Deck']);
  assert.equal(rows['302'].badges[0], '2–6 ГБ ОЗУ · до GTX 780');
  assert.deepEqual(rows['303'].badges, ['⚠ 32 ГБ ОЗУ · RTX 4090']);
  assert.deepEqual(['301', '302', '303'].map((id) => rows[id].hidden), [false, false, true]);
  const tooltip = await tab.ev(`document.querySelector('tr[data-topic_id="302"] .rts-pc').title`);
  assert.match(tooltip, /^Несколько игр \(2\), требования у каждой свои:\nTheta:\n/);
});

test('search results: releases of the supported sections only', async () => {
  const rows = await settled(await chrome.open(`${site.origin}/forum/tracker.php?nm=test`));
  assert.equal(rows['101'].badges[0], 'Русская озвучка');
  assert.equal(rows['301'].badges[0], '8 ГБ ОЗУ · GTX 1060');
  assert.equal(rows['999'].state, 'none');
});

test('cache: no second requests; an updated release is loaded again, only it', async () => {
  await settled(await forum('1605'));
  const first = await site.hits();
  assert.deepEqual(first, { 101: 1, 102: 1, 103: 1, 104: 1 });
  const again = await settled(await forum('1605'));
  assert.deepEqual(await site.hits(), first);
  assert.equal(again['101'].badges[0], 'Русская озвучка');
  await site.set({ t: '102', size: '13.05&nbsp;GB' });
  await settled(await forum('1605'));
  assert.deepEqual(await site.hits(), { ...first, 102: 2 });
  const cached = await chrome.storage.local('topic:101');
  assert.deepEqual(cached.mark, { title: '[Nintendo Switch] Alpha Quest [NSP][RUS]', size: '12.71 GB' });
  assert.match(cached.post, /^<div class="post_body">/);
});

test('the site says no: 403 pauses all and retries, 404 is an error, nothing for the error list', async () => {
  await site.set({ t: '101', refuse: '403', times: '1' });
  await site.set({ t: '104', refuse: '404', times: '99' });
  const tab = await forum('1605');
  await sleep(2000);
  const early = await tab.ev(ROWS);
  assert.deepEqual(['101', '102', '103', '104'].map((id) => early[id].state), ['loading', 'loading', 'loading', 'loading']);
  await sleep(23000);
  const late = await tab.ev(ROWS);
  assert.deepEqual(['101', '102', '103', '104'].map((id) => late[id].state), ['done', 'done', 'done', 'error']);
  const ours = tab.consoleMessages.filter((m) => m.text.includes('[RuTracker Games]') || m.type === 'exception');
  assert.ok(ours.length && ours.every((m) => m.type === 'info'), JSON.stringify(ours));
});

test('filters spare the site when asked: only what is scrolled to', async () => {
  await site.set({ tall: '1' });
  await chrome.storage.setSettings({ uiLanguage: 'ru', filterLoadsAll: false, filters: { fitsConsole: true } });
  // Rows 2000px tall: only the first is near the screen, and it fits, so stays
  const gentle = await forum('1605', { height: 800, wait: 4000 });
  assert.deepEqual(Object.keys(await site.hits()), ['101']);
  assert.match(await gentle.ev(`document.querySelector('.rts-status').textContent`), /проверю, когда долистаете/);
  await gentle.close();

  await site.reset();
  await site.set({ tall: '1' });
  await chrome.storage.clear();
  await chrome.storage.setSettings({ uiLanguage: 'ru', filters: { fitsConsole: true } });
  await forum('1605', { height: 800, wait: 5000 });
  assert.deepEqual(Object.keys(await site.hits()).sort(), ['101', '102', '103', '104']);
});

test('own words: typed in the settings, read on the open page without new requests', async () => {
  const tab = await forum('1605');
  await settled(tab);
  const hits = await site.hits();
  const options = await chrome.open(chrome.options, { height: 2400 });
  const labels = await options.ev(`[...document.querySelectorAll('.own-words .words-label')].map((l) => l.textContent)`);
  assert.equal(labels.length, 7);
  // "Лучше всего использовать разгон": "всего" as a word for the maximum makes it 4IFIR
  await options.ev(`(() => {
    const row = [...document.querySelectorAll('.own-words .words-row')].find((r) => r.textContent.startsWith('«Максимальный»'));
    const input = row.querySelector('input');
    input.value = 'всего';
    input.dispatchEvent(new Event('change'));
  })()`);
  await sleep(1500);
  const rows = await tab.ev(ROWS);
  assert.equal(rows['101'].badges[1], '⚠ Желателен разгон: 4IFIR');
  assert.deepEqual(await site.hits(), hits);
});

test('settings: the example badges, the colors from the appearance tab', async () => {
  const tab = await forum('1605');
  await settled(tab);
  const options = await chrome.open(chrome.options);
  const examples = await options.ev(`[...document.querySelectorAll('#custom-badges .badge-label')].map((i) => i.value)`);
  assert.deepEqual(examples, ['DLC', 'Кооператив', 'Желателен разгон']);
  assert.equal(await options.ev(`document.querySelector('[data-key="filterLoadsAll"]').checked`), true);
  await chrome.storage.setSettings({ uiLanguage: 'ru', badgeStyles: { voice: { background: '#000000' } } });
  await sleep(1000);
  assert.equal(await tab.ev(`getComputedStyle(document.querySelector('.rts-voice')).backgroundColor`), 'rgb(0, 0, 0)');
});

test('loading: a shimmering outline while the topics load', async () => {
  await site.set({ slow: '2500' });
  const tab = await forum('1605', { wait: 1000 });
  const loading = await tab.ev(`(() => { const s = document.querySelector('.rts-skeleton'); return s && getComputedStyle(s).animationName; })()`);
  assert.equal(loading, 'rts-shimmer');
  const rows = await settled(tab, 20000);
  assert.ok(Object.values(rows).every((row) => row.state !== 'loading'));
  assert.equal(await tab.ev(`document.querySelectorAll('.rts-skeleton').length`), 0);
});
