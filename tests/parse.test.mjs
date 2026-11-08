// Parsing of release descriptions, run in a real browser with the extension's
// own scripts. The cases are phrasings found in actual RuTracker releases.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { after, before, describe, test } from 'node:test';
import { launchBrowser } from './browser.mjs';

// The extension's scripts as the manifest lists them, without the page glue
const manifest = JSON.parse(await readFile(new URL('../src/manifest.json', import.meta.url), 'utf8'));
const FILES = manifest.content_scripts[0].js.filter((file) => file !== 'content/content.js');
// The language badges looked at: Russian and Ukrainian
const RU_UK = { ru: { voice: true, text: true }, uk: { voice: true, text: true } };

let browser;
let page;

before(async () => {
  browser = await launchBrowser();
  page = await browser.newPage();
  for (const file of FILES) {
    await page.addScriptTag({ content: await readFile(new URL(`../src/${file}`, import.meta.url), 'utf8') });
  }
  await page.evaluate(() => setUiLanguage('ru'));
});

after(() => browser?.close());

test('every game forum of the site is a known section', async () => {
  const sections = await page.evaluate((ids) => ids.map((id) => sectionForForum(id)?.id ?? null), [
    '1605', '973', '546', '908', '129', '646', '635', '2118', // Switch, PS4, PS5, PS1, other platforms, Windows
    '960', '537', '637', '899', '1992', '2059', // Mac, Linux
    '650', '2149', '2420', '1004', '1002', // mobile
    '139', '2480', '2481', '2478', '2142', '2060', '2145', '2146', '2143', '2012', // add-ons
    '7', '2415', // films, game videos: not games
  ]);
  assert.deepEqual(sections, [
    'switch', 'playstation', 'playstation', 'consoles', 'consoles', 'windows', 'windows', 'windows',
    'mac', 'mac', 'mac', 'linux', 'linux', 'linux',
    'mobile', 'mobile', 'mobile', 'mobile', 'mobile',
    'addons', 'addons', 'addons', 'addons', 'addons', 'addons', 'addons', 'addons', 'addons', 'addons',
    null, null,
  ]);
});

// parseTopic() on a first post with this HTML
function parse(body, title = '[Nintendo Switch] Game [NSZ][RUS/ENG]', forumId = '1605') {
  return page.evaluate(({ body, title, forumId }) => parseTopic(
    `<html><body><div class="post_body">${body}</div><div class="post_body">второй пост</div></body></html>`,
    title,
    sectionForForum(forumId),
  ), { body, title, forumId });
}

// The language badges, in the Russian interface unless said otherwise
function labels(body, { title = '[Nintendo Switch] Game [NSZ]', forumId = '1605', languages = RU_UK, ui = 'ru' } = {}) {
  return page.evaluate(({ body, title, forumId, languages, ui }) => {
    setUiLanguage(ui);
    const topic = parseTopic(`<div class="post_body">${body}</div>`, title, sectionForForum(forumId));
    const texts = gameBadges(topic, { languages }).map((badge) => badge.text);
    setUiLanguage('ru');
    return texts;
  }, { body, title, forumId, languages, ui });
}

describe('voice-over', () => {
  test('from the "Озвучка" field', async () => {
    assert.deepEqual(await labels('Озвучка: русская, английская<br>'), ['Русская озвучка']);
  });

  test('machine voice-over after another language', async () => {
    assert.deepEqual(await labels('Озвучка: английская + русская машинная, от SynthVoiceRu<br>'), ['Русская озвучка (машинная)']);
  });

  test('details after a comma belong to the language before them', async () => {
    assert.deepEqual(
      await labels('Озвучка: русская, любительская от RG MVO, английская<br>'),
      ['Русская озвучка (любительская)'],
    );
  });

  test('a language only in parentheses is not a voice-over', async () => {
    assert.deepEqual(await labels('Озвучка: выдуманный язык (русский в заставке)<br>'), []);
  });

  test('mentioned outside the field', async () => {
    const body = 'Озвучка: английская<br>Синтезированная русская озвучка от голосового движка Ivona Maxim.<br>';
    assert.deepEqual(await labels(body), ['Русская озвучка (машинная)']);
  });

  test('"не будет" is not a voice-over', async () => {
    assert.deepEqual(await labels('Озвучка: английская<br>DLC с озвучками (русской озвучки не будет)<br>'), []);
  });

  test('optional voice-over mod', async () => {
    const body = 'Озвучка: английская + русская для 1-2-3 глав от NikiStudio<br>'
      + 'Также включена опциональная русская озвучка, скопируйте папку atmosphere в корень карты.<br>';
    assert.deepEqual(await labels(body), ['Русская озвучка (частичная, мод)']);
  });

  test('"Voice Mod." in the title', async () => {
    const title = '[Nintendo Switch] Superliminal [NSZ][RUS (Voice Mod.)/Multi10]';
    assert.deepEqual(await labels('Озвучка: английская<br>', { title }), ['Русская озвучка (мод)']);
  });

  test('PlayStation language codes and "Перевод"', async () => {
    const ps4 = { title: '[PS4] Game', forumId: '973' };
    assert.deepEqual(await labels('Язык озвучки: ENG+RUS<br>', ps4), ['Русская озвучка']);
    assert.deepEqual(await labels('Перевод: Текст и Звук<br>', ps4), ['Русская озвучка']);
    assert.deepEqual(await labels('Язык озвучки: Английский<br>Перевод: Текст<br>', ps4), ['Русский текст (английская озвучка)']);
  });

  test('"RUS sound" in the title', async () => {
    const title = '[PS5] Game [RUS text / RUS sound / USA]';
    assert.deepEqual(await labels('Тип издания: Лицензия<br>', { title, forumId: '546' }), ['Русская озвучка']);
  });

  test('Ukrainian and others', async () => {
    assert.deepEqual(await labels('Озвучка: украинская, английская<br>'), ['Украинская озвучка']);
    assert.deepEqual(await labels('Язык озвучки: UKR, ENG, RUS<br>'), ['Украинская озвучка', 'Русская озвучка']);
    const japanese = { languages: { ja: { voice: true, text: true } } };
    assert.deepEqual(await labels('Озвучка: японская, английская<br>', japanese), ['Японская озвучка']);
    // Not ticked: no badge
    assert.deepEqual(await labels('Озвучка: японская<br>'), []);
  });

  test('in other interface languages', async () => {
    const body = 'Озвучка: английская + русская машинная<br>';
    assert.deepEqual(await labels(body, { ui: 'en' }), ['Russian voice-over (machine)']);
    assert.deepEqual(await labels(body, { ui: 'uk' }), ['Російське озвучення (машинне)']);
    assert.deepEqual(await labels(body, { ui: 'de' }), ['Sprachausgabe: Russisch (maschinell)']);
  });
});

