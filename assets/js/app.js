(function () {
  'use strict';
  var LETTERS = 'QWERTASDFGZXCVB';
  var NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  var DO = ['Đô', 'Rê', 'Mi', 'Fa', 'Sol', 'La', 'Si'];
  var STEP_W = 30, LABEL_W = 54;

  var SONGS = [
    { title: 'Twinkle Twinkle Little Star', bpm: 100, text: 'Q Q T T  A A T -  R R E E  W W Q -\nT T R R  E E W -  T T R R  E E W -\nQ Q T T  A A T -  R R E E  W W Q' },
    { title: 'Ode to Joy (Beethoven)', bpm: 110, text: 'E E R T  T R E W  Q Q W E  E W W -\nE E R T  T R E W  Q Q W E  W Q Q' },
    { title: 'Jingle Bells', bpm: 130, text: 'E E E -  E E E -  E T Q W  E - - -\nR R R R  R E E E  E W W E  W - T -' },
    { title: 'Happy Birthday', bpm: 100, text: 'T T A T  D S - -  T T A T  F D - -\nX X G D  S A - -  Z Z G D  F D' },
    { title: 'Ode to Joy (3 lớp: dizi, đàn hạc, guitar)', bpm: 110, text: '# track Giai điệu | dizi | oct 0 | vol 90\nE E R T  T R E W  Q Q W E  E W W -\nE E R T  T R E W  Q Q W E  W Q Q\n# track Hợp âm | harp | oct 0 | vol 60\nQ+E+T - - -  T+S+W - - -  Q+E+T - - -  T+S+W - - -\nQ+E+T - - -  T+S+W - - -  Q+E+T - - -  T+S+W - Q+E+T\n# track Bass | guitar | oct -1 | vol 75\nQ - - -  T - - -  Q - - -  T - - -\nQ - - -  T - - -  Q - - -  T - Q' }
  ];
  var BLANK = { title: 'Nơi này có anh', bpm: 90 };

  var $ = function (s) { return document.querySelector(s); };
  var song = { title: '', bpm: 100, tracks: [], steps: [] }, activeT = 0;
  var labelMode = 'key', cursor = 0, keyboardEnabled = false;
  var ctx = null;
  var playing = false, timerId = null, raf = 0, nextT = 0, stepI = 0, queue = [], finishAt = 0, curCol = -1;
  var rec = false, recArmed = false, recT0 = 0, recTimer = null;
  var practice = null;
  var cells = [], padEls = [], rlEls = [], hdEls = [];

  /* ---------- tiện ích ---------- */
  var toastTimer = null;
  function toast(msg) {
    var t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }
  function copyText(text, fallbackEl) {
    var ok = function () { toast('Đã sao chép'); };
    var fail = function () { fallbackEl.focus(); fallbackEl.select(); toast('Hãy nhấn Ctrl+C để sao chép'); };
    try { navigator.clipboard.writeText(text).then(ok, fail); } catch (e) { fail(); }
  }
  function oct(i) { return i < 7 ? 4 : i < 14 ? 5 : 6; }
  function noteName(i) { return NAMES[i % 7] + oct(i); }
  function doName(i) { return DO[i % 7] + (i < 7 ? '' : i < 14 ? "'" : "''"); }
  function mainLabel(i) { return labelMode === 'key' ? LETTERS[i] : labelMode === 'abc' ? noteName(i) : doName(i); }
  function subLabel(i) { return labelMode === 'key' ? noteName(i) : LETTERS[i]; }
  function isRoot(i) { return i % 7 === 0; }
  function stepDur() { return 60 / song.bpm / 2; }
  function normSteps(arr, min) {
    var n = Math.max(min || 32, Math.ceil(arr.length / 8) * 8), out = [];
    for (var c = 0; c < n; c++) out.push(arr[c] ? arr[c].slice() : []);
    return out;
  }
  function lastUsed() {
    for (var c = song.steps.length - 1; c >= 0; c--) if (song.steps[c].length) return c;
    return -1;
  }

  /* ---------- âm thanh ---------- */
  var INSTS = window.SKY_INSTRUMENTS;
  var audio = new window.SkyAudio(function () { return song; }, function () { return song.tracks[activeT]; });
  function ensureAudio() { ctx = audio.ensureAudio(); }
  var voice = audio.voice, audible = audio.audible, refreshBus = audio.refreshBus, tick = audio.tick;

  /* ---------- đàn ---------- */
  function buildPads() {
    var box = $('#pads');
    for (var i = 0; i < 15; i++) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'pad' + (isRoot(i) ? ' root' : ''); b.dataset.i = i;
      b.innerHTML = '<span class="m"></span><span class="k"></span>';
      b.addEventListener('pointerdown', (function (idx) { return function (e) { if (e.button !== 0) return; e.preventDefault(); this.focus({ preventScroll: true }); pressNote(idx); }; })(i));
      b.addEventListener('click', function (e) { if (e.detail === 0) pressNote(+this.dataset.i); });
      box.appendChild(b); padEls.push(b);
    }
  }
  function flashPad(i) {
    var el = padEls[i]; el.classList.add('hit');
    clearTimeout(el.flashTimer); el.flashTimer = setTimeout(function () { el.classList.remove('hit'); }, 170);
  }
  function pressNote(i) {
    ensureAudio();
    var targets = $('#liveMode').value === 'layered' ? song.tracks.filter(function (tr) { return tr.live && audible(tr); }) : [song.tracks[activeT]];
    targets.forEach(function (tr) { voice(i, ctx.currentTime, tr); });
    flashPad(i);
    if (rec) recordNote(i);
    if (practice) acceptPracticeNote(i);
  }
  function refreshLabels() {
    for (var i = 0; i < 15; i++) {
      padEls[i].children[0].textContent = mainLabel(i);
      padEls[i].children[1].textContent = subLabel(i);
    }
    rlEls.forEach(function (el) { el.textContent = mainLabel(+el.dataset.i); });
    padEls.forEach(function (el, i) { el.setAttribute('aria-label', noteName(i) + ', phím ' + LETTERS[i]); });
  }

  /* ---------- khung soạn nhạc ---------- */
  function buildRoll() {
    stopPractice();
    var wrap = $('#rollWrap'), keep = wrap.scrollLeft;
    var roll = $('#roll'), n = song.steps.length;
    roll.style.setProperty('--n', n);
    roll.textContent = '';
    cells = []; rlEls = []; hdEls = [];
    for (var c = 0; c < n; c++) cells.push([]);
    var frag = document.createDocumentFragment(), el;
    el = document.createElement('div'); el.className = 'corner'; frag.appendChild(el);
    for (c = 0; c < n; c++) {
      el = document.createElement('div');
      el.className = 'hd' + (c === cursor ? ' start' : ''); el.dataset.c = c;
      el.textContent = c % 4 === 0 ? (c / 4 + 1) : '';
      hdEls.push(el); frag.appendChild(el);
    }
    for (var k = 0; k < 15; k++) {
      var idx = 14 - k, g = k > 0 && k % 5 === 0 ? ' g' : '';
      el = document.createElement('div');
      el.className = 'rl' + (isRoot(idx) ? ' root' : '') + g; el.dataset.i = idx;
      el.textContent = mainLabel(idx);
      rlEls.push(el); frag.appendChild(el);
      for (c = 0; c < n; c++) {
        el = document.createElement('div');
        el.className = 'cell' + (c % 4 === 0 ? ' b' : '') + g + (song.steps[c].indexOf(idx) >= 0 ? ' on' : '');
        el.dataset.r = idx; el.dataset.c = c;
        cells[c][idx] = el; frag.appendChild(el);
      }
    }
    roll.appendChild(frag);
    wrap.scrollLeft = keep;
    curCol = -1;
  }
  function toggleCell(idx, c) {
    stopPractice();
    var arr = song.steps[c], p = arr.indexOf(idx);
    if (p >= 0) arr.splice(p, 1); else { arr.push(idx); arr.sort(function (a, b) { return a - b; }); ensureAudio(); voice(idx, ctx.currentTime); flashPad(idx); }
    cells[c][idx].classList.toggle('on', p < 0);
    syncText();
  }
  function setCursor(c) {
    stopPractice();
    if (hdEls[cursor]) hdEls[cursor].classList.remove('start');
    cursor = c; if (hdEls[c]) hdEls[c].classList.add('start');
  }
  function setPlayhead(c) {
    if (curCol >= 0 && cells[curCol]) cells[curCol].forEach(function (e) { e && e.classList.remove('cur'); });
    curCol = c;
    if (!cells[c]) return;
    cells[c].forEach(function (e) { e && e.classList.add('cur'); });
    song.tracks.forEach(function (t, k) { if (audible(t) && !(rec && k === activeT) && t.steps[c]) t.steps[c].forEach(flashPad); });
    scrollToColumn(c);
  }
  function scrollToColumn(c) {
    var wrap = $('#rollWrap'), x = LABEL_W + c * STEP_W;
    if (x < wrap.scrollLeft + LABEL_W || x > wrap.scrollLeft + wrap.clientWidth - 70) wrap.scrollLeft = Math.max(0, x - 140);
  }
  function clearPlayhead() {
    if (curCol >= 0 && cells[curCol]) cells[curCol].forEach(function (e) { e && e.classList.remove('cur'); });
    curCol = -1;
  }

  /* ---------- tập theo đèn: chờ người chơi, không tự phát ---------- */
  function clearPracticeLights() {
    padEls.forEach(function (pad) { pad.classList.remove('guide-next', 'guide-done'); pad.removeAttribute('aria-description'); });
    document.querySelectorAll('.guide-cur').forEach(function (el) { el.classList.remove('guide-cur'); });
  }
  function stopPractice(message) {
    practice = null; clearPracticeLights();
    $('#guideBtn').setAttribute('aria-pressed', 'false'); $('#guideBtn').textContent = 'Tập theo đèn';
    $('#guideStatus').hidden = !message; $('#guideStatus').textContent = message || '';
    updatePlayBtn();
  }
  function showPracticeStep(wrong) {
    clearPracticeLights();
    var step = practice.sequence[practice.index], notes = song.steps[step];
    notes.forEach(function (i) {
      var pending = practice.remaining.has(i);
      padEls[i].classList.add(pending ? 'guide-next' : 'guide-done');
      padEls[i].setAttribute('aria-description', pending ? 'Nốt cần bấm tiếp' : 'Đã bấm đúng trong hợp âm này');
    });
    cells[step].forEach(function (el) { el.classList.add('guide-cur'); });
    hdEls[step].classList.add('guide-cur'); scrollToColumn(step);
    $('#guideStatus').hidden = false;
    $('#guideStatus').textContent = (wrong ? 'Chưa đúng · ' : '') + song.tracks[activeT].name + ' · bước ' + (practice.index + 1) + '/' + practice.sequence.length + ' (ô ' + (step + 1) + ') · Bấm ' + Array.from(practice.remaining).map(function (i) { return LETTERS[i]; }).join(' + ');
  }
  function startPractice() {
    if (rec) stopRec();
    if (playing) stopPlay();
    stopPractice();
    var sequence = [];
    song.steps.forEach(function (notes, c) { if (c >= cursor && notes.length) sequence.push(c); });
    if (!sequence.length) { toast('Lớp này không có nốt từ vị trí đã chọn. Chọn lớp hoặc điểm bắt đầu khác.'); return; }
    ensureAudio(); audio.stopAll();
    practice = { sequence: sequence, index: 0, remaining: new Set(song.steps[sequence[0]]) };
    keyboardEnabled = true; $('#guideBtn').focus({ preventScroll: true }); updateKeyboardStatus();
    padEls.forEach(function (pad) { clearTimeout(pad.flashTimer); pad.classList.remove('hit'); });
    $('#guideBtn').setAttribute('aria-pressed', 'true'); $('#guideBtn').textContent = 'Dừng tập';
    showPracticeStep(); updatePlayBtn();
    toast('Bấm phím sáng nhẹ để đi tiếp. Hợp âm cần bấm đủ các nốt; ô nghỉ tự bỏ qua.');
  }
  function acceptPracticeNote(i) {
    if (!practice.remaining.has(i)) { showPracticeStep(true); return; }
    practice.remaining.delete(i);
    if (practice.remaining.size) { showPracticeStep(); return; }
    practice.index++;
    if (practice.index >= practice.sequence.length) {
      if ($('#loop').checked) practice.index = 0;
      else { stopPractice('Hoàn thành lớp ' + song.tracks[activeT].name + '! Bấm Tập theo đèn để tập lại.'); return; }
    }
    practice.remaining = new Set(song.steps[practice.sequence[practice.index]]);
    showPracticeStep();
  }

  /* ---------- phát ---------- */
  var ICON_PLAY = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1.5v11l9-5.5z" fill="currentColor"/></svg>';
  var ICON_STOP = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><rect x="2.5" y="2.5" width="9" height="9" rx="1.5" fill="currentColor"/></svg>';
  function updatePlayBtn() {
    $('#playBtn').innerHTML = (playing ? ICON_STOP + 'Dừng' : ICON_PLAY + 'Phát');
    $('#playBtn').setAttribute('aria-pressed', playing);
    $('#transportState').textContent = rec ? (recArmed ? 'Chờ ghi…' : 'Đang ghi') : playing ? 'Đang phát' : practice ? 'Đang tập' : 'Sẵn sàng';
  }
  function sched() {
    var last = rec ? lastBacking() : lastAll();
    if (last < 0) { stopPlay(); return; }
    while (nextT < ctx.currentTime + 0.12) {
      if (stepI > last) {
        if ($('#loop').checked) { stepI = 0; continue; }
        clearInterval(timerId); timerId = null; finishAt = nextT + 0.4; return;
      }
      song.tracks.forEach(function (tr, k) {
        if (rec && k === activeT) return;
        var arr = tr.steps[stepI];
        if (!arr || !arr.length || !audible(tr)) return;
        var d = 0;
        if (INSTS[tr.inst].sus) { var k = stepI + 1; while (k < tr.steps.length && !tr.steps[k].length && k - stepI < 8) k++; d = (k - stepI) * stepDur() * 0.96; }
        arr.forEach(function (i) { voice(i, nextT, tr, d); });
      });
      queue.push({ t: nextT, s: stepI });
      stepI++; nextT += stepDur();
    }
  }
  function frame() {
    if (!playing) return;
    while (queue.length && queue[0].t <= ctx.currentTime) setPlayhead(queue.shift().s);
    if (finishAt && ctx.currentTime > finishAt) { stopPlay(true); return; }
    raf = requestAnimationFrame(frame);
  }
  function startPlay() {
    stopPractice();
    if (rec) stopRec();
    ensureAudio();
    if (lastAll() < 0) { toast('Chưa có nốt nào để phát'); return; }
    playing = true; finishAt = 0; queue = [];
    stepI = Math.min(cursor, lastAll()); nextT = ctx.currentTime + 0.06;
    timerId = setInterval(sched, 25); sched();
    raf = requestAnimationFrame(frame); updatePlayBtn();
  }
  function stopPlay(keepTail) {
    playing = false; clearInterval(timerId); timerId = null; cancelAnimationFrame(raf);
    queue = []; finishAt = 0; clearPlayhead(); if (!keepTail) audio.stopAll(); updatePlayBtn();
  }

  /* ---------- ghi ---------- */
  function toggleRec() { if (rec) stopRec(); else startRec(); }
  function startRec() {
    stopPractice();
    if (playing) stopPlay();
    ensureAudio(); rec = true; recArmed = true;
    $('#recBtn').classList.add('on'); $('#recBtn').textContent = 'Đang chờ phím đầu… bấm để dừng';
    updatePlayBtn(); lockTrackEditing(); toast('Bấm một phím để bắt đầu ghi');
  }
  function stopRec() {
    rec = false; recArmed = false; clearInterval(recTimer); recTimer = null; if (playing) stopPlay();
    $('#recBtn').classList.remove('on'); $('#recBtn').textContent = 'Ghi từ đàn';
    var n = lastUsed() + 1;
    updatePlayBtn(); lockTrackEditing(); syncText(true);
    toast(n > 0 ? 'Đã ghi ' + n + ' bước' : 'Chưa ghi được nốt nào');
  }
  function recordNote(i) {
    if (recArmed) {
      recArmed = false; recT0 = performance.now();
      song.tracks[activeT].steps = song.steps = normSteps([], song.steps.length); setCursor(0); buildRoll();
      if ($('#ovd').checked && lastBacking() >= 0) { playing = true; finishAt = 0; queue = []; stepI = 0; nextT = ctx.currentTime + 0.02; timerId = setInterval(sched, 25); sched(); raf = requestAnimationFrame(frame); updatePlayBtn(); }
      $('#recBtn').textContent = 'Đang ghi… bấm để dừng'; updatePlayBtn();
      if ($('#metro').checked) { tick(); recTimer = setInterval(tick, 60000 / song.bpm); }
    }
    var s = Math.max(0, Math.round((performance.now() - recT0) / 1000 / stepDur()));
    var grew = false;
    while (s >= song.steps.length) { grow(); grew = true; }
    if (grew) buildRoll();
    if (song.steps[s].indexOf(i) < 0) {
      song.steps[s].push(i); song.steps[s].sort(function (a, b) { return a - b; });
      cells[s][i].classList.add('on');
    }
  }

  /* ---------- lớp nhạc cụ ---------- */
  function mkTrack(name, id, oct, vol, steps) {
    return { name: name, inst: INSTS[id] ? id : 'harp', oct: oct || 0, vol: vol == null ? 80 : vol, mute: false, solo: false, live: true, steps: steps || [], bus: null };
  }
  function lastOf(a) { for (var c = a.length - 1; c >= 0; c--) if (a[c].length) return c; return -1; }
  function lastBacking() { var m = -1; song.tracks.forEach(function (t, k) { if (k !== activeT && audible(t)) m = Math.max(m, lastOf(t.steps)); }); return m; }
  function lastAll() { var m = -1; song.tracks.forEach(function (t) { m = Math.max(m, lastOf(t.steps)); }); return m; }
  function grow() { song.tracks.forEach(function (t) { for (var k = 0; k < 8; k++) t.steps.push([]); }); }
  function norm(x) { return x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim(); }
  function findInst(x) { x = norm(x); for (var id in INSTS) if (id === x || norm(INSTS[id].n) === x) return id; return null; }
  function selectTrack(k) {
    if (rec) return;
    activeT = k; song.steps = song.tracks[k].steps; $('#inst').value = song.tracks[k].inst;
    renderTracks(); buildRoll(); syncText();
  }
  function opt(sel, val, text) { var o = document.createElement('option'); o.value = val; o.textContent = text; sel.appendChild(o); }
  function renderTracks() {
    var box = $('#tracks'); box.textContent = '';
    song.tracks.forEach(function (tr, k) {
      var row = document.createElement('div'); row.className = 'trk' + (k === activeT ? ' act' : '');
      var rd = document.createElement('input'); rd.type = 'radio'; rd.name = 'trk'; rd.checked = k === activeT;
      rd.setAttribute('aria-label', 'Soạn lớp ' + (k + 1)); rd.addEventListener('change', function () { selectTrack(k); });
      var nm = document.createElement('input'); nm.type = 'text'; nm.value = tr.name; nm.maxLength = 24; nm.setAttribute('aria-label', 'Tên lớp ' + (k + 1));
      nm.addEventListener('change', function () { tr.name = this.value.replace(/\|/g, '/').trim() || 'Lớp ' + (k + 1); updateTrackInfo(); syncText(); });
      var is = document.createElement('select'); is.setAttribute('aria-label', 'Nhạc cụ lớp ' + (k + 1));
      Object.keys(INSTS).forEach(function (id) { opt(is, id, INSTS[id].n); }); is.value = tr.inst;
      is.addEventListener('change', function () { tr.inst = this.value; if (k === activeT) $('#inst').value = tr.inst; syncText(); });
      var os = document.createElement('select'); os.className = 'octave'; os.setAttribute('aria-label', 'Quãng tám lớp ' + (k + 1));
      [[-2, 'Thấp 2 quãng'], [-1, 'Thấp 1 quãng'], [0, 'Quãng gốc'], [1, 'Cao 1 quãng']].forEach(function (o) { opt(os, o[0], o[1]); }); os.value = tr.oct;
      os.addEventListener('change', function () { tr.oct = +this.value; syncText(); });
      var vl = document.createElement('input'); vl.type = 'range'; vl.className = 'volume'; vl.min = 0; vl.max = 100; vl.value = tr.vol; vl.setAttribute('aria-label', 'Âm lượng lớp ' + (k + 1));
      vl.addEventListener('input', function () { tr.vol = +this.value; refreshBus(); });
      vl.addEventListener('change', function () { syncText(); });
      function flag(key, label, title) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'btn small' + (tr[key] ? ' on' : ''); b.textContent = label; b.title = title; b.setAttribute('aria-pressed', !!tr[key]);
        b.addEventListener('click', function () { tr[key] = !tr[key]; refreshBus(); renderTracks(); });
        return b;
      }
      var del = document.createElement('button'); del.type = 'button'; del.className = 'btn small'; del.textContent = 'Xóa'; del.setAttribute('aria-label', 'Xóa lớp ' + (k + 1));
      del.addEventListener('click', function () {
        if (song.tracks.length < 2) { toast('Cần giữ lại ít nhất một lớp'); return; }
        if (playing) stopPlay();
        if (tr.bus) tr.bus.disconnect();
        song.tracks.splice(k, 1); refreshBus(); selectTrack(Math.min(activeT > k ? activeT - 1 : activeT, song.tracks.length - 1)); syncText(true);
      });
      var liveLabel = document.createElement('label'); liveLabel.className = 'check live-check';
      var live = document.createElement('input'); live.type = 'checkbox'; live.checked = tr.live; live.setAttribute('aria-label', 'Chơi chồng lớp ' + (k + 1));
      live.addEventListener('change', function () { tr.live = this.checked; updateTrackInfo(); });
      liveLabel.append(live, document.createTextNode('Chơi'));
      [rd, nm, is, os, vl, liveLabel, flag('mute', 'M', 'Tắt tiếng'), flag('solo', 'S', 'Chỉ nghe lớp này'), del].forEach(function (e) { row.appendChild(e); });
      box.appendChild(row);
    });
    updateTrackInfo(); lockTrackEditing();
  }

  /* ---------- bản nhạc dạng chữ ---------- */
  function tok(a) { return a.length ? a.map(function (i) { return LETTERS[i]; }).join('+') : '-'; }
  function toText() {
    var out = ['# ' + (song.title || 'Bài chưa đặt tên'), '# bpm ' + song.bpm], t0 = song.tracks[0];
    var multi = song.tracks.length > 1 || t0.inst !== 'harp' || t0.oct !== 0 || t0.vol !== 80;
    song.tracks.forEach(function (tr) {
      if (multi) out.push('# track ' + tr.name + ' | ' + tr.inst + ' | oct ' + tr.oct + ' | vol ' + tr.vol);
      var last = lastOf(tr.steps);
      if (last < 0 && multi) out.push('-');
      for (var s = 0; s <= last; s += 16) {
        var groups = [];
        for (var g = s; g < Math.min(s + 16, last + 1); g += 4)
          groups.push(tr.steps.slice(g, Math.min(g + 4, last + 1)).map(tok).join(' '));
        out.push(groups.join('  '));
      }
    });
    return out.join('\n');
  }
  function syncText(force) {
    var ta = $('#sheet');
    if (force || document.activeElement !== ta) ta.value = toText();
  }
  function parse(text, defInst) {
    var tracks = [], cur = null, bpm = null, title = null, bad = [];
    function nt(name, id, oc, vo) { cur = mkTrack(name || 'Lớp ' + (tracks.length + 1), id || defInst || 'harp', oc, vo, []); tracks.push(cur); }
    text.split(/\r?\n/).forEach(function (line) {
      line = line.trim();
      if (!line) return;
      if (line.charAt(0) === '#') {
        var tm = line.match(/^#+\s*track\b[:\s]*(.*)$/i);
        if (tm) {
          var p = tm[1].split('|').map(function (x) { return x.trim(); }), id = null, oc = 0, vo = null;
          p.slice(1).forEach(function (f) {
            var o = f.match(/^oct\s*([+-]?\d)$/i), v = f.match(/^vol\s*(\d{1,3})$/i);
            if (o) oc = Math.max(-2, Math.min(1, +o[1])); else if (v) vo = Math.min(100, +v[1]); else id = findInst(f) || id;
          });
          nt(p[0], id, oc, vo); return;
        }
        var m = line.match(/bpm\s*[:=]?\s*(\d{2,3})/i);
        if (m) bpm = +m[1]; else if (title === null) title = line.replace(/^#+\s*/, '');
        return;
      }
      if (!cur) nt('Lớp 1');
      line.split(/\s+/).forEach(function (t) {
        if (t === '|') return;
        if (/^[-._]$/.test(t)) { cur.steps.push([]); return; }
        if (/^[QWERTASDFGZXCVB](\+[QWERTASDFGZXCVB])*$/i.test(t)) {
          var set = {};
          t.toUpperCase().split('+').forEach(function (ch) { set[LETTERS.indexOf(ch)] = 1; });
          cur.steps.push(Object.keys(set).map(Number).sort(function (a, b) { return a - b; }));
        } else bad.push(t);
      });
    });
    if (!tracks.length) nt('Lớp 1');
    var count = 0; tracks.forEach(function (t) { count = Math.max(count, t.steps.length); });
    return { tracks: tracks, bpm: bpm, title: title, bad: bad, count: count };
  }
  function applyText() {
    var r = parse($('#sheet').value, song.tracks[activeT].inst);
    if (!r.count) { toast('Chưa đọc được nốt nào trong ô bản nhạc'); return; }
    if (r.bpm) r.bpm = Math.min(220, Math.max(50, r.bpm));
    loadSong(r.title || song.title, r.bpm || song.bpm, r.tracks); switchTab('compose');
    toast(r.bad.length ? 'Đã áp dụng. Bỏ qua ' + r.bad.length + ' ký tự lạ: ' + r.bad.slice(0, 3).join(' ') : 'Đã áp dụng ' + r.count + ' bước, ' + r.tracks.length + ' lớp');
  }
  function setBpm(v, skipSync) {
    song.bpm = v; $('#bpmRange').value = v; $('#bpmNum').value = v;
    if (!skipSync) syncText();
  }
  function loadSong(title, bpm, tracks) {
    stopPractice();
    if (rec) stopRec();
    if (playing) stopPlay();
    audio.stopAll();
    song.tracks.forEach(function (tr) { if (tr.bus) tr.bus.disconnect(); });
    var m = 0; tracks.forEach(function (t) { m = Math.max(m, t.steps.length); });
    tracks.forEach(function (t) { t.steps = normSteps(t.steps, Math.ceil(m / 8) * 8); });
    song = { title: title, bpm: bpm, tracks: tracks, steps: tracks[0].steps }; activeT = 0;
    $('#songTitle').textContent = title || 'Bài chưa đặt tên';
    $('#titleIn').value = title; $('#inst').value = tracks[0].inst; setBpm(bpm, true); setCursor(0);
    renderTracks(); buildRoll(); syncText(true);
    $('#rollWrap').scrollLeft = 0;
  }

  /* ---------- thư viện ---------- */
  var STORE = 'phongnhacsky.songs';
  function readUser() { try { var data = JSON.parse(localStorage.getItem(STORE)); return Array.isArray(data) ? data.filter(function (s) { return s && typeof s.title === 'string' && typeof s.text === 'string'; }) : []; } catch (e) { return []; } }
  function writeUser(list) { try { localStorage.setItem(STORE, JSON.stringify(list)); return true; } catch (e) { return false; } }
  function renderLibrary() {
    var ul = $('#songs'); ul.textContent = '';
    function add(title, meta, onOpen, onDelete) {
      var li = document.createElement('li'), b = document.createElement('button');
      b.type = 'button'; b.className = 'song';
      var s = document.createElement('span'); s.textContent = title;
      var m = document.createElement('small'); m.textContent = meta;
      b.appendChild(s); b.appendChild(m); b.addEventListener('click', onOpen); li.appendChild(b);
      if (onDelete) {
        var d = document.createElement('button'); d.type = 'button'; d.className = 'btn small';
        d.textContent = 'Xóa'; d.setAttribute('aria-label', 'Xóa bài ' + title); d.addEventListener('click', onDelete); li.appendChild(d);
      }
      ul.appendChild(li);
    }
    add(BLANK.title, 'trống', function () {
      loadSong(BLANK.title, BLANK.bpm, [mkTrack('Lớp 1', 'harp')]);
      toast('Bản nhạc trống. Dán nốt của bạn vào ô Bản nhạc rồi bấm Áp dụng');
      switchTab('sheet'); $('#sheet').focus();
    });
    SONGS.forEach(function (s) {
      add(s.title, s.bpm + ' bpm', function () { loadSong(s.title, s.bpm, parse(s.text).tracks); switchTab('compose'); });
    });
    readUser().forEach(function (s, n) {
      add(s.title, 'của bạn', function () { var r = parse(s.text); loadSong(s.title, s.bpm || r.bpm || 100, r.tracks); switchTab('compose'); }, function () {
        var l = readUser(); l.splice(n, 1); writeUser(l); renderLibrary(); toast('Đã xóa khỏi thư viện');
      });
    });
  }
  function saveSong() {
    if (lastAll() < 0) { toast('Chưa có nốt nào để lưu'); return; }
    song.title = ($('#titleIn').value || '').trim() || 'Bài chưa đặt tên';
    $('#titleIn').value = song.title; $('#songTitle').textContent = song.title; syncText(true);
    var list = readUser().filter(function (s) { return s.title !== song.title; });
    list.push({ title: song.title, bpm: song.bpm, text: toText() });
    toast(writeUser(list) ? 'Đã lưu "' + song.title + '" trong trình duyệt này' : 'Trình duyệt không cho lưu. Hãy sao chép bản nhạc để giữ lại');
    renderLibrary();
  }

  /* ---------- lời nhắc cho AI ---------- */
  function buildPrompt() {
    var req = ($('#reqIn').value || '').trim() || '(mô tả bản nhạc bạn muốn)';
    $('#promptOut').value =
      'Hãy soạn một bản nhạc cho đàn 15 phím (kiểu Sky: Children of the Light) theo đúng định dạng sau.\n\n' +
      'Quy tắc:\n' +
      '- Mỗi từ là một bước, cách nhau bằng dấu cách. Dấu - là nghỉ một bước.\n' +
      '- 15 phím từ thấp đến cao: Q W E R T A S D F G Z X C V B, tương ứng C D E F G A B C D E F G A B C (từ C4 đến C6).\n' +
      '- Hợp âm: nối các phím bằng dấu +, ví dụ Q+T+E.\n' +
      '- Dòng bắt đầu bằng # là ghi chú. Ghi tốc độ ở dòng "# bpm 110".\n' +
      '- Có thể soạn nhiều lớp nhạc cụ chạy cùng lúc, cùng nhịp. Trước các dòng nốt của mỗi lớp, thêm một dòng "# track Tên lớp | mã nhạc cụ | oct 0 | vol 80". Mã nhạc cụ: harp, piano, guitar, zheng, bell, flute, dizi, xiao, erhu, organ, strings, bass. oct từ -2 đến 1.\n' +
      '- Chỉ trả về bản nhạc trong một khối code, không giải thích.\n\n' +
      'Yêu cầu: ' + req;
  }


  /* ---------- giao diện ---------- */
  function isEditing(target) {
    if (!target || !target.closest) return false;
    if (target.closest('textarea, select, [contenteditable]:not([contenteditable="false"])')) return true;
    return target.tagName === 'INPUT' && ['checkbox', 'radio', 'range', 'button', 'submit', 'reset'].indexOf(target.type) < 0;
  }
  function updateKeyboardStatus() {
    $('#keyboardBtn').setAttribute('aria-pressed', keyboardEnabled);
    $('#keyboardBtn').textContent = keyboardEnabled ? 'Tắt chơi bằng bàn phím' : 'Bật chơi bằng bàn phím';
    $('#keyboardStatus').textContent = !keyboardEnabled
      ? 'Bàn phím đang tắt · vẫn có thể bấm trực tiếp lên đàn.'
      : isEditing(document.activeElement)
        ? 'Tạm dừng khi nhập liệu · bấm một phím trên đàn để tiếp tục.'
        : 'Bàn phím đang bật · dùng Q W E R T / A S D F G / Z X C V B.';
  }
  function switchTab(name) {
    document.querySelectorAll('[data-tab]').forEach(function (tab) {
      var selected = tab.dataset.tab === name;
      tab.setAttribute('aria-selected', selected); tab.tabIndex = selected ? 0 : -1;
      $('#view-' + tab.dataset.tab).hidden = !selected;
    });
  }
  function updateTrackInfo() {
    if (!song.tracks.length) return;
    $('#activeTrackLabel').textContent = song.tracks[activeT].name;
    $('#padDialogTitle').textContent = 'Chơi đàn · ' + song.tracks[activeT].name;
    $('#trackCount').textContent = song.tracks.length + ' / 8';
    $('#liveStatus').textContent = $('#liveMode').value === 'layered'
      ? 'Chồng ' + song.tracks.filter(function (t) { return t.live && audible(t); }).length + ' lớp khi bấm đàn'
      : 'Đang chơi: ' + song.tracks[activeT].name;
  }
  function lockTrackEditing() {
    document.querySelectorAll('#tracks input, #tracks select, #tracks button, #inst, #addTrk, #clearBtn, #bpmNum, #bpmRange, #applyBtn').forEach(function (el) { el.disabled = rec; });
  }
  function initExpandedPads() {
    var dialog = $('#padDialog'), transport = $('.transport'), surface = $('#playSurface'), toastElement = $('#toast');
    var transportAnchor = null, surfaceAnchor = null, toastAnchor = null;
    function restore() {
      if (!surfaceAnchor) return;
      transportAnchor.replaceWith(transport); surfaceAnchor.replaceWith(surface);
      toastAnchor.replaceWith(toastElement);
      transportAnchor = surfaceAnchor = toastAnchor = null;
      document.documentElement.classList.remove('pads-expanded');
      $('#expandPadsBtn').setAttribute('aria-expanded', 'false');
      $('#expandPadsBtn').focus({ preventScroll: true });
    }
    function close() { if (dialog.open) dialog.close(); restore(); }
    $('#expandPadsBtn').addEventListener('click', function () {
      if (dialog.open) return;
      if (typeof dialog.showModal !== 'function') { toast('Trình duyệt này chưa hỗ trợ vùng đàn phóng to. Hãy dùng trình duyệt mới hơn.'); return; }
      transportAnchor = document.createComment('transport'); surfaceAnchor = document.createComment('play-surface');
      toastAnchor = document.createComment('toast'); toastElement.before(toastAnchor);
      transport.before(transportAnchor); surface.before(surfaceAnchor);
      $('#expandedTransport').appendChild(transport); $('#expandedPlay').appendChild(surface);
      dialog.appendChild(toastElement);
      try {
        dialog.showModal(); document.documentElement.classList.add('pads-expanded');
        $('#expandPadsBtn').setAttribute('aria-expanded', 'true');
        $('#closePadDialog').focus({ preventScroll: true });
      } catch (_) { restore(); toast('Không mở được vùng đàn phóng to. Bạn vẫn có thể chơi ở vùng đàn thường.'); }
    });
    $('#closePadDialog').addEventListener('click', close);
    dialog.addEventListener('cancel', function (event) { event.preventDefault(); close(); });
    dialog.addEventListener('close', function () { if (!dialog.open) restore(); });
  }
  function initInterface() {
    initExpandedPads();
    $('#guideBtn').addEventListener('click', function () { if (practice) stopPractice(); else startPractice(); });
    $('#keyboardBtn').addEventListener('click', function () {
      keyboardEnabled = !keyboardEnabled;
      if (keyboardEnabled) { ensureAudio(); this.focus({ preventScroll: true }); }
      updateKeyboardStatus();
    });
    document.addEventListener('focusin', updateKeyboardStatus);
    document.addEventListener('focusout', function () { queueMicrotask(updateKeyboardStatus); });
    document.addEventListener('change', function (event) {
      if (keyboardEnabled && event.target.tagName === 'SELECT') event.target.blur();
    });
    updateKeyboardStatus();
    var tabs = Array.from(document.querySelectorAll('[data-tab]'));
    tabs.forEach(function (tab, k) {
      tab.addEventListener('click', function () { switchTab(tab.dataset.tab); });
      tab.addEventListener('keydown', function (event) {
        var i = event.key === 'ArrowRight' ? (k + 1) % tabs.length : event.key === 'ArrowLeft' ? (k + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1;
        if (i >= 0) { event.preventDefault(); switchTab(tabs[i].dataset.tab); tabs[i].focus(); }
      });
    });
    function updateThemeButton() {
      var dark = document.documentElement.dataset.theme === 'dark';
      $('#themeBtn').textContent = dark ? '☀ Giao diện sáng' : '☾ Giao diện tối';
      $('#themeBtn').setAttribute('aria-label', dark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối');
    }
    updateThemeButton();
    $('#themeBtn').addEventListener('click', function () {
      var value = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = value;
      try { localStorage.setItem('phongnhacsky.theme', value); } catch (_) {}
      updateThemeButton();
    });
    $('#liveMode').addEventListener('change', updateTrackInfo);
    window.SkySamples(audio, INSTS, toast);
  }

  /* ---------- nối sự kiện ---------- */
  function init() {
    buildPads();
    Object.keys(INSTS).forEach(function (id) { opt($('#inst'), id, INSTS[id].n); });
    $('#inst').addEventListener('change', function () { song.tracks[activeT].inst = this.value; renderTracks(); syncText(); });
    $('#addTrk').addEventListener('click', function () {
      if (song.tracks.length >= 8) { toast('Tối đa 8 lớp'); return; }
      song.tracks.push(mkTrack('Lớp ' + (song.tracks.length + 1), 'dizi', 0, null, normSteps([], song.steps.length)));
      selectTrack(song.tracks.length - 1); syncText(true);
    });
    $('#labelMode').addEventListener('change', function () { labelMode = this.value; refreshLabels(); });
    $('#bpmRange').addEventListener('input', function () { setBpm(+this.value); });
    $('#bpmNum').addEventListener('change', function () { setBpm(Math.min(220, Math.max(50, +this.value || 100))); });
    $('#playBtn').addEventListener('click', function () { if (rec) stopRec(); else if (playing) stopPlay(); else startPlay(); });
    $('#recBtn').addEventListener('click', toggleRec);
    $('#moreBtn').addEventListener('click', function () { grow(); buildRoll(); });
    $('#clearBtn').addEventListener('click', function () {
      if (playing) stopPlay();
      song.tracks[activeT].steps = song.steps = normSteps([], song.steps.length); setCursor(0); buildRoll(); syncText(true); toast('Đã xóa lớp này');
    });
    $('#roll').addEventListener('click', function (e) {
      var cell = e.target.closest('.cell'), hd = e.target.closest('.hd'), rl = e.target.closest('.rl');
      if (cell) toggleCell(+cell.dataset.r, +cell.dataset.c);
      else if (hd) { setCursor(+hd.dataset.c); }
      else if (rl) pressNote(+rl.dataset.i);
    });
    $('#titleIn').addEventListener('change', function () { song.title = this.value.trim(); $('#songTitle').textContent = song.title || 'Bài chưa đặt tên'; syncText(true); });
    $('#applyBtn').addEventListener('click', applyText);
    $('#copyBtn').addEventListener('click', function () { copyText($('#sheet').value, $('#sheet')); });
    $('#saveBtn').addEventListener('click', saveSong);
    $('#reqIn').addEventListener('input', buildPrompt);
    $('#copyPrompt').addEventListener('click', function () { copyText($('#promptOut').value, $('#promptOut')); });
    window.addEventListener('keydown', function (e) {
      if (!keyboardEnabled || e.defaultPrevented || isEditing(e.target)) return;
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      var letter = /^Key[A-Z]$/.test(e.code || '') ? e.code.slice(3) : (e.key || '').toUpperCase();
      var i = letter.length === 1 ? LETTERS.indexOf(letter) : -1;
      if (i >= 0) { e.preventDefault(); pressNote(i); }
    });
    window.addEventListener('pagehide', function () { stopPractice(); if (rec) stopRec(); if (playing) stopPlay(); audio.stopAll(); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) { if (rec) stopRec(); if (playing) stopPlay(); audio.stopAll(); } });

    initInterface(); renderLibrary(); buildPrompt(); updatePlayBtn();
    var first = SONGS[0];
    loadSong(first.title, first.bpm, parse(first.text).tracks);
    refreshLabels();
  }
  init();
})();

