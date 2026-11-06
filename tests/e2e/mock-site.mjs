// A tiny RuTracker for the end-to-end tests: forum lists of the supported
// sections, topic pages, the search page and thumbnails. The tests steer it
// through /__set (a topic's size, a refusal, a slow site) and read /__hits.
import http from 'node:http';

// A 1×1 PNG for every thumbnail
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

const field = (name, value) => `<span class="post-b">${name}</span>: ${value}<br>`;
// Thumbnails linked straight to their full pictures; "missing" ones answer 404,
// "page" ones link to fastpic's page of the picture, with none (null) to the
// host's page. "bare" ones are big pictures put in with no link at all.
const shotLink = (full, i) => (full === 'page' ? `view/126/2025/1204/_${i}.png.html` : full ? `img/${full}-${i}.png` : `show/${i}`);
const shot = (full, i) => (full === 'bare' ? `<var class="postImg" title="ORIGIN/img/big-${i}.svg"></var>`
  : `<a class="postLink" href="ORIGIN/${shotLink(full, i)}"><var class="postImg" title="ORIGIN/img/${i}.png"></var></a>`);
const shots = (n, full = 'full', from = 0) => `<div class="sp-wrap"><div class="sp-head"><span>Скриншоты</span></div><div class="sp-body">${
  Array.from({ length: n }, (_, k) => shot(full, from + k)).join('')}</div></div>`;
const game = (name, ram, gpu) => `<div class="sp-wrap"><div class="sp-head"><span>${name}</span></div><div class="sp-body">
  Системные требования:<br>${field('Оперативная память', ram)}${field('Видеокарта', gpu)}${shots(1)}</div></div>`;

// The site's spoilers: closed at first, an open one makes <img> of its <var>.
// Their handler comes a moment after the page is parsed, as the site's does.
// A press of a mouse button on an outside link swaps it for out.php?url=….
const SPOILERS = `<style>.sp-body { display: none; }</style><script>
document.addEventListener('mousedown', (event) => {
  const link = event.target.closest('a.postLink:not(.out)');
  if (!link) return;
  link.classList.add('out');
  link.target = '_blank';
  link.setAttribute('href', 'out.php?url=' + encodeURIComponent(link.getAttribute('href')));
});
document.addEventListener('DOMContentLoaded', () => setTimeout(() => document.addEventListener('click', (event) => {
  const head = event.target.closest('.sp-head');
  if (!head) return;
  const body = head.nextElementSibling;
  const open = !head.classList.contains('unfolded');
  head.classList.toggle('unfolded', open);
  body.style.display = open ? 'block' : 'none';
  for (const v of body.querySelectorAll('var.postImg')) {
    const img = document.createElement('img');
    img.className = 'postImg';
    img.src = v.title;
    v.replaceWith(img);
  }
}), 300));
</script>`;