describe('text without a voice-over in the language', () => {
  test('green without voice-over, yellow with a foreign one, outlined when unknown', async () => {
    const classes = (body) => page.evaluate((body) => gameBadges(
      parseTopic(`<div class="post_body">${body}</div>`, '', sectionForForum('635')),
      { languages: { ru: { voice: true, text: true } } },
    ).map((badge) => `${badge.text} | ${badge.cls}`), body);
    assert.deepEqual(await classes('Язык интерфейса: русский<br>Язык озвучки: отсутствует<br>'), ['Русский текст (без озвучки) | rts-text']);
    assert.deepEqual(
      await classes('Язык интерфейса: Русский (любительский), Английский<br>Озвучка: не озвучивается<br>'),
      ['Русский текст (любительский, без озвучки) | rts-text'],
    );
    assert.deepEqual(
      await classes('Язык интерфейса: русский<br>Язык озвучки: английский, японский<br>'),
      ['Русский текст (английская озвучка) | rts-text-foreign'],
    );
    assert.deepEqual(await classes('Язык интерфейса: русский<br>'), ['Русский текст | rts-text rts-soft']);
  });

  test('«Озвучка на моих языках» lets through a game with no voice-over and my text', async () => {
    const passes = (body) => page.evaluate((body) => GAME_FILTERS.find((filter) => filter.id === 'myVoice').test(
      parseTopic(`<div class="post_body">${body}</div>`, '', sectionForForum('635')),
      { languages: { ru: { voice: true, text: true } } },
    ), body);
    assert.equal(await passes('Язык интерфейса: русский<br>Язык озвучки: русский<br>'), true);
    // Nothing to hear, all in Russian: the green badge
    assert.equal(await passes('Язык интерфейса: русский<br>Язык озвучки: отсутствует<br>'), true);
    // The voice-over is in another language, or the release doesn't say
    assert.equal(await passes('Язык интерфейса: русский<br>Язык озвучки: английский<br>'), false);
    assert.equal(await passes('Язык интерфейса: русский<br>'), false);
    // No voice-over, but not my language either
    assert.equal(await passes('Язык интерфейса: английский<br>Язык озвучки: отсутствует<br>'), false);
  });

  test('machine translation, "Язык озвучивания: отсутствует"', async () => {
    const body = 'Язык интерфейса: Английский [ENG] + русский машинный<br>Язык озвучивания: отсутствует<br>';
    assert.deepEqual(await labels(body, { title: '[DL] Game [P] [RUS + ENG]', forumId: '635' }), ['Русский текст (машинный, без озвучки)']);
  });

  test('"Multi42 (в т.ч. русский)"', async () => {
    assert.deepEqual(await labels('Язык интерфейса: Multi42 (в т.ч. русский)<br>'), ['Русский текст']);
  });

  test('a field name without a line break before it', async () => {
    const body = '<span class="post-b">Формат</span>: exfat<span class="post-b">Язык интерфейса</span>: Русский<br>';
    assert.deepEqual(await labels(body), ['Русский текст']);
  });
});

