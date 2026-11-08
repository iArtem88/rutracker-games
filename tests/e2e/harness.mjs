// Real Chrome, headless, with the extension loaded over CDP (branded Chrome
// ignores --load-extension). The extension is a copy of src/ that also runs
// on the mock site; Steam access is granted up front, as the permission
// prompt can't be clicked from here.
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright-core';

const SRC = new URL('../../src/', import.meta.url).pathname;
export const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));

// src/, or a build of it (build/chrome/, the Chrome Web Store's)
async function extensionCopy(source = SRC) {
  const dir = await mkdtemp(join(tmpdir(), 'rutracker-games-e2e-'));
  await cp(source, dir, { recursive: true });
  const manifest = JSON.parse(await readFile(join(dir, 'manifest.json'), 'utf8'));
  // Match patterns ignore the port
  const script = (file) => manifest.content_scripts.find((entry) => entry.js.includes(file));
  script('content/content.js').matches.push('http://127.0.0.1/forum/viewforum.php*', 'http://127.0.0.1/forum/tracker.php*');
  script('content/topic.js').matches.push('http://127.0.0.1/forum/viewtopic.php*');
  script('content/fastpic.js')?.matches.push('http://127.0.0.1/view/*');
  manifest.host_permissions = [...(manifest.host_permissions || []), 'https://store.steampowered.com/*'];
  await writeFile(join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  // fastpic's pages are the mock's own
  const games = join(dir, 'content/games.js');
  const code = await readFile(games, 'utf8');
  const fastpic = String.raw`(?:www\.)?fastpic\.(?:org|ru)\/view`;
  if (!code.includes(fastpic)) throw new Error('No FASTPIC_VIEW to point at the mock');
  await writeFile(games, code.replace(fastpic, String.raw`(?:(?:www\.)?fastpic\.(?:org|ru)|127\.0\.0\.1:\d+)\/view`));
  return dir;
}

// CHROME_PATH, else the installed Chrome; HEADED=1 shows its window
async function launch() {
  const options = { headless: !process.env.HEADED, args: ['--enable-unsafe-extension-debugging'], ignoreDefaultArgs: ['--disable-extensions'] };
  if (process.env.CHROME_PATH) return chromium.launch({ ...options, executablePath: process.env.CHROME_PATH });
  return chromium.launch({ ...options, channel: 'chrome' });
}

export async function startBrowser({ source } = {}) {
  const dir = await extensionCopy(source);
  const browser = await launch();
  const cdp = await browser.newBrowserCDPSession();
  const { id } = await cdp.send('Extensions.loadUnpacked', { path: dir });
  let seq = 0;
  const pending = new Map();
  const listeners = new Map();
  cdp.on('Target.receivedMessageFromTarget', ({ sessionId, message }) => {
    const m = JSON.parse(message);
    if (m.id && pending.has(m.id)) {
      pending.get(m.id)(m);
      pending.delete(m.id);
    }
    if (m.method) listeners.get(sessionId)?.(m);
  });

  // A tab in the default profile, where content scripts run
  async function open(url, { width = 1280, height = 900, wait = 1500 } = {}) {
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: false });
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const i = ++seq;
      pending.set(i, (m) => (m.error ? reject(new Error(m.error.message)) : resolve(m.result)));
      cdp.send('Target.sendMessageToTarget', { sessionId, message: JSON.stringify({ id: i, method, params }) });
    });
    const consoleMessages = [];
    listeners.set(sessionId, (m) => {
      if (m.method === 'Runtime.consoleAPICalled') {
        consoleMessages.push({ type: m.params.type, text: m.params.args.map((a) => a.value ?? a.description ?? '').join(' ') });
      }
      if (m.method === 'Runtime.exceptionThrown') {
        consoleMessages.push({ type: 'exception', text: m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text });
      }
    });
    await send('Runtime.enable');
    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url });
    await sleep(wait);
    const ev = async (expression) => {
      const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return r.result.value;
    };
    // A screenshot of the page, or of a box on it
    const shot = async (file, clip) => {
      const params = clip ? { clip: { ...clip, scale: 1 }, captureBeyondViewport: true } : {};
      await writeFile(file, Buffer.from((await send('Page.captureScreenshot', params)).data, 'base64'));
    };
    const close = () => cdp.send('Target.closeTarget', { targetId });
    return { ev, send, shot, close, consoleMessages };
  }

  const options = `chrome-extension://${id}/ui/settings.html`;
  // The extension's storage, through its own page
  const page = await open(options, { wait: 800 });
  const storage = {
    setSettings: (settings) => page.ev(`chrome.storage.sync.set({ settings: ${JSON.stringify(settings)} })`),
    clear: () => page.ev('Promise.all([chrome.storage.sync.clear(), chrome.storage.local.clear()])'),
    local: (key) => page.ev(`chrome.storage.local.get(${JSON.stringify(key)}).then((r) => r[${JSON.stringify(key)}] ?? null)`),
    eval: (expression) => page.ev(expression),
  };

  return {
    id,
    options,
    open,
    storage,
    // As when the extension is updated or reloaded: the pages keep its scripts
    uninstall: () => cdp.send('Extensions.uninstall', { id }),
    async close() {
      await browser.close();
      await rm(dir, { recursive: true, force: true });
    },
  };
}

// Each release row of a list: {state, badges, thumbs}
export const ROWS = `Object.fromEntries([...document.querySelectorAll('tr.hl-tr')].map((row) => {
  const id = row.dataset.topic_id || /t=(\\d+)/.exec(row.querySelector('a.tLink')?.getAttribute('href') || '')?.[1];
  const box = row.querySelector('.rts-box');
  const state = !box ? 'none' : box.classList.contains('rts-error') ? 'error' : box.classList.contains('rts-loading') ? 'loading' : 'done';
  return [id, {
    state,
    hidden: row.classList.contains('rts-hidden'),
    badges: box ? [...box.querySelectorAll('.rts-badge')].map((b) => b.textContent) : [],
    thumbs: box ? box.querySelectorAll('.rts-thumbs img').length : 0,
  }];
}))`;

// Waits till no row is loading
export async function settled(tab, timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const rows = await tab.ev(ROWS);
    if (!Object.values(rows).some((row) => row.state === 'loading')) return rows;
    await sleep(300);
  }
  return tab.ev(ROWS);
}
