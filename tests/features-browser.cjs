const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const { Midi } = require('@tonejs/midi');
const { createDatabase } = require('../server/db.cjs');
const { createDevServer } = require('../scripts/dev.cjs');
async function register(page, name) {
  await page.getByRole('button', { name: 'Đăng nhập / Đăng ký', exact: true }).click();
  await page.getByRole('button', { name: 'Đăng ký', exact: true }).click();
  await page.locator('#accountUsername').fill(name);
  await page.locator('#accountPassword').fill('browser-password-123');
  await page.locator('#accountConfirm').fill('browser-password-123');
  await page.locator('#accountSubmit').click();
  await page.locator('#accountDialog').waitFor({ state: 'hidden' });
  await page.waitForFunction(() => !document.querySelector('#saveBtn').disabled);
}
(async () => {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'sky-features-'));
  const database = createDatabase({ url: pathToFileURL(path.join(output, 'features.db')).href });
  const { server } = createDevServer({ database });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const fixture = new Midi(); fixture.header.setTempo(100); fixture.name = 'Giai điệu MIDI';
  fixture.addTrack().addNote({ midi: 60, ticks: 0, durationTicks: 240 }).addNote({ midi: 64, ticks: 0, durationTicks: 240 }).addNote({ midi: 62, ticks: 240, durationTicks: 240 }).addNote({ midi: 62, ticks: fixture.header.ppq * 683, durationTicks: 240 });
  let browser;
  try {
    browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) });
    for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
      const mobile = viewport.width < 1000;
      const context = await browser.newContext({ viewport, hasTouch: mobile, isMobile: mobile });
      const page = await context.newPage(); const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(origin); await page.waitForFunction(() => !document.querySelector('#saveBtn').disabled);
      const theme = viewport.width === 390 ? 'light' : 'dark';
      if (await page.locator('html').getAttribute('data-theme') !== theme) await page.locator('#themeBtn').click();
      await page.locator('#liveMode').selectOption('layered');
      assert.equal(await page.locator('#inst').isDisabled(), true); assert.equal(await page.locator('#labelMode').isDisabled(), false);
      assert.ok(await page.locator('#inst').evaluate(node => node.closest('.field').classList.contains('field-disabled')));
      assert.equal(await page.locator('.live-check').first().isVisible(), true);
      const layout = await page.locator('.trk').first().evaluate(row => {
        const rect = selector => row.querySelector(selector).getBoundingClientRect();
        return {
          tuningAligned: rect('.trk-tuning select').top === rect('.octave').top && rect('.trk-tuning select').width > 75,
          mixAligned: Math.abs(rect('.volume').y + rect('.volume').height / 2 -
            (rect('.trk-mix .btn').y + rect('.trk-mix .btn').height / 2)) < 2 && rect('.volume').width > 45,
          fits: row.scrollWidth <= row.clientWidth
        };
      });
      assert.deepEqual(layout, { tuningAligned: true, mixAligned: true, fits: true });
      await page.locator('#liveMode').selectOption('active'); assert.equal(await page.locator('#inst').isDisabled(), false);
      assert.equal(await page.locator('.live-check').first().isVisible(), false);
      assert.equal(await page.locator('#activeTrackLabel').count(), 0);
      await page.locator('#padColorBtn').click();
      await page.getByRole('radio', { name: 'Xanh bạc hà' }).check();
      await page.locator('#closePadColorBtn').click();
      await page.reload();
      assert.equal(await page.locator('#playSurface').getAttribute('data-pad-color'), 'mint');
      const pad = page.locator('.pad[data-i="0"]');
      assert.equal(await pad.evaluate(el => getComputedStyle(el).backgroundColor),
        theme === 'dark' ? 'rgb(38, 83, 70)' : 'rgb(198, 239, 223)');
      if (viewport.width === 390) {
        const appearance = () => pad.evaluate(el => ({
          key: getComputedStyle(el).backgroundColor, background: getComputedStyle(document.body).backgroundImage
        }));
        const mint = await appearance();
        await page.locator('#padColorBtn').click();
        await page.locator('#customPadColor').fill('#ec8660');
        await page.locator('#customBackgroundColor').fill('#6596d9');
        await page.locator('#closePadColorBtn').click();
        await page.reload();
        const custom = await appearance();
        assert.notEqual(custom.key, mint.key);
        assert.notEqual(custom.background, mint.background);
        assert.match(custom.background, /radial-gradient/);
        await page.locator('#themeBtn').click();
        const dark = await appearance();
        assert.notEqual(dark.key, custom.key);
        assert.notEqual(dark.background, custom.background);
        await page.locator('#themeBtn').click();
        await page.locator('#padColorBtn').click();
        assert.equal(await page.locator('#customPadColor').inputValue(), '#ec8660');
        assert.equal(await page.locator('#customBackgroundColor').inputValue(), '#6596d9');
        await page.locator('#resetPaletteBtn').click();
        await page.locator('#closePadColorBtn').click();
        assert.deepEqual(await appearance(), mint);
      }
      const press = await pad.evaluate(el => {
        el.click();
        return getComputedStyle(el).backgroundColor;
      });
      assert.equal(press, 'rgb(244, 184, 91)');
      await page.getByRole('tab', { name: 'Bản nhạc & AI', exact: true }).click();
      await page.locator('#sheet').fill('# bpm 60\n' + '- '.repeat(29) + 'Q - W');
      await page.locator('#applyBtn').click();
      await page.locator('.hd[data-c="29"]').click();
      await page.locator('#loop').uncheck();
      const rollRun = await page.evaluate(() => {
        const wrap = document.querySelector('#rollWrap'), play = document.querySelector('#playBtn');
        const first = document.querySelector('.cell.on[data-c="29"]'), last = document.querySelector('.cell.on[data-c="31"]');
        const label = document.querySelector('.rl[data-i="1"]');
        const x = label.getBoundingClientRect().left - wrap.getBoundingClientRect().left;
        const colors = [first, last].map(cell => getComputedStyle(cell, '::after').backgroundColor);
        const positions = new Set();
        let labelTravel = 0;
        play.click();
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Last note did not reach the left column')), 5000);
          function sample() {
            positions.add(wrap.scrollLeft);
            labelTravel = Math.max(labelTravel, Math.abs(label.getBoundingClientRect().left - wrap.getBoundingClientRect().left - x));
            if (!label.classList.contains('active-hit')) return requestAnimationFrame(sample);
            clearTimeout(timeout);
            const gap = last.getBoundingClientRect().left + 4 - label.getBoundingClientRect().right;
            play.click();
            resolve({ positions: positions.size, labelTravel, gap, colors });
          }
          requestAnimationFrame(sample);
        });
      });
      assert.ok(rollRun.positions > 8, JSON.stringify(rollRun));
      assert.ok(rollRun.labelTravel <= 1, JSON.stringify(rollRun));
      assert.ok(Math.abs(rollRun.gap) <= 1, JSON.stringify(rollRun));
      const purple = theme === 'dark' ? 'rgb(196, 172, 255)' : 'rgb(112, 86, 200)';
      assert.deepEqual(rollRun.colors, [purple, purple]);
      await page.locator('#loop').check();
      await page.getByRole('tab', { name: 'Bản nhạc & AI', exact: true }).click();
      await page.locator('.midi-panel > summary').click();
      await page.locator('#midiFile').setInputFiles({ name: 'demo.mid', mimeType: 'audio/midi', buffer: Buffer.from(fixture.toArray()) });
      await page.locator('#midiConvert').waitFor({ state: 'visible' });
      await page.waitForFunction(() => !document.querySelector('#midiConvert').disabled);
      assert.equal(await page.locator('#midiApply').isDisabled(), false);
      assert.match(await page.locator('#midiOutput').inputValue(), /T\+S A/);
      assert.match(await page.locator('#midiStatus').innerText(), /1367 bước/);
      assert.equal(await page.locator('#midiRange').inputValue(), 'all');
      assert.equal(await page.locator('#midiExcerpt').isVisible(), false);
      assert.equal(await page.locator('.inst-trk').inputValue(), 'piano');
      await page.locator('.nm-trk').fill('MIDI test');
      assert.equal(await page.locator('#midiApply').isDisabled(), true);
      await page.locator('.inst-trk').selectOption('guitar');
      await page.locator('.oct-trk').selectOption('-1');
      assert.match(await page.locator('#midiOutput').inputValue(), /# track MIDI test \| guitar \| oct -1 \| vol 90/);
      await page.locator('#midiRange').selectOption('excerpt');
      assert.equal(await page.locator('#midiExcerpt').isVisible(), true);
      assert.match(await page.locator('#midiStatus').innerText(), /ngoài đoạn đã chọn: 1/);
      await page.locator('#midiRange').selectOption('all');
      assert.match(await page.locator('#midiStatus').innerText(), /1367 bước/);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: path.join(output, `midi-${viewport.width}.png`), fullPage: true });
      const oldTitle = await page.locator('#songTitle').innerText();
      await page.locator('#midiPreview').click();
      assert.equal(await page.locator('#songTitle').innerText(), oldTitle);
      await page.locator('#midiPreview').click();
      await page.locator('#midiApply').click(); assert.match(await page.locator('#sheet').inputValue(), /T\+S A/);
      assert.equal(await page.locator('#songTitle').innerText(), oldTitle);
      await page.locator('#applyBtn').click();
      await page.locator('#guideBtn').click();
      assert.equal(await page.locator('.pad.guide-next').count(), 2);
      const light = await page.locator('.pad.guide-next').first().evaluate(node => ({ shadow: getComputedStyle(node).boxShadow, halo: getComputedStyle(node, '::after').display }));
      assert.notEqual(light.shadow, 'none');
      assert.equal(light.halo === 'none', mobile);
      // Some mobile browsers only support the in-page fullscreen fallback.
      if (viewport.width === 390) await page.evaluate(() => {
        for (const name of ['requestFullscreen', 'webkitRequestFullscreen']) {
          Object.defineProperty(document.documentElement, name, { value: undefined });
        }
      });
      await page.locator('#expandPadsBtn').click();
      await page.waitForFunction(() => document.querySelector('#padDialog').open);
      await page.waitForTimeout(250);
      const assertLayout = async () => {
        const metrics = await page.evaluate(() => {
          const modal = document.querySelector('#padDialog'), dialog = modal.getBoundingClientRect();
          const keys = Array.from(document.querySelectorAll('.pad'));
          const pads = keys.map(el => el.getBoundingClientRect());
          const rows = new Map();
          for (const key of keys) rows.set(key.offsetTop, (rows.get(key.offsetTop) || 0) + 1);
          const fit = pads.every(rect => rect.left >= dialog.left && rect.right <= dialog.right && rect.top >= dialog.top && rect.bottom <= dialog.bottom);
          return { width: dialog.width, height: dialog.height, viewport: [innerWidth, innerHeight], pad: [pads[0].width, pads[0].height], rows: [...rows.values()], fit, full: !!document.fullscreenElement };
        });
        assert.ok(Math.abs(metrics.width - metrics.viewport[0]) < 2, JSON.stringify(metrics));
        assert.ok(Math.abs(metrics.height - metrics.viewport[1]) < 2, JSON.stringify(metrics));
        assert.deepEqual(metrics.rows, [5, 5, 5], JSON.stringify(metrics));
        assert.ok(metrics.fit, JSON.stringify(metrics));
        assert.ok(metrics.pad.every(size => size >= 44), JSON.stringify(metrics));
        return metrics;
      };
      const metrics = await assertLayout();
      await page.locator('#expandedColorBtn').click();
      assert.equal(await page.getByRole('radio', { name: 'Xanh bạc hà' }).isChecked(), true);
      await page.getByRole('radio', { name: 'Xanh trời' }).check();
      await page.locator('#closePadColorBtn').click();
      assert.equal(await page.locator('#expandedPlay #playSurface').getAttribute('data-pad-color'), 'sky');
      assert.equal(await page.locator('.pad.guide-next').count(), 2);
      await page.screenshot({ path: path.join(output, `expanded-${viewport.width}.png`) });
      if (viewport.width === 390) {
        assert.equal(metrics.full, false);
        await page.setViewportSize({ width: 568, height: 320 });
        await assertLayout();
        await page.locator('.pad.guide-next').first().tap();
        assert.equal(await page.locator('.pad.guide-done').count(), 1);
        await page.setViewportSize(viewport);
        await assertLayout();
      }
      await page.locator('#closePadDialog').click(); await page.waitForFunction(() => !document.fullscreenElement);
      assert.equal(await page.locator('#guideBtn').getAttribute('aria-pressed'), 'true');
      await page.locator('#guideBtn').click();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      console.log(`PASS MIDI + layered controls + practice halo + fullscreen ${viewport.width}: pad ${Math.round(metrics.pad[0])}px, native fullscreen=${metrics.full}`);
      await context.close(); assert.deepEqual(errors, []);
    }
    const importContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const importer = await importContext.newPage();
    await importer.goto(origin); await importer.waitForFunction(() => !document.querySelector('#saveBtn').disabled);
    await importer.getByRole('tab', { name: 'Bản nhạc & AI', exact: true }).click(); await importer.locator('.midi-panel > summary').click();
    const metadata = new Midi();
    const lead = metadata.addTrack(); lead.name = '<img src=x onerror=1>'; lead.addNote({ midi: 60, ticks: 0, durationTicks: 240 });
    const drums = metadata.addTrack(); drums.channel = 9; drums.addNote({ midi: 36, ticks: 0, durationTicks: 240 });
    await importer.locator('#midiFile').setInputFiles({ name: 'metadata.midi', mimeType: 'audio/midi', buffer: Buffer.from(metadata.toArray()) });
    await importer.waitForFunction(() => !document.querySelector('#midiApply').disabled);
    assert.equal(await importer.locator('#midiTracks img').count(), 0);
    assert.equal(await importer.locator('.nm-trk').first().inputValue(), '<img src=x onerror=1>');
    assert.equal(await importer.locator('.use-trk').nth(1).isChecked(), false);
    await importer.locator('.use-trk').first().uncheck();
    assert.equal(await importer.locator('#midiApply').isDisabled(), true);
    assert.equal(await importer.locator('#midiOutput').inputValue(), '');
    await importer.locator('.use-trk').first().check();
    assert.equal(await importer.locator('#midiApply').isDisabled(), false);
    await importer.locator('#midiFile').setInputFiles({ name: 'broken.mid', mimeType: 'audio/midi', buffer: Buffer.from('not MIDI') });
    await importer.waitForFunction(() => !document.querySelector('#midiStatus').textContent.includes('Đang đọc'));
    assert.equal(await importer.locator('#midiApply').isDisabled(), true);
    assert.equal(await importer.locator('#midiConvert').isDisabled(), true);
    assert.equal(await importer.locator('#midiOutput').inputValue(), '');
    await importer.locator('#midiFile').setInputFiles({ name: 'recovered.midi', mimeType: 'audio/midi', buffer: Buffer.from(metadata.toArray()) });
    await importer.waitForFunction(() => !document.querySelector('#midiApply').disabled);
    console.log('PASS MIDI metadata renders safely, percussion defaults off, invalid selections/files clear results, re-upload recovers');
    await importContext.close();
    const aliceContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } }); const alice = await aliceContext.newPage();
    const bobContext = await browser.newContext({ viewport: { width: 390, height: 844 } }); const bob = await bobContext.newPage();
    const errors = []; for (const page of [alice, bob]) page.on('pageerror', error => errors.push(error.message));
    await alice.goto(origin); await alice.waitForFunction(() => !document.querySelector('#saveBtn').disabled); await register(alice, 'community_alice');
    await alice.getByRole('tab', { name: 'Bản nhạc & AI' }).click();
    await alice.locator('#titleIn').fill('Bài cộng đồng thử'); await alice.locator('#saveBtn').click();
    await alice.waitForFunction(() => !document.querySelector('#saveBtn').disabled);
    await alice.locator('#publishSongBtn').click();
    await alice.waitForFunction(() => !document.querySelector('#publishSubmit').disabled);
    await alice.locator('#publishDescription').fill('<img src=x onerror=alert(1)> Giai điệu để cùng tập.');
    await alice.locator('#publishComposer').fill('Tác giả thử'); await alice.locator('#publishConsent').check();
    await alice.locator('#publishSubmit').click(); await alice.locator('#publishDialog').waitFor({ state: 'hidden' });
    await alice.locator('.community-card').filter({ hasText: 'Bài cộng đồng thử' }).waitFor();
    await bob.goto(origin); await bob.waitForFunction(() => !document.querySelector('#saveBtn').disabled); await register(bob, 'community_bob');
    await bob.getByRole('tab', { name: 'Cộng đồng', exact: true }).click();
    const card = bob.locator('.community-card').filter({ hasText: 'Bài cộng đồng thử' }); await card.waitFor();
    assert.equal(await card.locator('img').count(), 0);
    await card.getByRole('button', { name: 'Nghe thử (30 giây)', exact: true }).click();
    await card.getByRole('button', { name: 'Dừng nghe thử', exact: true }).waitFor();
    await card.getByRole('button', { name: 'Dừng nghe thử', exact: true }).click();
    await card.getByRole('button', { name: /Thích 0/ }).click(); await card.getByRole('button', { name: /Đã thích 1/ }).waitFor();
    await card.getByRole('button', { name: 'Theo dõi @community_alice', exact: true }).click();
    await card.getByRole('button', { name: 'Đang theo dõi @community_alice', exact: true }).waitFor();
    await bob.locator('#communityFilter').selectOption('following'); await card.waitFor();
    await card.getByRole('button', { name: 'Thêm vào thư viện', exact: true }).click(); await card.getByRole('button', { name: 'Đã có trong thư viện', exact: true }).waitFor();
    await card.getByRole('button', { name: /Chi tiết & bình luận/ }).click();
    await bob.locator('#communityComment').fill('Mình đã lưu bài, cảm ơn!'); await bob.locator('#communitySendComment').click();
    await bob.locator('#communityComments').getByText('Mình đã lưu bài, cảm ơn!', { exact: true }).waitFor();
    await bob.screenshot({ path: path.join(output, 'community-mobile.png'), fullPage: true });
    await bob.getByRole('tab', { name: 'Thư viện', exact: true }).click();
    await bob.locator('#songs .song').filter({ hasText: 'Bài cộng đồng thử' }).waitFor();
    assert.match(await bob.locator('#songs').innerText(), /từ @community_alice/);
    await alice.locator('#communityRefresh').click();
    const originalCard = alice.locator('.community-card').filter({ hasText: 'Bài cộng đồng thử' }); await originalCard.waitFor();
    await originalCard.getByRole('button', { name: /Chi tiết & bình luận/ }).click();
    await alice.locator('#communityComments').getByText('Mình đã lưu bài, cảm ơn!', { exact: true }).waitFor();
    await alice.locator('#communityComments').getByRole('button', { name: 'Xóa bình luận', exact: true }).click();
    await alice.waitForFunction(() => !document.querySelector('#communityComments').textContent.includes('Mình đã lưu bài'));
    await originalCard.getByRole('button', { name: 'Gỡ công khai', exact: true }).click();
    await alice.waitForFunction(() => document.querySelectorAll('.community-card').length === 0);
    await bob.reload(); await bob.waitForFunction(() => !document.querySelector('#logoutBtn').hidden);
    await bob.getByRole('tab', { name: 'Thư viện', exact: true }).click();
    await bob.locator('#songs .song').filter({ hasText: 'Bài cộng đồng thử' }).waitFor();
    await alice.screenshot({ path: path.join(output, 'community-desktop.png'), fullPage: true });
    assert.deepEqual(errors, []);
    console.log('PASS Real browser community: publish, preview, like, follow/filter, copy with credit, comment, author moderation, unpublish, copy retained');
    await aliceContext.close(); await bobContext.close();
    console.log('Screenshots: ' + output);
  } finally { if (browser) await browser.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); database.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