describe('screenshots', () => {
  test('thumbnails from the "Скриншоты" spoiler, nested ones without repeats', async () => {
    const topic = await parse(`
      <div class="sp-wrap"><div class="sp-head"><span>Скриншоты</span></div><div class="sp-body">
        <a href="https://fastpic.org/view/1.jpg.html" class="postLink"><var class="postImg" title="https://i1.fastpic.org/thumb/1.jpeg"></var></a>
        <a href="javascript:alert(1)" class="postLink"><var class="postImg" title="https://i1.fastpic.org/thumb/2.jpeg"></var></a>
        <div class="sp-wrap"><div class="sp-head"><span>скриншоты</span></div><div class="sp-body">
          <var class="postImg" title="https://i1.fastpic.org/thumb/1.jpeg"></var>
        </div></div>
      </div></div>
      <div class="sp-wrap"><div class="sp-head"><span>Описание</span></div><div class="sp-body">
        <var class="postImg" title="https://i1.fastpic.org/thumb/3.jpeg"></var>
      </div></div>`);
    assert.deepEqual(topic.shots, [
      { thumb: 'https://i1.fastpic.org/thumb/1.jpeg', link: 'https://fastpic.org/view/1.jpg.html', full: null },
      // Not a javascript: link
      { thumb: 'https://i1.fastpic.org/thumb/2.jpeg', link: 'https://i1.fastpic.org/thumb/2.jpeg', full: null },
    ]);
  });

  test("fastpic's page of a picture, for the viewer's unseen frame", async () => {
    const link = (url) => page.evaluate((url) => fastpicPage(url), url);
    assert.equal(
      await link('https://fastpic.org/view/126/2025/1204/_b4ba236b0677732b420367d70c420be5.png.html'),
      'https://fastpic.org/view/126/2025/1204/_b4ba236b0677732b420367d70c420be5.png.html#rutracker-games',
    );
    assert.equal(await link('http://fastpic.ru/view/40/2012/0306/1a.jpg.html#x'), 'http://fastpic.ru/view/40/2012/0306/1a.jpg.html#rutracker-games');
    // A "_…" one linked straight to its picture, which opens no more: its page
    assert.equal(
      await link('https://i128.fastpic.org/big/2026/0923/77/_6c1d83934c8bbc7aed71e1484d4c1377.jpg'),
      'https://fastpic.org/view/128/2026/0923/_6c1d83934c8bbc7aed71e1484d4c1377.jpg.html#rutracker-games',
    );
    // Not fastpic's page: none
    assert.equal(await link('https://imageban.ru/show/2021/12/17/2c4bc8c4/png'), null);
    assert.equal(await link('https://i128.fastpic.org/big/2026/0922/a0/1.jpg'), null);
    // Opens in our viewer: a full picture, or fastpic's page to get it from
    const viewable = (shot) => page.evaluate((shot) => viewable(shot), shot);
    assert.equal(await viewable({ link: 'https://fastpic.org/view/126/2025/1204/_b4ba.png.html', full: null }), true);
    assert.equal(await viewable({ link: 'https://i128.fastpic.org/big/2026/1006/cb/_87dbaaf5448afae842ae83a13a7524cb.jpg', full: null }), true);
    assert.equal(await viewable({ link: 'https://www.imagebam.com/view/MEABCD', full: null }), false);
    // ImgBB's page: the full picture is read off it
    assert.equal(await viewable({ link: 'https://ibb.co/d4DJp6fq', full: null }), true);
    assert.equal(await viewable({ link: 'https://ibb.co.com/n0c8fjp', full: null }), true);
    assert.equal(await viewable({ link: 'https://postimg.cc/t1Q1Sc2K', full: null }), true);
    assert.equal(await viewable({ link: 'https://postimg.cc/image/5nf6uoltd/', full: null }), true);
    assert.equal(await viewable({ link: 'https://www.imagebam.com/view/MEABCD', full: 'https://i1.imageban.ru/out/a.png' }), true);
  });

  test('the full-size picture from the URLs alone, as the releases have them', async () => {
    const full = (thumb, link) => page.evaluate(([thumb, link]) => fullImage(thumb, link), [thumb, link]);
    // fastpic: the thumbnail and the view page
    assert.equal(
      await full('https://i123.fastpic.org/thumb/2024/0325/08/e7050adac6d15396b8e68379f5647008.jpeg', 'https://fastpic.org/view/123/2024/0325/e7050adac6d15396b8e68379f5647008.jpg.html'),
      'https://i123.fastpic.org/big/2024/0325/08/e7050adac6d15396b8e68379f5647008.jpg',
    );
    assert.equal(
      await full('https://i114.fastpic.org/thumb/2021/0514/03/14288fc4437f6f4b22c3db01ff67f303.jpeg', 'https://fastpic.org/view/114/2021/0514/14288fc4437f6f4b22c3db01ff67f303.png.html'),
      'https://i114.fastpic.org/big/2021/0514/03/14288fc4437f6f4b22c3db01ff67f303.png',
    );
    // fastpic files named "_…" open only through a signed link on fastpic's page: none to have
    assert.equal(
      await full('https://i114.fastpic.org/thumb/2021/0514/03/_14288fc4437f6f4b22c3db01ff67f303.jpeg', 'https://fastpic.org/view/114/2021/0514/_14288fc4437f6f4b22c3db01ff67f303.png.html'),
      null,
    );
    // A link straight to the picture
    assert.equal(
      await full('https://i128.fastpic.org/thumb/2026/0922/a0/3981288683084fb28cebe9250ca74aa0.jpeg', 'https://i128.fastpic.org/big/2026/0922/a0/3981288683084fb28cebe9250ca74aa0.jpg'),
      'https://i128.fastpic.org/big/2026/0922/a0/3981288683084fb28cebe9250ca74aa0.jpg',
    );
    assert.equal(
      await full('https://i128.fastpic.org/thumb/2026/0922/a0/_3981288683084fb28cebe9250ca74aa0.jpeg', 'https://i128.fastpic.org/big/2026/0922/a0/_3981288683084fb28cebe9250ca74aa0.jpg'),
      null,
    );
    assert.equal(await full('https://c.radikal.ru/c21/2202/f3/1b48649be17bt.jpg', 'https://c.radikal.ru/c21/2202/f3/1b48649be17b.jpg'), 'https://c.radikal.ru/c21/2202/f3/1b48649be17b.jpg');
    assert.equal(
      await full('https://i3.imageban.ru/out/2021/12/17/8dfefbdb8f59a5f988290f2d700042ff.png', 'https://i6.imageban.ru/out/2021/12/17/2c4bc8c4cfd09f0c3ba0b27e57f9a109.png'),
      'https://i6.imageban.ru/out/2021/12/17/2c4bc8c4cfd09f0c3ba0b27e57f9a109.png',
    );
    // The thumbnail is the full picture already
    assert.equal(await full('https://i116.fastpic.org/big/2022/0206/ae/6af98924fa14bcfe78469697ecaa3aae.png', null), 'https://i116.fastpic.org/big/2022/0206/ae/6af98924fa14bcfe78469697ecaa3aae.png');
    assert.equal(
      await full('https://i116.fastpic.org/big/2022/0206/b8/87a18358787eb7535b034695b402eab8.jpg', 'https://i116.fastpic.org/big/2022/0206/b8/87a18358787eb7535b034695b402eab8.jpg.html'),
      'https://i116.fastpic.org/big/2022/0206/b8/87a18358787eb7535b034695b402eab8.jpg',
    );
    // imageban: the thumbnail and the show page
    assert.equal(
      await full('https://i5.imageban.ru/thumbs/2026.09.29/08ece1843232058d88d3d94f0ac4b56d.jpg', 'https://imageban.ru/show/2026/09/29/08ece1843232058d88d3d94f0ac4b56d/jpg'),
      'https://i5.imageban.ru/out/2026/09/29/08ece1843232058d88d3d94f0ac4b56d.jpg',
    );
    // Old releases: http:// and fastpic.ru, the picture over https
    assert.equal(
      await full('http://i3.imageban.ru/thumbs/2016.12.11/81af7a524e9f87a59a48e5b1b571ba62.jpg', 'http://imageban.ru/show/2016/12/11/81af7a524e9f87a59a48e5b1b571ba62/jpg'),
      'https://i3.imageban.ru/out/2016/12/11/81af7a524e9f87a59a48e5b1b571ba62.jpg',
    );
    assert.equal(
      await full('http://i89.fastpic.ru/thumb/2017/0101/aa/0123456789abcdef0123456789abcdaa.jpeg', 'http://fastpic.ru/view/89/2017/0101/0123456789abcdef0123456789abcdaa.png.html'),
      'https://i89.fastpic.ru/big/2017/0101/aa/0123456789abcdef0123456789abcdaa.png',
    );
    assert.equal(await full('http://images.vfl.ru/ii/1606676875/8577fcf1/32485214.jpg', 'http://images.vfl.ru/ii/1606676876/b0d7ef5c/32485217.jpg'), 'http://images.vfl.ru/ii/1606676876/b0d7ef5c/32485217.jpg');
    // GOG's screenshots put in as they are: the full picture already; a smaller copy's name has it
    assert.equal(
      await full('https://images.gog-statics.com/33bb0b67d64b801102f2071dd66f92a5a9e6525d12e5715d806ebd8578640a1e.jpg', null),
      'https://images.gog-statics.com/33bb0b67d64b801102f2071dd66f92a5a9e6525d12e5715d806ebd8578640a1e.jpg',
    );
    assert.equal(
      await full('https://images.gog-statics.com/33bb0b67d64b801102f2071dd66f92a5a9e6525d12e5715d806ebd8578640a1e_product_card_v2_mobile_slider_639.jpg', null),
      'https://images.gog-statics.com/33bb0b67d64b801102f2071dd66f92a5a9e6525d12e5715d806ebd8578640a1e.jpg',
    );
    // riotpixels: the thumbnail's name has the picture's name in it
    assert.equal(
      await full('http://s01.riotpixels.net/data/36/80/3680c4e7-babf-48fb-b06c-a50cd381fc77.jpg.240p.jpg', 'http://ru.riotpixels.com/games/destroy-all-humans-ii-2020/screenshots/93/?utm_source=emb-gfx-bbcode'),
      'https://s01.riotpixels.net/data/36/80/3680c4e7-babf-48fb-b06c-a50cd381fc77.jpg',
    );
    // Unknown: imagebam hands its pictures out only through its page; a fastpic view of another picture
    assert.equal(await full('https://thumbs4.imagebam.com/da/1c/6c/ME12DVVN_t.jpg', 'https://www.imagebam.com/view/ME12DVVN'), null);
    assert.equal(await full('https://i123.fastpic.org/thumb/2024/0325/08/aaaa.jpeg', 'https://fastpic.org/view/123/2024/0325/bbbb.jpg.html'), null);
    assert.equal(await full('https://i123.fastpic.org/thumb/2024/0325/08/aaaa.jpeg', null), null);
  });

  test('"Cкриншоты" with a Latin C', async () => {
    const topic = await parse('<div class="sp-wrap"><div class="sp-head"><span>Cкриншоты</span></div><div class="sp-body">'
      + '<var class="postImg" title="https://i1.fastpic.org/thumb/1.jpeg"></var></div></div>');
    assert.equal(topic.shots.length, 1);
  });
});

