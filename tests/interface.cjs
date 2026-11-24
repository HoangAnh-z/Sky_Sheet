const assert = require('node:assert/strict');
const { makeApp, until } = require('./smoke.cjs');
const checks = [];
function check(name, fn) { fn(); checks.push(name); }
(async () => {
  const app = makeApp(); const { $, w, change } = app;
  try {
    change('liveMode', 'layered');
    check('Layered mode shows per-track play controls and disables the main instrument', () => {
      assert.equal($('inst').disabled, true); assert.equal($('labelMode').disabled, false);
      assert.equal($('activeTrackLabel'), null); assert.equal($('layeredHint').hidden, false);
      assert.equal(w.document.querySelector('.live-check').hidden, false);
      assert.equal(w.document.querySelector('.trk select').disabled, false);
    });
    $('recBtn').click(); $('recBtn').click();
    assert.equal($('inst').disabled, true);
    w.document.querySelector('.live-check input').click();
    change('liveMode', 'active');
    check('Recording locks and layered mode restore correctly when recording ends or the mode changes', () => assert.equal($('inst').disabled, false));
    check('Single-layer mode hides play checkboxes and preserves their settings when switching back', () => {
      assert.equal(w.document.querySelector('.live-check').hidden, true);
      change('liveMode', 'layered');
      assert.equal(w.document.querySelector('.live-check input').checked, false);
      change('liveMode', 'active');
    });
    $('sheet').value = '# title track demo bpm 150\n# bpm 100\nQ W E'; $('applyBtn').click();
    check('Explicit title headers cannot be mistaken for track or BPM directives', () => {
      assert.equal(w.__song().tracks.length, 1); assert.equal(w.__song().title, 'track demo bpm 150'); assert.equal(w.__song().bpm, 100);
    });
    w.document.documentElement.requestFullscreen = () => Promise.reject(new Error('NotAllowedError'));
    $('expandPadsBtn').click();
    await until(() => $('fullscreenStatus').textContent.includes('Chưa vào toàn màn hình'));
    check('Rejected native fullscreen requests preserve the usable expanded keyboard', () => {
      assert.equal($('padDialog').open, true); assert.ok($('padDialog').contains($('pads'))); assert.equal(w.document.querySelectorAll('.pad').length, 15);
    });
    $('closePadDialog').click();
    let complete, full = null, exits = 0;
    Object.defineProperty(w.document, 'fullscreenElement', { configurable: true, get: () => full });
    w.document.documentElement.requestFullscreen = () => new Promise(resolve => { complete = resolve; });
    w.document.exitFullscreen = async () => { full = null; exits++; };
    $('expandPadsBtn').click(); $('closePadDialog').click();
    full = w.document.documentElement; complete();
    await until(() => exits === 1);
    check('A late fullscreen promise after shrinking exits fullscreen and keeps nodes restored', () => {
      assert.equal(full, null); assert.equal($('padDialog').open, false); assert.ok($('playSurface').closest('.instrument')); assert.ok(!w.document.documentElement.classList.contains('pads-expanded'));
    });

    $('padColorBtn').click();
    check('Pad palette applies colors and stores the selected value', () => {
      assert.equal($('padColorDialog').open, true);
      assert.equal($('playSurface').dataset.padColor, 'lavender');
      w.document.querySelector('input[name="padColor"][value="mint"]').click();
      assert.equal($('playSurface').dataset.padColor, 'mint');
      assert.equal(w.localStorage.getItem('phongnhacsky.pad_color'), 'mint');
      $('closePadColorBtn').click();
      assert.equal($('padColorDialog').open, false);
    });

    check('Compose view places sequencer on the left and arrangement on the right', () => {
      const composeView = $('view-compose');
      const children = Array.from(composeView.children).filter(el => el.tagName === 'SECTION');
      assert.equal(children.length, 2);
      assert.ok(children[0].classList.contains('sequencer'));
      assert.ok(children[1].classList.contains('arrangement'));
    });

    check('Left roll labels show both keyboard key and musical note name', () => {
      const rlEls = Array.from(w.document.querySelectorAll('.rl'));
      assert.equal(rlEls.length, 15);
      const first = rlEls[0]; // idx 14 (C6 / B)
      assert.ok(first.querySelector('.rl-key'));
      assert.ok(first.querySelector('.rl-note'));
    });

    check('Pad palette applies to the same instrument in expanded mode and restores focus', () => {
      w.document.documentElement.requestFullscreen = () => Promise.resolve();
      $('expandPadsBtn').click();
      assert.ok($('expandedPlay').contains($('playSurface')));
      assert.equal($('playSurface').dataset.padColor, 'mint');
      $('expandedColorBtn').click();
      assert.equal($('padColorDialog').open, true);
      w.document.querySelector('input[name="padColor"][value="lavender"]').click();
      $('closePadColorBtn').click();
      assert.equal(w.document.activeElement, $('expandedColorBtn'));
      $('closePadDialog').click();
      assert.equal($('playSurface').dataset.padColor, 'lavender');
    });

    check('Playback advances between scheduled notes and lights only arriving notes of the visible track', () => {
      $('sheet').value = '# title test receptor\n# bpm 120\n# track Lead | piano\nQ - W\n# track Backing | harp\nE T';
      $('applyBtn').click();
      let nextFrame;
      w.requestAnimationFrame = fn => { nextFrame = fn; return 1; };
      const advance = time => { w.__ctx.currentTime = time; w.__interval?.(); nextFrame(); };
      const lit = () => Array.from(w.document.querySelectorAll('.rl.active-hit'), el => +el.dataset.i);
      const width = Number.parseInt($('roll').style.getPropertyValue('--step-w'), 10);
      assert.equal(width, 64);
      $('playBtn').click();
      advance(0.04);
      assert.deepEqual(lit(), []);
      advance(0.06);
      assert.equal($('rollWrap').scrollLeft, 4);
      assert.deepEqual(lit(), [0]);
      assert.equal($('rollStep').value, '1');
      advance(0.185);
      assert.equal($('rollWrap').scrollLeft, 4 + width / 2);
      assert.deepEqual(lit(), [0]);
      advance(0.31);
      assert.equal($('rollWrap').scrollLeft, 4 + width);
      assert.deepEqual(lit(), []);
      assert.equal($('rollStep').value, '2');
      advance(0.55);
      assert.ok($('rollWrap').scrollLeft < 4 + 2 * width);
      assert.deepEqual(lit(), []);
      advance(0.56);
      assert.equal($('rollWrap').scrollLeft, 4 + 2 * width);
      assert.deepEqual(lit(), [1]);
      assert.equal($('rollStep').value, '3');
      $('playBtn').click();
      assert.deepEqual(lit(), []);
      assert.equal($('playBtn').textContent, 'Phát tiếp');
      assert.ok(w.document.querySelector('.hd.paused-step[data-c="2"]'));
      $('playBtn').click();
      advance(0.63);
      assert.deepEqual(lit(), [1]);
      assert.equal($('rollStep').value, '3');
      $('playBtn').click();
      $('prevRollStep').click();
      assert.equal($('rollStep').value, '2');
      $('rollJump').requestSubmit();
      assert.equal($('playBtn').textContent, 'Phát');
      assert.ok(w.document.querySelector('.hd.start[data-c="1"]'));
    });

    check('Combined layers show overlapping colors and keep other layers read-only', () => {
      $('sheet').value = '# track Lead | piano\nQ - W\n# track Backing | harp\nQ T';
      $('applyBtn').click();
      const cell = (step, note) => w.document.querySelector('.cell[data-c="' + step + '"][data-r="' + note + '"]');
      assert.equal(cell(1, 4).classList.contains('layer-note'), false);
      $('rollAllTracks').click();
      assert.match(cell(0, 0).style.getPropertyValue('--note-fill'), /linear-gradient.*#32b8cf/);
      assert.equal(cell(1, 4).classList.contains('on'), false);
      assert.equal(cell(1, 4).classList.contains('layer-note'), true);
      cell(1, 4).click();
      assert.deepEqual([...w.__song().tracks[0].steps[1]], [4]);
      assert.deepEqual([...w.__song().tracks[1].steps[1]], [4]);
      $('undoRollBtn').click();
      $('rollAllTracks').click();
      assert.equal(cell(1, 4).classList.contains('layer-note'), false);
    });

    check('Playback schedules through hidden tabs, then seeks without starting over', () => {
      $('sheet').value = '# bpm 120\nQ Q W E R T A S D F G Z X C V B';
      $('applyBtn').click();
      $('loop').checked = false;
      w.__ctx.currentTime = 10;
      let nextFrame, hidden = false;
      const timers = new Map();
      let timerId = 0;
      w.setInterval = fn => { timers.set(++timerId, fn); return timerId; };
      w.clearInterval = id => timers.delete(id);
      const tick = () => [...timers.values()].forEach(fn => fn());
      w.requestAnimationFrame = fn => { nextFrame = fn; return 1; };
      Object.defineProperty(w.document, 'hidden', { configurable: true, get: () => hidden });
      const visibility = value => { hidden = value; w.document.dispatchEvent(new w.Event('visibilitychange')); };
      $('playBtn').click();
      $('tab-sound').click();
      visibility(true);
      assert.equal($('playBtn').getAttribute('aria-pressed'), 'true');
      w.__ctx.currentTime = 11.1;
      tick();
      visibility(false);
      $('tab-compose').click();
      nextFrame();
      assert.ok(w.document.querySelector('.hd.playing-step[data-c="4"]'));
      $('rollStep').value = 10;
      $('rollJump').requestSubmit();
      assert.ok(w.document.querySelector('.hd.start[data-c="9"]'));
      w.__ctx.currentTime = 11.16;
      nextFrame();
      assert.ok(w.document.querySelector('.hd.playing-step[data-c="9"]'));
      visibility(true);
      w.__ctx.currentTime = 14;
      tick();
      assert.equal($('playBtn').getAttribute('aria-pressed'), 'false');
      visibility(false);
      delete w.document.hidden;
    });

    assert.deepEqual(app.errors, []);
    await new Promise(resolve => setTimeout(resolve, 20));
  } finally { app.dom.window.close(); }
  console.log(checks.map((name, i) => `${i + 1}. PASS ${name}`).join('\n'));
  console.log(`\n${checks.length} interface checks passed.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
