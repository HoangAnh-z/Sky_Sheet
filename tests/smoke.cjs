const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { IDBFactory } = require('fake-indexeddb');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const idb = new IDBFactory();
const outputs = [];
function check(name, fn) { fn(); outputs.push(name); }
function event(w, el, name) { el.dispatchEvent(new w.Event(name, { bubbles: true })); }
async function until(fn) {
  for (let n = 0; n < 100; n++) { if (fn()) return; await new Promise(r => setTimeout(r, 5)); }
  throw new Error('Timed out waiting for state');
}
function makeApp(database = idb) {
  const dom = new JSDOM(html, { url: 'http://localhost:5173/', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  const errors = [];
  w.addEventListener('error', e => errors.push(e.error));
  w.matchMedia = () => ({ matches: true });
  // jsdom does not implement the browser's modal lifecycle or rendering.
  w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  w.HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new w.Event('close')); };
  w.indexedDB = database;
  w.fetch = async () => { throw new Error('No external requests expected'); };
  w.setInterval = fn => { w.__interval = fn; return 1; };
  w.clearInterval = () => { w.__interval = null; };
  w.requestAnimationFrame = () => 1; w.cancelAnimationFrame = () => {};
  const sources = [];
  function param() { return { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {}, cancelScheduledValues() {}, setTargetAtTime() {} }; }
  function node() { return { gain: param(), frequency: param(), detune: param(), playbackRate: param(), Q: param(), connect() {}, disconnect() {}, start(t) { this.startTime = t; sources.push(this); }, stop(t) { this.stopTime = t; } }; }
  class AC {
    constructor() { this.currentTime = 0; this.sampleRate = 44100; this.state = 'running'; this.destination = {}; w.__ctx = this; }
    createGain() { return node(); }
    createOscillator() { return Object.assign(node(), { kind: 'oscillator' }); }
    createBufferSource() { return Object.assign(node(), { kind: 'sample' }); }
    createBiquadFilter() { return node(); }
    createWaveShaper() { return node(); }
    createDynamicsCompressor() { return node(); }
    createBuffer(ch, len) { return { getChannelData: () => new Float32Array(len) }; }
    async decodeAudioData(data) { if (data.byteLength === 0) throw new Error('Invalid audio'); return { duration: .5 }; }
    async resume() {}
  }
  w.AudioContext = AC;
  const calls = [];
  for (const script of w.document.querySelectorAll('script[src]')) {
    const file = script.getAttribute('src');
    assert.ok(fs.existsSync(path.join(root, file)), file);
    w.eval(fs.readFileSync(path.join(root, file), 'utf8'));
    if (file.endsWith('/audio.js')) {
      const Engine = w.SkyAudio;
      w.SkyAudio = function (getSong, getActive) {
        const engine = new Engine(getSong, getActive);
        const voice = engine.voice;
        engine.voice = (...args) => { calls.push({ index: args[0], track: args[2] || getActive(), time: args[1] }); return voice(...args); };
        w.__engine = engine; w.__song = getSong;
        return engine;
      };
    }
  }
  const $ = id => w.document.getElementById(id);
  const key = key => w.dispatchEvent(new w.KeyboardEvent('keydown', { key, bubbles: true }));
  const change = (id, value) => { $(id).value = value; event(w, $(id), 'change'); };
  return { dom, w, $, key, change, calls, sources, errors };
}
(async () => {
  const a = makeApp();
  const { $, w, calls, key, change } = a;
  check('Startup: 15 pads, 6 library entries, one selected track, no runtime errors', () => {
    assert.equal(w.document.querySelectorAll('.pad').length, 15);
    assert.equal(w.document.querySelectorAll('#songs li').length, 6);
    assert.equal(w.__song().tracks.length, 1); assert.equal(a.errors.length, 0);
    assert.ok(!Array.from(w.document.querySelectorAll('[id]')).some((el, i, list) => list.findIndex(e => e.id === el.id) !== i));
  });
  check('Themes toggle and persist; tabs support arrows and hide inactive content', () => {
    assert.equal(w.document.documentElement.dataset.theme, 'dark'); $('themeBtn').click();
    assert.equal(w.localStorage.getItem('phongnhacsky.theme'), 'light');
    $('tab-library').click(); assert.equal($('view-compose').hidden, true); assert.equal($('view-library').hidden, false);
    $('tab-library').dispatchEvent(new w.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    assert.equal($('tab-sheet').getAttribute('aria-selected'), 'true');
  });
  check('Keyboard activation is explicit; toggling off keeps the on-screen pads usable', () => {
    calls.length = 0; key('q'); assert.equal(calls.length, 0);
    assert.equal($('keyboardBtn').getAttribute('aria-pressed'), 'false');
    w.document.querySelector('.pad').click(); assert.equal(calls.length, 1);
    $('keyboardBtn').click(); assert.equal($('keyboardBtn').getAttribute('aria-pressed'), 'true');
    assert.ok(w.__ctx); assert.equal(w.document.activeElement, $('keyboardBtn'));
    calls.length = 0; key('q'); assert.equal(calls.length, 1);
    $('keyboardBtn').click(); calls.length = 0; key('q'); assert.equal(calls.length, 0);
    w.document.querySelector('.pad').click(); assert.equal(calls.length, 1);
    $('keyboardBtn').click();
  });
  check('Physical note keys work with Vietnamese input and non-text controls', () => {
    calls.length = 0;
    w.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'ư', code: 'KeyW', bubbles: true }));
    assert.equal(calls.length, 1); assert.equal(calls[0].index, 1);
    $('loop').dispatchEvent(new w.KeyboardEvent('keydown', { key: 'q', code: 'KeyQ', bubbles: true }));
    $('bpmRange').dispatchEvent(new w.KeyboardEvent('keydown', { key: 'e', code: 'KeyE', bubbles: true }));
    assert.equal(calls.length, 3);
    w.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'q', code: 'KeyQ', ctrlKey: true }));
    w.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'q', code: 'KeyQ', repeat: true }));
    assert.equal(calls.length, 3);
  });
  check('Editing pauses note keys; pad focus and changed selectors restore playing', () => {
    $('titleIn').focus(); assert.match($('keyboardStatus').textContent, /Tạm dừng/);
    calls.length = 0; $('titleIn').dispatchEvent(new w.KeyboardEvent('keydown', { key: 'q', code: 'KeyQ', bubbles: true }));
    assert.equal(calls.length, 0);
    const pad = w.document.querySelector('.pad');
    pad.dispatchEvent(new w.MouseEvent('pointerdown', { button: 0, bubbles: true }));
    assert.equal(w.document.activeElement, pad); assert.match($('keyboardStatus').textContent, /đang bật/);
    assert.equal(calls.length, 1);
    $('inst').focus(); change('inst', 'piano'); assert.notEqual(w.document.activeElement, $('inst'));
    calls.length = 0; w.document.activeElement.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'q', code: 'KeyQ', bubbles: true }));
    assert.equal(calls.length, 1); assert.equal(calls[0].track.inst, 'piano');
    change('inst', 'harp');
  });
  check('Expanded pads reuse the actual keyboard, controls and notifications without duplicating notes', () => {
    const pads = $('pads'), surface = $('playSurface'), transport = $('playBtn').closest('.transport');
    calls.length = 0; $('expandPadsBtn').click();
    assert.equal($('padDialog').open, true); assert.equal($('expandPadsBtn').getAttribute('aria-expanded'), 'true');
    assert.ok(w.document.documentElement.classList.contains('pads-expanded'));
    assert.equal($('expandedPlay').firstElementChild, surface); assert.equal($('expandedTransport').firstElementChild, transport);
    assert.equal($('pads'), pads); assert.equal(w.document.querySelectorAll('.pad').length, 15);
    assert.ok($('padDialog').contains($('toast'))); assert.equal(w.document.activeElement, $('closePadDialog'));
    pads.firstElementChild.click(); assert.equal(calls.length, 1);
    $('closePadDialog').click(); assert.equal($('padDialog').open, false);
    assert.ok(surface.closest('.instrument')); assert.ok(!transport.closest('dialog')); assert.ok(!$('toast').closest('dialog'));
    assert.equal(w.document.activeElement, $('expandPadsBtn')); assert.equal($('expandPadsBtn').getAttribute('aria-expanded'), 'false');
  });
  check('Expanding and shrinking preserve the current practice step and playback state', () => {
    $('expandPadsBtn').click(); $('guideBtn').click(); $('pads').firstElementChild.click();
    const progress = $('guideStatus').textContent;
    assert.match(progress, /bước 2\//);
    $('closePadDialog').click(); assert.equal($('guideStatus').textContent, progress);
    assert.equal($('guideBtn').getAttribute('aria-pressed'), 'true');
    $('expandPadsBtn').click(); assert.equal($('guideStatus').textContent, progress);
    $('guideBtn').click(); $('playBtn').click(); $('closePadDialog').click();
    assert.equal($('playBtn').getAttribute('aria-pressed'), 'true'); $('playBtn').click();
  });
  check('Escape dismissal restores page scrolling, original node positions and keyboard focus', () => {
    $('expandPadsBtn').click(); $('padDialog').dispatchEvent(new w.Event('cancel', { cancelable: true }));
    assert.equal($('padDialog').open, false); assert.ok(!w.document.documentElement.classList.contains('pads-expanded'));
    assert.ok($('playSurface').closest('.instrument')); assert.equal(w.document.activeElement, $('expandPadsBtn'));
    calls.length = 0; key('q'); assert.equal(calls.length, 1);
  });
  check('Unsupported or failed modal opening keeps the regular instrument usable', () => {
    const show = $('padDialog').showModal;
    $('padDialog').showModal = undefined; $('expandPadsBtn').click();
    assert.ok($('playSurface').closest('.instrument')); assert.match($('toast').textContent, /chưa hỗ trợ/);
    $('padDialog').showModal = () => { throw new Error('Modal unavailable'); }; $('expandPadsBtn').click();
    assert.ok($('playSurface').closest('.instrument')); assert.ok(!$('playBtn').closest('dialog'));
    assert.ok(!w.document.documentElement.classList.contains('pads-expanded'));
    $('padDialog').showModal = show;
  });
  check('Three-layer demo loads; manual notes default to the active layer', () => {
    w.document.querySelectorAll('.song')[5].click(); calls.length = 0; key('q');
    assert.equal(w.__song().tracks.length, 3); assert.equal(calls.length, 1); assert.equal(calls[0].track.inst, 'dizi');
    assert.equal($('view-compose').hidden, false);
  });
  check('Layered manual playing honors live checkbox, mute and solo', () => {
    change('liveMode', 'layered'); calls.length = 0; key('q'); assert.equal(calls.length, 3);
    let live = w.document.querySelector('.live-check input'); live.checked = false; event(w, live, 'change');
    calls.length = 0; key('w'); assert.equal(calls.length, 2);
    w.document.querySelectorAll('.trk')[1].querySelectorAll('button')[0].click(); calls.length = 0; key('q'); assert.equal(calls.length, 1);
    w.document.querySelectorAll('.trk')[2].querySelectorAll('button')[1].click(); calls.length = 0; key('q'); assert.equal(calls.length, 1); assert.equal(calls[0].track.inst, 'guitar');
    w.document.querySelectorAll('.trk')[2].querySelectorAll('button')[0].click(); calls.length = 0; key('q'); assert.equal(calls.length, 0);
  });
  check('Multiple keyboard notes form a chord; editing inputs does not play notes', () => {
    change('liveMode', 'active'); calls.length = 0; key('q'); key('e'); key('t'); assert.equal(calls.length, 3);
    calls.length = 0; $('titleIn').dispatchEvent(new w.KeyboardEvent('keydown', { key: 'q', bubbles: true })); assert.equal(calls.length, 0);
  });
  // Reload clean arrangement and test scheduler calls, not just button state.
  w.document.querySelectorAll('.song')[5].click();
  check('Arrangement playback schedules all three tracks; Stop clears transport', () => {
    calls.length = 0; $('playBtn').click(); assert.equal(calls.length, 5); // 1 melody + 3-note chord + 1 bass
    assert.equal(new Set(calls.map(x => x.track)).size, 3);
    $('playBtn').click(); assert.equal($('playBtn').getAttribute('aria-pressed'), 'false'); assert.equal(w.__interval, null);
  });
  check('Overdub preserves background and schedules no duplicate notes for the recording layer', () => {
    change('liveMode', 'active'); $('recBtn').click(); assert.equal($('addTrk').disabled, true);
    const active = w.__song().tracks[0]; calls.length = 0; key('q');
    assert.equal(calls.filter(x => x.track === active).length, 1);
    assert.ok(calls.some(x => x.track !== active)); assert.equal(active.steps[0][0], 0);
    $('recBtn').click(); assert.equal($('addTrk').disabled, false); assert.equal($('transportState').textContent, 'Sẵn sàng');
  });
  check('Text sheets round-trip across tracks and chords; saving stays compatible', () => {
    $('sheet').value = '# Test phối\n# bpm 125\n# track Piano | piano | oct 0 | vol 80\nQ+E+T - W -\n# track Bass | bass | oct -1 | vol 60\nQ - T -';
    $('applyBtn').click(); assert.equal(w.__song().tracks.length, 2); assert.equal(w.__song().bpm, 125);
    assert.equal(w.__song().tracks[0].steps[0].length, 3); assert.equal($('songTitle').textContent, 'Test phối');
    $('saveBtn').click(); const stored = JSON.parse(w.localStorage.getItem('phongnhacsky.songs'));
    assert.equal(stored[0].title, 'Test phối'); assert.match(stored[0].text, /Q\+E\+T/);
  });
  check('Track additions/deletions preserve selected data and enforce the eight-layer limit', () => {
    for (let n = 0; n < 10; n++) $('addTrk').click(); assert.equal(w.__song().tracks.length, 8);
    w.document.querySelector('.trk.act button:last-child').click(); assert.equal(w.__song().tracks.length, 7);
    assert.equal(w.document.querySelectorAll('.trk input[type=radio]:checked').length, 1);
  });
  $('sheet').value = '# Bài tập\n# track Giai điệu | piano | oct 0 | vol 80\nQ+E - Q - W\n# track Đệm | harp | oct 0 | vol 60\nG - - - -';
  $('applyBtn').click(); $('loop').checked = false;
  const pad = letter => w.document.querySelector(`.pad[data-i="${'QWERTASDFGZXCVB'.indexOf(letter)}"]`);
  check('Practice lights the selected chord, activates the keyboard and waits without autoplay', () => {
    if ($('keyboardBtn').getAttribute('aria-pressed') === 'true') $('keyboardBtn').click();
    calls.length = 0; $('guideBtn').click();
    assert.equal($('guideBtn').getAttribute('aria-pressed'), 'true');
    assert.equal($('keyboardBtn').getAttribute('aria-pressed'), 'true');
    assert.equal(calls.length, 0); assert.equal(w.__interval, null);
    assert.ok(pad('Q').classList.contains('guide-next')); assert.ok(pad('E').classList.contains('guide-next'));
    assert.ok(!pad('G').classList.contains('guide-next')); assert.match($('guideStatus').textContent, /bước 1\/3/);
  });
  check('Wrong or repeated notes do not skip a practice chord; every required note must be played', () => {
    key('t'); assert.match($('guideStatus').textContent, /Chưa đúng/);
    assert.ok(pad('Q').classList.contains('guide-next'));
    key('q'); assert.ok(pad('Q').classList.contains('guide-done')); assert.ok(pad('E').classList.contains('guide-next'));
    key('q'); assert.ok(pad('E').classList.contains('guide-next')); assert.match($('guideStatus').textContent, /bước 1\/3/);
    key('e'); assert.ok(pad('Q').classList.contains('guide-next')); assert.ok(!pad('E').classList.contains('guide-next'));
    assert.match($('guideStatus').textContent, /bước 2\/3/);
  });
  check('Practice skips rests, handles repeated notes and finishes with all hints cleared', () => {
    assert.ok(w.document.querySelector('.hd[data-c="2"]').classList.contains('guide-cur'));
    key('q'); assert.ok(pad('W').classList.contains('guide-next'));
    key('w'); assert.equal($('guideBtn').getAttribute('aria-pressed'), 'false');
    assert.equal(w.document.querySelectorAll('.guide-next, .guide-done, .guide-cur').length, 0);
    assert.match($('guideStatus').textContent, /Hoàn thành/);
  });
  check('Practice starts at the chosen column and loops over that part of the selected layer', () => {
    w.document.querySelector('.hd[data-c="2"]').click(); $('loop').checked = true; $('guideBtn').click();
    assert.match($('guideStatus').textContent, /bước 1\/2/); assert.ok(pad('Q').classList.contains('guide-next'));
    key('q'); assert.ok(pad('W').classList.contains('guide-next'));
    key('w'); assert.ok(pad('Q').classList.contains('guide-next')); assert.equal($('guideBtn').getAttribute('aria-pressed'), 'true');
    $('guideBtn').click(); assert.equal(w.document.querySelectorAll('.guide-next').length, 0);
  });
  check('Changing layers and editing cancel stale practice hints; empty sections are handled', () => {
    $('guideBtn').click(); w.document.querySelectorAll('.trk input[type=radio]')[1].click();
    assert.equal($('guideBtn').getAttribute('aria-pressed'), 'false'); assert.equal(w.document.querySelectorAll('.guide-next').length, 0);
    w.document.querySelector('.hd[data-c="0"]').click(); $('guideBtn').click(); assert.ok(pad('G').classList.contains('guide-next'));
    w.document.querySelector('.cell[data-c="0"][data-r="9"]').click();
    assert.equal($('guideBtn').getAttribute('aria-pressed'), 'false');
    $('guideBtn').click(); assert.equal($('guideBtn').getAttribute('aria-pressed'), 'false'); assert.match($('toast').textContent, /không có nốt/);
    w.document.querySelectorAll('.trk input[type=radio]')[0].click();
  });
  check('Autoplay and recording exit practice mode without mixing transport states', () => {
    $('guideBtn').click(); $('playBtn').click();
    assert.equal($('guideBtn').getAttribute('aria-pressed'), 'false'); assert.equal($('playBtn').getAttribute('aria-pressed'), 'true');
    $('playBtn').click(); $('guideBtn').click(); $('recBtn').click();
    assert.equal($('guideBtn').getAttribute('aria-pressed'), 'false'); assert.match($('transportState').textContent, /Chờ ghi/);
    $('recBtn').click();
  });
  // Verify sample handling through file input and fake IndexedDB, then a second page load.
  await until(() => !$('sampleFile').disabled);
  $('sampleInst').value = 'piano'; event(w, $('sampleInst'), 'change');
  Object.defineProperty($('sampleFile'), 'files', { configurable: true, value: [{ name: 'piano-test.wav', size: 100, arrayBuffer: async () => new ArrayBuffer(100) }] });
  event(w, $('sampleFile'), 'change'); await until(() => $('sampleStatus').textContent.includes('đã lưu'));
  check('Custom sample uploads, persists and plays with correct octave transposition', () => {
    a.sources.length = 0; $('previewSample').click();
    assert.equal(a.sources.at(-1).kind, 'sample'); assert.equal(a.sources.at(-1).playbackRate.value, 1);
    const tr = w.__song().tracks[0]; tr.inst = 'piano'; tr.oct = -1; w.__engine.voice(0, w.__ctx.currentTime, tr);
    assert.equal(a.sources.at(-1).playbackRate.value, .5);
  });
  const b = makeApp(); b.$('sampleInst').value = 'piano'; event(b.w, b.$('sampleInst'), 'change');
  await until(() => b.$('sampleStatus').textContent.includes('piano-test.wav'));
  check('Custom samples restore after page reload', () => assert.match(b.$('sampleStatus').textContent, /đã lưu/));
  b.$('resetSample').click(); await until(() => !b.$('resetSample').disabled);
  check('Reset removes the custom sample and returns to synthesis', () => {
    assert.match(b.$('sampleStatus').textContent, /âm tổng hợp/); b.sources.length = 0; b.$('previewSample').click();
    assert.ok(b.sources.length); assert.ok(b.sources.every(s => s.kind === 'oscillator'));
  });
  Object.defineProperty(b.$('sampleFile'), 'files', { configurable: true, value: [{ name: 'too-large.wav', size: 11 * 1024 * 1024 }] });
  event(b.w, b.$('sampleFile'), 'change'); await until(() => !b.$('sampleFile').disabled);
  check('Oversized audio is rejected without replacing the current sound', () => assert.match(b.$('toast').textContent, /10 MB/));
  assert.deepEqual(a.errors, []); assert.deepEqual(b.errors, []);
  a.dom.window.close(); b.dom.window.close();
  console.log(outputs.map((name, i) => `${i + 1}. PASS ${name}`).join('\n'));
  console.log(`\n${outputs.length} checks passed.`);
})().catch(error => { console.error(error); process.exit(1); });