describe('Switch overclock', () => {
  const overclock = async (body, revision = 'mariko', own = {}) => page.evaluate(({ body, revision, own }) => {
    const oc = parseTopic(`<div class="post_body">${body}</div>`, '', sectionForForum('1605'), own).extra.overclock;
    return oc && { ...oc, needs: neededFirmware(oc, revision).fw };
  }, { body, revision, own });
  const verdict = async (body, revision) => {
    const oc = await overclock(body, revision);
    return oc && `${oc.level} ${oc.needs}`;
  };

  test('required, clocks above Kefir', async () => {
    const oc = await overclock('Обязательно (sic!) нужен максимальный разгон консоли, например 2397 МГц CPU / 1228 МГц GPU и выше.');
    assert.equal(oc.level, 'required');
    assert.deepEqual(oc.freqs, { cpu: 2397, gpu: 1228 });
    assert.equal(oc.needs, '4ifir');
  });

  test('recommended, within Kefir', async () => {
    assert.equal(await verdict('Игра может подтормаживать. Желательно гнать CPU до 1785 МГц и выше.'), 'recommended kefir');
  });

  test('the tested clocks alone, above Kefir: advised 4IFIR', async () => {
    assert.equal(await verdict('Производительность: 30 кадров. CPU: 1963 MHz, GPU: 1152 MHz, RAM: 2333 MHz.'), 'recommended 4ifir');
  });

  test('Erista has lower limits', async () => {
    assert.equal(await verdict('Желательно гнать GPU до 1152 MHz.', 'mariko'), 'recommended kefir');
    assert.equal(await verdict('Желательно гнать GPU до 1152 MHz.', 'erista'), 'recommended 4ifir');
  });

  test('a plain overclock is Kefir', async () => {
    assert.equal(await verdict('Лучше всего использовать разгон консоли.'), 'recommended kefir');
    assert.equal(await verdict('Для игры требуется разгон.'), 'required kefir');
  });

  test('the maximum is 4IFIR, advised or required as put', async () => {
    assert.equal(await verdict('Лучше всего максимально стабильно разогнать консоль, особенно по CPU.'), 'recommended 4ifir');
    assert.equal(await verdict('Обязательно максимально разгоните консоль, особенно по CPU.'), 'required 4ifir');
    assert.equal(await verdict('Желателен разгон на максимум.'), 'recommended 4ifir');
  });

  test('a must outweighs a should', async () => {
    assert.equal(await verdict('Стоит обязательно максимально разогнать консоль, особенно по CPU, пример.'), 'required 4ifir');
  });

  test('the maximum of Kefir is Kefir', async () => {
    assert.equal(await verdict('Лучше включить максимальный разгон Кефира.'), 'recommended kefir');
  });

  test('4IFIR named: required, unless only advised', async () => {
    assert.equal(await verdict('Тестировалось на 4IFIR.'), 'required 4ifir');
    assert.equal(await verdict('Нужен разгон 4IFIR.'), 'required 4ifir');
    assert.equal(await verdict('Для стабильных 30 кадров лучше Чифир.'), 'recommended 4ifir');
  });

  test('"без Чифира" names no firmware', async () => {
    assert.equal(await verdict('Работает и без Чифира, на Кефире.'), null);
    assert.equal(await verdict('4IFIR не нужен.'), null);
    assert.equal(await verdict('Разгон обязателен, Чифир не нужен.'), 'required kefir');
    assert.equal(await verdict('Без разгона Чифиром не обойтись.'), 'required 4ifir');
  });

  test('not needed: the longest wording wins', async () => {
    assert.equal(await verdict('Целевая производительность — 30 кадров на штатных частотах консоли без разгона.'), 'none kefir');
    assert.equal(await verdict('Разгон не нужен.'), 'none kefir');
    assert.equal(await verdict('Не нужен разгон, всё летает.'), 'none kefir');
    assert.equal(await verdict('Без разгона не запускается.'), 'required kefir');
  });

  test('a sysmodule mention is not a requirement', async () => {
    const oc = await overclock('Для лучших показателей FPS рекомендуется включить максимальный разгон CPU/GPU/RAM. '
      + 'Конфиг включает повышение частот при запуске игры - для него нужен подходящий sysmodule разгона.');
    assert.equal(oc.level, 'recommended');
  });

  test('the user\'s own words come on top', async () => {
    const body = 'Оптимально разогнать консоль.';
    assert.equal(await overclock(body), null);
    assert.equal((await overclock(body, 'mariko', { ocAdvised: 'оптимально' })).level, 'recommended');
    assert.equal((await overclock('Желательно разогнать до упора.', 'mariko', { ocMax: ' до упора | впритык ' })).needs, '4ifir');
  });

  test('nothing about overclocking', async () => {
    assert.equal(await overclock('Язык интерфейса: Русский'), null);
  });
});

