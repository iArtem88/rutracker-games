// Builds the extension: build/<target>/ and dist/rutracker-games-<version>-<target>.zip.
// chrome is the Chrome Web Store's, chrome-full and firefox the full ones.
// Needs the `zip` command.
import { execFileSync } from 'node:child_process';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const manifest = JSON.parse(await readFile(`${root}src/manifest.json`, 'utf8'));

// Each build: its manifest, and the files it goes without
const targets = {
  // The Chrome Web Store's: fastpic's own pages aren't loaded at all (they come
  // with their ads' requests), so its "_…" pictures stay thumbnails there
  chrome: {
    manifest: (m) => ({ ...m, content_scripts: m.content_scripts.filter((entry) => !entry.js.includes('content/fastpic.js')) }),
    drop: ['content/fastpic.js'],
  },
  // The full one, installed by hand from the releases
  'chrome-full': { manifest: (m) => m },
  // Firefox runs background scripts, not service workers, and wants an add-on id.
  // Signed by Mozilla but not listed on AMO, it learns of updates from the
  // updates.json of the latest release (see .github/workflows/ci.yml)
  firefox: {
    manifest: (m) => ({
      ...m,
      background: { scripts: [m.background.service_worker] },
      browser_specific_settings: {
        gecko: {
          id: 'rutracker-games@iartem88',
          strict_min_version: '142.0',
          data_collection_permissions: { required: ['none'] },
          update_url: 'https://github.com/iArtem88/rutracker-games/releases/latest/download/updates.json',
        },
      },
    }),
  },
};

await rm(`${root}build`, { recursive: true, force: true });
await mkdir(`${root}dist`, { recursive: true });
for (const [target, { manifest: transform, drop = [] }] of Object.entries(targets)) {
  const dir = `${root}build/${target}`;
  await cp(`${root}src`, dir, { recursive: true });
  for (const file of drop) await rm(`${dir}/${file}`);
  // The GPL goes along with the program
  await cp(`${root}LICENSE`, `${dir}/LICENSE`);
  await writeFile(`${dir}/manifest.json`, `${JSON.stringify(transform(manifest), null, 2)}\n`);
  const zip = `${root}dist/rutracker-games-${manifest.version}-${target}.zip`;
  await rm(zip, { force: true });
  execFileSync('zip', ['-r', '-X', '-q', zip, '.'], { cwd: dir });
  console.log(zip);
}
