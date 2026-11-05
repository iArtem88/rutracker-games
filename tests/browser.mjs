import { chromium } from 'playwright-core';

// Playwright's own Chromium (`npx playwright install chromium`), or else the installed Chrome
export async function launchBrowser() {
  try {
    return await chromium.launch();
  } catch {
    return chromium.launch({ channel: 'chrome' });
  }
}