// topic id -> {forum, title, post, comment}; ORIGIN becomes the mock's address (thumbnails need full URLs)
export const TOPICS = {
  // Switch
  101: { forum: '1605', title: '[Nintendo Switch] Alpha Quest [NSP][RUS]',
    post: `${field('Язык интерфейса', 'Русский')}${field('Язык озвучки', 'Русский')}Лучше всего использовать разгон консоли.<br>${shots(3)}` },
  102: { forum: '1605', title: '[Nintendo Switch] Beta Racer [NSZ][RUS/ENG]',
    post: `${field('Язык интерфейса', 'Русский')}${field('Язык озвучки', 'Английский')}Лучше всего максимально разогнать консоль.<br>${shots(1, 'page')}${shots(1, null, 1)}` },
  103: { forum: '1605', title: '[Nintendo Switch] Gamma Port [NRO][ENG]',
    post: `${field('Язык интерфейса', 'Английский')}${field('Язык озвучки', 'Английский')}Обязательно нужен разгон: 2397 МГц CPU.<br>${shots(1, 'bare')}<div class="sp-wrap"><div class="sp-head"><span>Скриншоты</span></div><div class="sp-body"><var class="postImg" title="https://thumbs4.imagebam.com/1/2/3/ME1_t.jpg"></var></div></div>` },
  104: { forum: '1605', title: '[Nintendo Switch] Delta Tale [NSP][RUS]',
    post: `${field('Язык интерфейса', 'Русский')}${field('Озвучка', 'отсутствует')}Работает без разгона.<br>${shots(1, 'missing')}` },
  // An anthology on its own page: a spoiler per game, its screenshots inside
  401: { forum: '908', title: '[PS] Iota Collection [RUS]',
    post: `<div class="sp-wrap"><div class="sp-head folded"><span>Iota</span></div><div class="sp-body">${shots(2)}</div></div>
      <div class="sp-wrap"><div class="sp-head folded"><span>Iota 2</span></div><div class="sp-body">${shots(2, 'full', 2).replace('<a class="postLink"', '<a class="postLink" href="ORIGIN/img/full-9.png"><var class="postImg" title="ORIGIN/img/missing-9.png"></var></a><a class="postLink"')}${shots(1, 'bare', 4)}</div></div>`,
    comment: `${shots(1, 'full', 9)}` },
  // A forum the extension doesn't know
  402: { forum: '9999', title: 'Some film', post: `${shots(1)}` },
  // PlayStation 4
  201: { forum: '973', title: '[PS4] Epsilon [CUSA00001] [RUS]', post: `${field('Минимальная версия прошивки', '9.00')}` },
  202: { forum: '973', title: '[PS4] Zeta [CUSA00002] [ENG]', post: `${field('Минимальная версия прошивки', '5.05')}` },
  // Windows
  301: { forum: '647', title: '[DL] Eta Shooter [P] [RUS + ENG] (2021, FPS)',
    post: `Системные требования:<br>${field('Оперативная память', '8 ГБ')}${field('Видеокарта', 'NVIDIA GeForce GTX 1060')}` },
  302: { forum: '647', title: '[DL] [Антология] Theta 1, 2 [P] [RUS + ENG] (2010—2014, FPS)',
    post: `${game('Theta', '2 ГБ', 'GeForce GTX 660')}${game('Theta 2', '6 ГБ', 'GeForce GTX 780')}` },
  303: { forum: '647', title: '[DL] Iota Heavy [P] [ENG] (2026, FPS)',
    post: `Системные требования:<br>${field('Оперативная память', '32 ГБ')}${field('Видеокарта', 'RTX 4090')}` },
};