describe('PlayStation firmware', () => {
  const firmware = (value) => page.evaluate((value) => {
    const fw = findFirmware([`Минимальная версия прошивки: ${value}`]);
    return fw && { min: fw.min.text, max: fw.max?.text ?? null, backport: fw.backport };
  }, value);

  test('a plain minimum', async () => {
    assert.deepEqual(await firmware('5.05'), { min: '5.05', max: null, backport: false });
  });

  test('a backport lowers the minimum', async () => {
    assert.deepEqual(await firmware('8.50 + BACKPORT [5.05-6.72-7.xx]'), { min: '5.05', max: null, backport: true });
    assert.equal((await firmware('8.50 (5.05)')).min, '5.05');
  });

  test('an upper limit', async () => {
    assert.deepEqual(await firmware('4.xx+ - работает только до 11.60.'), { min: '4.xx', max: '11.60', backport: false });
    assert.deepEqual(await firmware('4.xx - 13.60'), { min: '4.xx', max: '13.60', backport: false });
  });

  test('tool versions and dates are not firmware', async () => {
    const fw = await firmware('10.00; backport(backpork)⁴ для (4.xx - 9.60); dlc_emu⁵ v0.3 (от 28.06.2026);');
    assert.deepEqual(fw, { min: '4.xx', max: null, backport: true });
    assert.equal((await firmware('Требуется системное ПО v13.60+ (SDK v13.00) для 4xx и выше')).min, '4.xx');
  });

  test('my firmware against the range', async () => {
    const runs = await page.evaluate(() => {
      const fw = findFirmware(['Минимальная версия прошивки: 4.xx+ - работает только до 11.60.']);
      return ['9.00', '12.00', ''].map((mine) => runsOnMine(fw, { ps5Firmware: mine }, '546'));
    });
    assert.deepEqual(runs, [true, false, null]);
  });
});

