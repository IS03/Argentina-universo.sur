// Public approved destinations only. Reproducible visual comparison, never a private editorial renderer.
import { chromium, devices } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const [base, phase] = process.argv.slice(2);
if (!/^http:\/\/127\.0\.0\.1:\d+$|^https:\/\/[a-z0-9-]+\.argentina-universo-sur-preview\.pages\.dev$/.test(base ?? '') || !['before', 'after', 'preview'].includes(phase)) throw Error('EXPLICIT_REVIEW_TARGET_REQUIRED');
const dir = `.artifacts/pr20/capturas/${phase}`;
await mkdir(dir, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const reports = [];
try {
  for (const [profile, options] of [['desktop', { viewport: { width: 1440, height: 1000 } }], ['pixel7', devices['Pixel 7']], ['320', { viewport: { width: 320, height: 800 }, isMobile: true, hasTouch: true }]]) {
    const context = await browser.newContext({ ...options, reducedMotion: 'reduce' });
    for (const slug of ['santa-fe-capital', 'alta-gracia']) {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('requestfailed', r => { if (!(r.method() === 'HEAD' && r.failure()?.errorText === 'net::ERR_ABORTED')) errors.push('RESOURCE_FAILED'); });
      await page.goto(`${base}/destinos/${slug}`);
      await page.locator('article figure img').evaluate(i => i.decode());
      await page.evaluate(() => document.fonts.ready);
      const reject = page.getByRole('button', { name: 'Rechazar', exact: true });
      if (await reject.isVisible()) await reject.click();
      await page.screenshot({ path: `${dir}/${slug}-${profile}.png`, fullPage: true, scale: 'css' });
      const metrics = await page.evaluate(() => ({
        width: innerWidth, height: document.documentElement.scrollHeight,
        overflow: document.documentElement.scrollWidth > innerWidth,
        paragraphs: [...document.querySelectorAll('[data-editorial-text]')].map(e => ({ fontSize: getComputedStyle(e).fontSize, lineHeight: getComputedStyle(e).lineHeight, width: Math.round(e.getBoundingClientRect().width) })),
        brokenAnchors: [...document.querySelectorAll('article a[href^="#"]')].filter(a => !document.getElementById(a.hash.slice(1))).length,
        image: document.querySelector('article figure img').currentSrc.split('/').at(-1),
      }));
      reports.push({ phase, slug, profile, ...metrics, errors });
      if (metrics.overflow || metrics.brokenAnchors || errors.length) throw Error(`VISUAL_CHECK_FAILED ${slug} ${profile}`);
      await page.close();
    }
    await context.close();
  }
} finally { await browser.close(); }
await writeFile(`.artifacts/pr20/reports/visual-${phase}.json`, JSON.stringify({ base, views: reports }, null, 2));
console.log(JSON.stringify({ phase, views: reports.length, errors: 0 }));
