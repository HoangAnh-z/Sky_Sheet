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

    $('padBgBtn').click();
    check('Pad background dialog opens and supports custom background image and overlay/blur controls', () => {
      assert.equal($('padBgDialog').open, true);
      const customBtn = w.document.querySelector('.pad-bg-preset-btn[data-preset="custom"]');
      assert.ok(customBtn);
      customBtn.click();
      assert.equal(w.localStorage.getItem('phongnhacsky.pad_bg_preset'), 'custom');
      assert.equal($('padBgUploadField').hidden, false);

      $('padBgOverlayRange').value = '40';
      $('padBgOverlayRange').dispatchEvent(new w.Event('input'));
      assert.equal($('playSurface').style.getPropertyValue('--pad-bg-overlay-opacity'), '0.40');
      assert.equal($('padBgOverlayVal').textContent, '40%');

      $('padBgBlurRange').value = '6';
      $('padBgBlurRange').dispatchEvent(new w.Event('input'));
      assert.equal($('playSurface').style.getPropertyValue('--pad-bg-blur'), '6px');
      assert.equal($('padBgBlurVal').textContent, '6px');

      $('closePadBgBtn').click();
      assert.equal($('padBgDialog').open, false);
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

    check('Pad background settings persist across normal and expanded playing modes', () => {
      w.document.documentElement.requestFullscreen = () => Promise.resolve();
      $('expandPadsBtn').click();
      assert.ok($('expandedPlay').contains($('playSurface')));
      assert.equal($('playSurface').style.getPropertyValue('--pad-bg-blur'), '6px');
      $('expandedBgBtn').click();
      assert.equal($('padBgDialog').open, true);
      $('resetPadBgBtn').click();
      assert.equal($('playSurface').style.getPropertyValue('--pad-bg-image'), 'none');
      assert.equal(w.localStorage.getItem('phongnhacsky.pad_bg_preset'), 'default');
      $('closePadBgBtn').click();
      $('closePadDialog').click();
    });

    check('Playback advances between scheduled notes and lights only arriving notes of the visible track', () => {
      $('sheet').value = '# title test receptor\n# bpm 120\n# track Lead | piano\nQ - W\n# track Backing | harp\nE T';
      $('applyBtn').click();
      let nextFrame;
      w.requestAnimationFrame = fn => { nextFrame = fn; return 1; };
      const advance = time => { w.__ctx.currentTime = time; w.__interval?.(); nextFrame(); };
      const lit = () => Array.from(w.document.querySelectorAll('.rl.active-hit'), el => +el.dataset.i);
      $('playBtn').click();
      advance(0.04);
      assert.deepEqual(lit(), []);
      advance(0.06);
      assert.equal($('rollWrap').scrollLeft, 4);
      assert.deepEqual(lit(), [0]);
      advance(0.185);
      assert.equal($('rollWrap').scrollLeft, 19);
      assert.deepEqual(lit(), [0]);
      advance(0.31);
      assert.equal($('rollWrap').scrollLeft, 34);
      assert.deepEqual(lit(), []);
      advance(0.55);
      assert.ok($('rollWrap').scrollLeft < 64);
      assert.deepEqual(lit(), []);
      advance(0.56);
      assert.equal($('rollWrap').scrollLeft, 64);
      assert.deepEqual(lit(), [1]);
      $('playBtn').click();
      assert.deepEqual(lit(), []);
    });

    assert.deepEqual(app.errors, []);
    await new Promise(resolve => setTimeout(resolve, 20));
  } finally { app.dom.window.close(); }
  console.log(checks.map((name, i) => `${i + 1}. PASS ${name}`).join('\n'));
  console.log(`\n${checks.length} interface checks passed.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