describe('Windows requirements', () => {
  const ram = (line) => page.evaluate((line) => findRequirements([line])?.ramGb ?? null, line);
  const gpu = (value) => page.evaluate((value) => findRequirements([`Видеокарта: ${value}`])?.gpu ?? null, value);

  test('RAM in different spellings', async () => {
    assert.equal(await ram('• Оперативная память: 8 GB RAM'), 8);
    assert.equal(await ram('Оперативная память: : 2Gb'), 2);
    assert.equal(await ram('√ Оперативная память: 4 Гб;'), 4);
    assert.equal(await ram('ОЗУ: 4 Гб минимум'), 4);
    assert.equal(await ram('RAM: 512 MB'), 0.5);
    assert.equal(await ram('Видеокарта: RX 6600 (8GB VRAM)'), null);
    assert.equal(await ram('[*]Память: 4 GB RAM'), 4);
    assert.equal(await ram('Видеопамять: 2 ГБ'), null);
    assert.equal(await ram('Память видеокарты: 2 ГБ'), null);
  });

  test('a minimum above 32 GB is a slip for MB', async () => {
    assert.equal(await ram('Память: 64 ГБ'), 0.0625);
    assert.equal(await ram('Оперативная память: 32 ГБ'), 32);
  });

  test('the first video card, short', async () => {
    assert.equal(await gpu('NVIDIA GeForce GTX 1060 (6GB) / AMD Radeon RX 580'), 'GTX 1060');
    assert.equal(await gpu('NVIDIA GTX960 4G;'), 'GTX 960');
    assert.equal(await gpu('GeForce 7600 GT (512 MB)'), 'GeForce 7600 GT');
    assert.equal(await gpu('NVIDIA GeForce 450 or higher (1GB VRAM)'), 'GeForce 450');
    assert.equal(await gpu('NVIDIA GeForce RTX 3050 / AMD Radeon RX 6600 (8GB VRAM)'), 'RTX 3050');
    assert.equal(await gpu('NVIDIA GeForce GTX 660 or AMD Radeon HD 7850;'), 'GTX 660');
    assert.equal(await gpu('Intel HD Graphics 512MB;'), 'Intel HD Graphics');
    assert.equal(await gpu('поддерживающая DirectX 9 с 512 МБ видеопамяти, NVIDIA GeForce 8800 или ATI Radeon HD 2900'), 'GeForce 8800');
    assert.equal(await gpu('встроенная'), 'integrated');
    assert.equal(await gpu('2 GB'), null);
    assert.equal(await gpu('NVIDIA GeForce GTX 1080TI'), 'GTX 1080 Ti');
  });

  test('Steam Deck from the requirements, and Valve first', async () => {
    const verdict = (lines, lookup = null) => page.evaluate(({ lines, lookup }) => {
      const topic = { extra: { requirements: findRequirements(lines) } };
      const result = deckVerdict(topic, { showDeckEstimate: true, showSteamDeck: true }, lookup);
      return result && { ok: result.ok, text: result.badge.text };
    }, { lines, lookup });
    const fits = { ok: true, text: 'Пойдёт на Steam Deck' };
    assert.deepEqual(await verdict(['Оперативная память: 8 GB', 'Видеокарта: GTX 1050 Ti / RX 570']), fits);
    assert.deepEqual(await verdict(['Оперативная память: 16 GB', 'Видеокарта: NVIDIA GeForce GTX 1060 (6GB)']), fits);
    assert.deepEqual(await verdict(['Оперативная память: 4 GB', 'Видеокарта: AMD Radeon HD 7850']), fits);
    // Too heavy, unknown card, too much memory: no estimate
    assert.equal(await verdict(['Оперативная память: 8 GB', 'Видеокарта: GTX 1660']), null);
    assert.equal(await verdict(['Оперативная память: 8 GB', 'Видеокарта: RTX 4070']), null);
    assert.equal(await verdict(['Оперативная память: 32 GB', 'Видеокарта: GTX 960']), null);
    // Valve's rating wins either way
    assert.deepEqual(
      await verdict(['Оперативная память: 8 GB', 'Видеокарта: GTX 960'], { appId: '1', category: 1 }),
      { ok: false, text: 'Steam Deck: не поддерживается' },
    );
    assert.deepEqual(
      await verdict(['Видеокарта: RTX 4070'], { appId: '1', category: 3 }),
      { ok: true, text: 'Steam Deck: проверено' },
    );
  });

  test('the badge', async () => {
    const badge = (settings) => page.evaluate((settings) => {
      const req = findRequirements(['Оперативная память: 8 GB', 'Видеокарта: GTX 1050 Ti / RX 570']);
      return requirementsBadge(req, settings).text;
    }, settings);
    assert.equal(await badge({}), '8 ГБ ОЗУ · GTX 1050 Ti');
    assert.equal(await badge({ pcRam: '4' }), '⚠ 8 ГБ ОЗУ · GTX 1050 Ti');
  });
});

