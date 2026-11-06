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
    // 104 has no voice-over at all and Russian text: nothing foreign to hear
    assert.deepEqual(['101', '104'].map((id) => rows[id].hidden), [false, false]);
    assert.match(await tab.ev(`document.querySelector('.rts-status').textContent`), /^Скрыто 2 из 4/);
  });
});

test('language chips are one choice: «Есть мои языки» or «Озвучка на моих языках»', async () => {
  const tab = await forum('1605');
  await settled(tab);
  const pressed = () => tab.ev(`[...document.querySelectorAll('.rts-chip[aria-pressed="true"]')].map((c) => c.textContent)`);
  const visible = async () => {
    const rows = await tab.ev(ROWS);
    return ['101', '102', '103', '104'].filter((id) => !rows[id].hidden).join(' ');
  };
  // 101 Russian voice-over, 102 Russian text and English voice-over, 103 nothing in Russian, 104 Russian text, no voice-over
  await clickChip(tab, 'Есть мои языки');
  await sleep(300);
  assert.deepEqual(await pressed(), ['Есть мои языки']);
  assert.equal(await visible(), '101 102 104');
  await clickChip(tab, 'Озвучка на моих языках');
  await sleep(300);
  assert.deepEqual(await pressed(), ['Озвучка на моих языках']);
  assert.equal(await visible(), '101 104');
  await clickChip(tab, 'Озвучка на моих языках');
  await sleep(300);
  assert.deepEqual(await pressed(), []);
  assert.equal(await visible(), '101 102 103 104');
  // Both saved on by an older version: the strictest stays
  await chrome.storage.setSettings({ uiLanguage: 'ru', filters: { myText: true, myVoice: true } });
  const again = await forum('1605');
  await settled(again);
  assert.deepEqual(await again.ev(`[...document.querySelectorAll('.rts-chip[aria-pressed="true"]')].map((c) => c.textContent)`), ['Озвучка на моих языках']);
});

describe('screenshots', () => {
  const picture = (url) => url.replace(/^.*\/img\//, '');

  test('a click opens the full pictures in our viewer: ← → and Esc', async () => {
    const tab = await forum('1605');
    await settled(tab);
    await sleep(500);
    const viewer = () => tab.ev(`(() => { const v = document.querySelector('.rts-viewer');
      return v && { count: v.querySelector('.rts-viewer-count').textContent, img: v.querySelector('.rts-viewer-img').src,
        original: v.querySelector('.rts-viewer-original').href }; })()`);
    // A magnifier on the ones that open in the viewer
    assert.equal(await tab.ev(`document.querySelectorAll('tr[data-topic_id="101"] .rts-thumbs a.rts-zoom').length`), 3);
    await tab.ev(`document.querySelector('tr[data-topic_id="101"] .rts-thumbs a').click()`);
    await sleep(300);
    let state = await viewer();
    assert.deepEqual([state.count, picture(state.img), picture(state.original)], ['1 / 3', 'full-0.png', 'full-0.png']);
    await tab.ev(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))`);
    await sleep(300);
    state = await viewer();
    assert.deepEqual([state.count, picture(state.img)], ['2 / 3', 'full-1.png']);
    // The strip of thumbnails: one per screenshot, a click goes there
    assert.equal(await tab.ev(`document.querySelectorAll('.rts-viewer-tile').length`), 3);
    await tab.ev(`document.querySelectorAll('.rts-viewer-tile')[2].click()`);
    await sleep(300);
    state = await viewer();
    assert.deepEqual([state.count, picture(state.img)], ['3 / 3', 'full-2.png']);
    assert.equal(await tab.ev(`[...document.querySelectorAll('.rts-viewer-tile')].findIndex((t) => t.classList.contains('rts-viewer-current'))`), 2);
    await tab.ev(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
    await sleep(200);
    assert.equal(await viewer(), null);

    // No full picture comes (404): no blurry thumbnail, a word and the link to the host
    await tab.ev(`document.querySelector('tr[data-topic_id="104"] .rts-thumbs a').click()`);
    await sleep(500);
    const failed = await tab.ev(`(() => { const v = document.querySelector('.rts-viewer');
      return { failed: v.classList.contains('rts-viewer-failed'), ready: v.classList.contains('rts-viewer-ready'),
        imgShown: getComputedStyle(v.querySelector('.rts-viewer-img')).display !== 'none',
        link: v.querySelector('.rts-viewer-none-link').href }; })()`);
    assert.deepEqual({ ...failed, link: picture(failed.link) }, { failed: true, ready: false, imgShown: false, link: 'missing-0.png' });
    await tab.ev(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);

    // fastpic's "_…" picture: its page, unseen, hands the full one over. No
    // magnifier where there's nothing to show: the click goes to the host's page
    const thumbs = `[...document.querySelectorAll('tr[data-topic_id="102"] .rts-thumbs a')]`;
    assert.deepEqual(await tab.ev(`${thumbs}.map((a) => a.classList.contains('rts-zoom'))`), [true, false]);
    await tab.ev(`${thumbs}[0].click()`);
    for (let i = 0; i < 40 && !(await tab.ev(`document.querySelector('.rts-viewer').classList.contains('rts-viewer-ready')`)); i++) await sleep(200);
    state = await viewer();
    assert.deepEqual([state.count, state.img], ['1 / 1', `${site.origin}/big/2025/1204/ab/_0.png?md5=abc&expires=1793988000`]);
    assert.equal(await tab.ev(`document.querySelectorAll('iframe').length`), 0);
    await tab.ev(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
    assert.equal(await tab.ev(`!${thumbs}[1].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }))`), false);
    assert.equal(await viewer(), null);

    // A big picture put in with no link is the full one; imagebam's stubs aren't shown
    assert.deepEqual(await tab.ev(`[...document.querySelectorAll('tr[data-topic_id="103"] .rts-thumbs a')].map((a) => [a.classList.contains('rts-zoom'), a.querySelector('img').src.replace(/^.*\\//, '')])`), [[true, 'big-0.svg']]);
    await tab.ev(`document.querySelector('tr[data-topic_id="103"] .rts-thumbs a').click()`);
    await sleep(500);
    state = await viewer();
    assert.deepEqual([state.count, picture(state.img)], ['1 / 1', 'big-0.svg']);
    await tab.ev(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
  });

  test("fastpic's page opened from a thumbnail gives way to the picture", async () => {
    const page = `${site.origin}/view/126/2025/1204/_b4ba.png.html`;
    // The signed link, not the download
    let tab = await chrome.open(`${page}#rutracker-games`);
    assert.equal(await tab.ev('location.pathname + location.search'), '/big/2025/1204/ab/_b4ba.png?md5=abc&expires=1793988000');
    await tab.close();
    // Opened any other way, the page stays
    tab = await chrome.open(page);
    assert.equal(await tab.ev('location.pathname'), '/view/126/2025/1204/_b4ba.png.html');
    await tab.close();
  });

  test('the large size shows the full pictures, the thumbnail when the full one fails', async () => {
    await chrome.storage.setSettings({ uiLanguage: 'ru', thumbHeight: 120 });
    const tab = await forum('1605');
    await settled(tab);
    await sleep(1000);
    const pictures = (id) => tab.ev(`[...document.querySelectorAll('tr[data-topic_id="${id}"] .rts-thumbs img')].map((i) => i.src)`);
    assert.deepEqual((await pictures('101')).map(picture), ['full-0.png', 'full-1.png', 'full-2.png']);
    assert.deepEqual((await pictures('104')).map(picture), ['0.png']);
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
