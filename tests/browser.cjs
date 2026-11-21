const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const { createDatabase } = require('../server/db.cjs');
const { createDevServer } = require('../scripts/dev.cjs');

(async () => {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'sky-browser-'));
  const database = createDatabase({ url: pathToFileURL(path.join(output, 'test.db')).href });
  const { server } = createDevServer({ database });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) });
    for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(origin);
      await page.waitForFunction(() => !document.querySelector('#saveBtn').disabled);
      await page.getByRole('button', { name: 'Đăng nhập / Đăng ký', exact: true }).click();
      await page.getByRole('button', { name: 'Đăng ký', exact: true }).click();
      await page.locator('#accountUsername').fill(`browser_${viewport.width}`);
      await page.locator('#accountPassword').fill('browser-password-123');
      await page.locator('#accountConfirm').fill('browser-password-123');
      assert.equal(await page.locator('input[type=email]').count(), 0);
      await page.screenshot({ path: path.join(output, `register-${viewport.width}.png`), fullPage: true });
      await page.locator('#accountSubmit').click();
      await page.locator('#accountDialog').waitFor({ state: 'hidden' });
      assert.equal(await page.locator('#accountName').innerText(), `browser_${viewport.width}`);
      const cookies = await context.cookies();
      assert.ok(cookies.some(cookie => cookie.name === 'sky_session' && cookie.httpOnly && cookie.sameSite === 'Lax'));
      await page.getByRole('tab', { name: 'Bản nhạc & AI' }).click();
      await page.locator('#titleIn').fill(`Bài riêng ${viewport.width}`);
      await page.locator('#saveBtn').click();
      await page.waitForFunction(() => !document.querySelector('#saveBtn').disabled);
      await page.getByRole('tab', { name: 'Thư viện', exact: true }).click();
      await page.locator('#songs .song').filter({ hasText: `Bài riêng ${viewport.width}` }).waitFor();
      await page.reload();
      await page.waitForFunction(() => !document.querySelector('#logoutBtn').hidden);
      await page.getByRole('tab', { name: 'Thư viện', exact: true }).click();
      await page.locator('#songs .song').filter({ hasText: `Bài riêng ${viewport.width}` }).waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: path.join(output, `library-${viewport.width}.png`), fullPage: true });
      // Tab thứ hai phải xóa thư viện cũ khi tab đầu đăng xuất.
      const otherTab = await context.newPage();
      await otherTab.goto(origin);
      await otherTab.waitForFunction(() => !document.querySelector('#logoutBtn').hidden);
      await otherTab.getByRole('tab', { name: 'Thư viện', exact: true }).click();
      await otherTab.locator('#songs .song').filter({ hasText: `Bài riêng ${viewport.width}` }).waitFor();
      await page.locator('#logoutBtn').click();
      await page.locator('#accountBtn').waitFor({ state: 'visible' });
      await otherTab.waitForFunction(() => document.querySelector('#logoutBtn').hidden);
      assert.equal(await otherTab.locator('#songs').innerText().then(text => text.includes(`Bài riêng ${viewport.width}`)), false);
      await page.getByRole('button', { name: 'Đăng nhập / Đăng ký', exact: true }).click();
      await page.locator('#accountUsername').fill(`browser_${viewport.width}`);
      await page.locator('#accountPassword').fill('browser-password-123');
      await page.locator('#accountSubmit').click();
      await page.locator('#accountDialog').waitFor({ state: 'hidden' });
      await page.getByRole('tab', { name: 'Thư viện', exact: true }).click();
      await page.locator('#songs .song').filter({ hasText: `Bài riêng ${viewport.width}` }).waitFor();
      await page.getByRole('button', { name: `Xóa bài Bài riêng ${viewport.width}`, exact: true }).click();
      await page.waitForFunction(title => !document.querySelector('#songs').textContent.includes(title), `Bài riêng ${viewport.width}`);
      assert.deepEqual(errors, []);
      console.log(`PASS Chromium ${viewport.width}: register, save, reload, cookie, two-tab logout, login, delete, responsive layout`);
      await context.close();
    }
    for (const route of ['/.env.local', '/server/schema.cjs', '/.data/sky.db', '/node_modules/@libsql/client/package.json']) {
      assert.equal((await fetch(origin + route)).status, 404);
    }
    console.log('PASS Private server/config/database files are not exposed by the dev server');
    console.log(`Screenshots: ${output}`);
  } finally {
    if (browser) await browser.close();
    server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); database.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