describe('Windows: collections', () => {
  const game = (name, ram, gpu) => `<div class="sp-wrap"><div class="sp-head"><span>${name}</span></div><div class="sp-body">
    Системные требования:<br>Процессор: Core i3<br>Оперативная память: ${ram}<br>Видеокарта: ${gpu}<br>
    <div class="sp-wrap"><div class="sp-head"><span>Скриншоты</span></div><div class="sp-body">-</div></div></div></div>`;
  const windows = (body, title = '[DL] [Антология] Borderlands 1, 2, 3') => page.evaluate(({ body, title }) => {
    const topic = parseTopic(`<div class="post_body">${body}</div>`, title, sectionForForum('647'));
    const settings = { showPcRam: true, pcRam: '4', showDeckEstimate: true };
    return { req: topic.extra.requirements, steamAppId: topic.extra.steamAppId, badges: SECTIONS.find((s) => s.id === 'windows').badges(topic, settings, {}) };
  }, { body, title });

  test('each game its own: the range and the heaviest card', async () => {
    const { req, badges } = await windows(game('Borderlands', '1 ГБ', '256 МБ') + game('Borderlands 2', '2 ГБ', 'GeForce 8800')
      + game('Borderlands 3', '6 ГБ', 'GeForce GTX 680') + game('Borderlands GOTY', '4 ГБ', 'GeForce GTX 780'));
    assert.equal(req.games, 4);
    assert.equal(req.ramGb, 6);
    assert.equal(req.gpu, 'GTX 780');
    assert.equal(badges[0].text, '⚠ 1–6 ГБ ОЗУ · до GTX 780');
    assert.match(badges[0].title, /^Несколько игр \(4\), требования у каждой свои:\nBorderlands:\n/);
  });

  test('requirement spoilers are not games', async () => {
    const { req } = await windows(game('Системные требования', '8 ГБ', 'GTX 1060') + game('Рекомендуемые системные требования', '16 ГБ', 'RTX 3070'),
      '[DL] Some Game [P] [RUS + ENG] (2023, RPG)');
    assert.equal(req.games, undefined);
    assert.equal(req.ramGb, 8);
  });

  test('links to several Steam games name none', async () => {
    const links = '<a href="https://store.steampowered.com/app/8980/">1</a><a href="https://store.steampowered.com/app/49520/">2</a>';
    assert.equal((await windows(links + game('A', '1 ГБ', 'GTX 660') + game('B', '2 ГБ', 'GTX 660'))).steamAppId, null);
    assert.equal((await windows('<a href="https://store.steampowered.com/app/8980/">1</a><a href="https://store.steampowered.com/app/8980/x">2</a>')).steamAppId, '8980');
  });
});

describe('Steam', () => {
  test('the app from a store or SteamDB link', async () => {
    const id = (body) => page.evaluate((body) => {
      const doc = new DOMParser().parseFromString(`<div class="post_body">${body}</div>`, 'text/html');
      return findSteamApp(doc.querySelector('.post_body'));
    }, body);
    assert.equal(await id('<a href="https://store.steampowered.com/app/1203620/Enshrouded/" class="postLink">Steam</a>'), '1203620');
    assert.equal(await id('<a href="https://steamdb.info/app/28050/patchnotes/" class="postLink">SteamDB</a>'), '28050');
    assert.equal(await id('<a href="https://www.gog.com/game/cyberpunk_2077" class="postLink">GOG</a>'), null);
  });

  test('the game name from a release title', async () => {
    const name = (title) => page.evaluate((title) => gameName(title), title);
    assert.equal(await name('[DL] Cyberpunk 2077 [P] [RUS + ENG + 17 / RUS + ENG] (2020, RPG) (2.31 + DLC) [GOG]'), 'Cyberpunk 2077');
    assert.equal(await name('[DL] [Некондиционная раздача] The Witcher 3: Wild Hunt [P] [RUS]'), 'The Witcher 3: Wild Hunt');
    assert.equal(await name('South Park: The Stick of Truth / Южный парк: Палка истины [L]'), 'South Park: The Stick of Truth');
  });
});

