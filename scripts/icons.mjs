// The PNG icons the manifest uses, scaled down from the logo (docs/media/logo.png).
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { launchBrowser } from '../tests/browser.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const logo = `data:image/png;base64,${(await readFile(`${root}docs/media/logo.png`)).toString('base64')}`;
const browser = await launchBrowser();
const page = await browser.newPage();
for (const size of [16, 32, 48, 128]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent('<style>html,body{margin:0;background:transparent}</style><canvas></canvas>');
  // Halving step by step keeps the small sizes crisp
  await page.evaluate(async ({ logo, size }) => {
    const img = new Image();
    img.src = logo;
    await img.decode();
    let source = img;
    let side = img.width;
    while (side / 2 >= size) {
      side /= 2;
      const step = new OffscreenCanvas(side, side);
      const ctx = step.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(source, 0, 0, side, side);
      source = step;
    }
    const canvas = document.querySelector('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, 0, 0, size, size);
  }, { logo, size });
  await page.locator('canvas').screenshot({ path: `${root}src/icons/icon-${size}.png`, omitBackground: true });
  console.log(`icon-${size}.png`);
}
await browser.close();
