// A tiny RuTracker for the end-to-end tests: forum lists of the supported
// sections, topic pages, the search page and thumbnails. The tests steer it
// through /__set (a topic's size, a refusal, a slow site) and read /__hits.
import http from 'node:http';

// A 1×1 PNG for every thumbnail
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

const field = (name, value) => `<span class="post-b">${name}</span>: ${value}<br>`;
const shots = (n) => `<div class="sp-wrap"><div class="sp-head"><span>Скриншоты</span></div><div class="sp-body">${
  Array.from({ length: n }, (_, i) => `<a class="postLink" href="ORIGIN/img/full-${i}.png"><var class="postImg" title="ORIGIN/img/${i}.png"></var></a>`).join('')}</div></div>`;
const game = (name, ram, gpu) => `<div class="sp-wrap"><div class="sp-head"><span>${name}</span></div><div class="sp-body">
  Системные требования:<br>${field('Оперативная память', ram)}${field('Видеокарта', gpu)}${shots(1)}</div></div>`;

// topic id -> {forum, title, post}; ORIGIN becomes the mock's address (thumbnails need full URLs)
export const TOPICS = {
  // Switch
  101: { forum: '1605', title: '[Nintendo Switch] Alpha Quest [NSP][RUS]',
    post: `${field('Язык интерфейса', 'Русский')}${field('Язык озвучки', 'Русский')}Лучше всего использовать разгон консоли.<br>${shots(3)}` },
  102: { forum: '1605', title: '[Nintendo Switch] Beta Racer [NSZ][RUS/ENG]',
    post: `${field('Язык интерфейса', 'Русский')}${field('Язык озвучки', 'Английский')}Лучше всего максимально разогнать консоль.<br>${shots(2)}` },
  103: { forum: '1605', title: '[Nintendo Switch] Gamma Port [NRO][ENG]',
    post: `${field('Язык интерфейса', 'Английский')}${field('Язык озвучки', 'Английский')}Обязательно нужен разгон: 2397 МГц CPU.<br>` },
  104: { forum: '1605', title: '[Nintendo Switch] Delta Tale [NSP][RUS]',
    post: `${field('Язык интерфейса', 'Русский')}${field('Озвучка', 'отсутствует')}Работает без разгона.<br>${shots(1)}` },
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
      const post = topic.post.replaceAll('ORIGIN', `http://${req.headers.host}`);
      return send(200, page(topic.title, `<table><tr><td><div class="post_body">${post}</div></td></tr></table>`));
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