describe('own badges', () => {
  const matches = (pattern, text) => page.evaluate(({ pattern, text }) => compilePattern(pattern)?.test(text) ?? null, { pattern, text });

  test('words separated by |, any case', async () => {
    assert.equal(await matches('DLC|дополнения', 'Все Дополнения включены'), true);
    assert.equal(await matches('DLC|дополнения', 'Только игра'), false);
    assert.equal(await matches('C++|a.b', 'компилятор C++'), true);
  });

  test('a regular expression', async () => {
    assert.equal(await matches('/\\bDLC\\b/', 'dlc'), true);
    assert.equal(await matches('/\\bDLC\\b/', 'DLCs'), false);
  });

  test('new examples reach saved badges once', async () => {
    const ids = await page.evaluate(() => {
      const mine = { id: 'x1', label: 'Моя', pattern: 'моя', color: '#d32f2f', filter: false, enabled: true };
      const ids = (saved) => withExamples(saved).customBadges.map((badge) => badge.id).join(' ');
      return {
        fresh: ids({}),
        // Saved before examplesSeen: whatever example is missing comes once
        before: ids({ customBadges: [mine, { id: 'coop' }] }),
        // The same after it came: deleted ones stay deleted
        after: ids({ customBadges: [mine], examplesSeen: ['dlc', 'coop', 'overclock'] }),
      };
    });
    assert.deepEqual(ids, { fresh: 'dlc coop overclock', before: 'x1 coop dlc overclock', after: 'x1' });
  });

  test('the overclock example', async () => {
    const pattern = await page.evaluate(() => exampleCustomBadges().find((badge) => badge.id === 'overclock').pattern);
    assert.equal(await matches(pattern, 'Лучше всего использовать разгон консоли.'), true);
    assert.equal(await matches(pattern, 'Лучше всего играть с геймпадом.'), false);
  });

  test('empty or broken is null', async () => {
    assert.equal(await matches('', 'x'), null);
    assert.equal(await matches('/(/', 'x'), null);
  });
});

describe('locales', () => {
  test('every language has every English text with the same {placeholders}', async () => {
    const problems = await page.evaluate(() => {
      const found = [];
      const slots = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
      for (const code of LANGUAGES) {
        for (const [key, text] of Object.entries(LOCALES.en)) {
          const own = LOCALES[code][key];
          if (own === undefined) found.push(`${code}: no ${key}`);
          else if (slots(own) !== slots(text)) found.push(`${code}: ${key} has {${slots(own)}}, not {${slots(text)}}`);
        }
      }
      return found;
    });
    assert.deepEqual(problems, []);
  });
});

describe('badge colors', () => {
  test('the defaults, the user\'s own, and broken values ignored', async () => {
    const css = await page.evaluate(() => badgeCss({
      badgeStyles: { voice: { background: '#000000', text: 'red; } body { display: none' } },
    }));
    assert.match(css, /\.rts-badge\.rts-voice \{ color: #ffffff; background: #000000; border-color: #d32f2f; \}/);
    assert.match(css, /\.rts-badge\.rts-deck-verified \{ color: #222222; background: #ffffff; border-color: #1976d2; \}/);
    assert.match(css, /\.rts-badge\.rts-oc-kefir\.rts-soft \{ color: #1565c0;/);
    assert.doesNotMatch(css, /display/);
  });

  test('every style has its own id and all three colors', async () => {
    const problems = await page.evaluate(() => {
      const styles = styleGroups().flatMap((group) => group.styles);
      const ids = styles.map((style) => style.id);
      return [
        ...ids.filter((id, i) => ids.indexOf(id) !== i).map((id) => `repeated ${id}`),
        ...styles.filter((style) => !['text', 'background', 'border'].every((part) => /^#[0-9a-f]{6}$/i.test(style.colors[part])))
          .map((style) => `colors of ${style.id}`),
      ];
    });
    assert.deepEqual(problems, []);
  });
});

describe('Switch: fits my console', () => {
  test('nothing above my overclock, required or only advised', async () => {
    const fits = await page.evaluate(() => {
      const oc = (level, cpu, extra = {}) => ({ level, freqs: cpu ? { cpu } : {}, fw: null, max: false, quote: '', ...extra });
      const mine = (switchFirmware) => ({ switchFirmware, switchRevision: 'mariko' });
      return {
        advisedAboveKefirOnKefir: fitsConsole(oc('recommended', 2397), mine('kefir')),
        advisedMaxOnKefir: fitsConsole(oc('recommended', 0, { max: true }), mine('kefir')),
        requiredAboveKefirOnKefir: fitsConsole(oc('required', 2397), mine('kefir')),
        named4ifirOnKefir: fitsConsole(oc('required', 0, { fw: '4ifir' }), mine('kefir')),
        advisedKefirOnKefir: fitsConsole(oc('recommended', 1785), mine('kefir')),
        advisedKefirOnStock: fitsConsole(oc('recommended', 1785), mine('stock')),
        requiredAboveKefirOn4ifir: fitsConsole(oc('required', 2397), mine('4ifir')),
        notNeededOnStock: fitsConsole(oc('none'), mine('stock')),
      };
    });
    assert.deepEqual(fits, {
      advisedAboveKefirOnKefir: false,
      advisedMaxOnKefir: false,
      requiredAboveKefirOnKefir: false,
      named4ifirOnKefir: false,
      advisedKefirOnKefir: true,
      advisedKefirOnStock: false,
      requiredAboveKefirOn4ifir: true,
      notNeededOnStock: true,
    });
  });

  test('badges: the level as put, the firmware as asked for', async () => {
    const texts = await page.evaluate(() => {
      const kefir = { switchFirmware: 'kefir', switchRevision: 'mariko' };
      const badge = (oc) => overclockBadge({ freqs: {}, fw: null, max: false, quote: '', ...oc }, kefir).text;
      return [
        badge({ level: 'recommended' }),
        badge({ level: 'recommended', max: true }),
        badge({ level: 'required' }),
        badge({ level: 'required', fw: '4ifir' }),
      ];
    });
    assert.deepEqual(texts, [
      'Желателен разгон: Кефир',
      '⚠ Желателен разгон: 4IFIR',
      'Обязателен разгон: Кефир',
      '⚠ Обязателен разгон: 4IFIR',
    ]);
  });
});