export function startMockSite() {
  let hits = {};
  let sizes = {};
  let refusals = {};
  let slowMs = 0;
  let tall = false;
  const reset = () => {
    hits = {};
    sizes = Object.fromEntries(Object.keys(TOPICS).map((id) => [id, '12.71&nbsp;GB']));
    refusals = {};
    slowMs = 0;
    tall = false;
  };
  reset();

  const page = (title, body) => `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title></head><body>${body}</body></html>`;
  const forumRow = (id) => `<tr class="hl-tr" data-topic_id="${id}"${tall ? ' style="height:2000px"' : ''}>
    <td class="vf-col-t-title"><div class="torTopic"><a class="tt-text" href="viewtopic.php?t=${id}">${TOPICS[id].title}</a></div></td>
    <td class="vf-col-tor"><div class="small"><a href="dl.php?t=${id}" class="small f-dl dl-stub">${sizes[id]}</a></div></td></tr>`;
  const searchRow = (id, forum = TOPICS[id].forum, title = TOPICS[id].title) => `<tr class="hl-tr">
    <td class="f-name-col"><a href="tracker.php?f=${forum}">forum ${forum}</a></td>
    <td class="t-title-col"><div class="t-title"><a class="tLink" href="viewtopic.php?t=${id}">${title}</a></div></td>
    <td class="tor-size"><a class="small tr-dl dl-stub" href="dl.php?t=${id}">${sizes[id] || '1&nbsp;GB'} ↓</a></td></tr>`;

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const q = Object.fromEntries(url.searchParams);
    const send = (status, body, type = 'text/html; charset=utf-8') => {
      res.writeHead(status, { 'Content-Type': type });
      res.end(body);
    };
    if (url.pathname === '/__reset') return reset(), send(200, 'ok');
    if (url.pathname === '/__hits') return send(200, JSON.stringify(hits), 'application/json');
    if (url.pathname === '/__set') {
      if (q.size) sizes[q.t] = q.size;
      if (q.refuse) refusals[q.t] = { status: Number(q.refuse), times: Number(q.times || 1) };
      if (q.slow) slowMs = Number(q.slow);
      if (q.tall) tall = q.tall === '1';
      return send(200, 'ok');
    }
    // fastpic's page of a picture: the signed link to it, and the same as a download
    if (url.pathname.startsWith('/view/')) {
      const origin = `http://${req.headers.host}`;
      const file = url.pathname.split('/').pop().replace(/\.html$/, '');
      const big = `${origin}/big/2025/1204/ab/${file}?md5=abc&amp;expires=1793988000`;
      return send(200, page('fastpic', `<img src="${origin}/preview/2025/1204/ab/${file}?md5=abc&amp;expires=1793988000">
        <a href="${big}&amp;dl=1">download</a> <input value="[IMG]${big}[/IMG]">`));
    }
    if (url.pathname.startsWith('/big/') || url.pathname.startsWith('/preview/')) return send(200, PNG, 'image/png');
    if (url.pathname.startsWith('/img/big-')) return send(200, '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="teal"/></svg>', 'image/svg+xml');
    if (url.pathname.startsWith('/img/missing')) return send(404, '');
    if (url.pathname.startsWith('/img/')) return send(200, PNG, 'image/png');
    if (url.pathname === '/forum/viewforum.php') {
      const ids = Object.keys(TOPICS).filter((id) => TOPICS[id].forum === q.f);
      // A rules row first: no torrent, so no box
      const rules = '<tr class="hl-tr" data-topic_id="1"><td class="vf-col-t-title"><div class="torTopic"><a class="tt-text" href="viewtopic.php?t=1">Правила раздела</a></div></td><td class="vf-col-tor"></td></tr>';
      return send(200, page(`forum ${q.f}`, `<table class="vf-table">${rules}${ids.map(forumRow).join('')}</table>`));
    }
    if (url.pathname === '/forum/tracker.php') {
      // A release from a forum the extension doesn't know stays as it is
      const rows = [searchRow('101'), searchRow('301'), searchRow('999', '9999', 'Some film')];
      return send(200, page('search', `<table id="tor-tbl">${rows.join('')}</table>`));
    }
    if (url.pathname === '/forum/viewtopic.php') {
      hits[q.t] = (hits[q.t] || 0) + 1;
      if (slowMs) await new Promise((ok) => setTimeout(ok, slowMs));
      const refusal = refusals[q.t];
      if (refusal?.times > 0) {
        refusal.times--;
        return send(refusal.status, page('Access denied', 'denied'));
      }
      const topic = TOPICS[q.t];
      if (!topic) return send(404, page('gone', 'gone'));
      const origin = `http://${req.headers.host}`;
      const post = topic.post.replaceAll('ORIGIN', origin);
      const comment = (topic.comment || '').replaceAll('ORIGIN', origin);
      return send(200, page(topic.title, `<div class="t-breadcrumb-top"><a href="index.php?c=19">Игры</a> » <a href="viewforum.php?f=${topic.forum}">forum</a></div>
        <table id="topic_main"><tbody id="post_1"><tr><td><div class="post_body">${post}</div><table class="attach"><tr><td><a class="dl-link" href="dl.php?t=${q.t}">torrent</a></td></tr></table></td></tr></tbody>
        <tbody id="post_2"><tr><td><div class="post_body">${comment}</div></td></tr></tbody></table>${SPOILERS}`));
    }
    send(404, '');
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const origin = `http://127.0.0.1:${server.address().port}`;
      const control = async (path) => (await fetch(`${origin}${path}`)).text();
      resolve({
        origin,
        reset: () => control('/__reset'),
        set: (params) => control(`/__set?${new URLSearchParams(params)}`),
        hits: async () => JSON.parse(await control('/__hits')),
        close: () => new Promise((done) => server.close(done)),
      });
    });
  });
}
