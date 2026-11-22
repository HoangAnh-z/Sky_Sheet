(function () {
  'use strict';
  var LETTERS = 'QWERTASDFGZXCVB';
  var NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  var DO = ['Đô', 'Rê', 'Mi', 'Fa', 'Sol', 'La', 'Si'];
  var LABEL_W = 68, NOTE_EDGE = 4, STEP_WIDTH = 64;
  var TRACK_COLORS = ['var(--gold)', '#32b8cf', '#ee9b48', '#ee76a6', '#57bb78', '#729af1', '#d2bc3c', '#cb89ee'];

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
  var playing = false, timerId = null, raf = 0, nextT = 0, stepI = 0, queue = [], finishAt = 0;
  var shownStep = null, paintedStep = null;
  var rec = false, recArmed = false, recT0 = 0, recTimer = null;
  var practice = null, practiceColumn = -1;
  var communityUI = null, previewPlayer = null, editingSongId = null;
  var columns = new Map(), padEls = [], rlEls = [];
  var rollHistory = new WeakMap();
  var resetRollScroll = false;
  var showAllTracks = false;
  var touchTools = false, drag = null, skipClick = false;

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
  function isDrumTrack() { return song.tracks[activeT] && song.tracks[activeT].inst === 'drums'; }
  function padName(i) { return isDrumTrack() ? window.SkyDrums.labels[i] : noteName(i); }
  function mainLabel(i) { return isDrumTrack() || labelMode === 'key' ? LETTERS[i] : labelMode === 'abc' ? noteName(i) : doName(i); }
  function subLabel(i) { return isDrumTrack() || labelMode === 'key' ? padName(i) : LETTERS[i]; }
  function labelRollKey(el, i) {
    el.classList.toggle('root', !isDrumTrack() && isRoot(i));
    el.innerHTML = '<span class="rl-key">' + LETTERS[i] + '</span><span class="rl-note">' +
      (!isDrumTrack() && labelMode === 'do' ? doName(i) : padName(i)) + '</span>';
    el.setAttribute('aria-label', padName(i) + ', phím ' + LETTERS[i]);
  }
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
    if (previewPlayer) previewPlayer.stop();
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
      padEls[i].classList.toggle('root', !isDrumTrack() && isRoot(i));
      padEls[i].setAttribute('aria-label', padName(i) + ', phím ' + LETTERS[i]);
    }
    rlEls.forEach(function (el) { labelRollKey(el, +el.dataset.i); });
  }

  /* ---------- khung soạn nhạc ---------- */
  function buildRoll() {
    stopPractice();
    var roll = $('#roll'), wrap = $('#rollWrap'), keep = wrap.scrollLeft;
    roll.style.setProperty('--n', song.steps.length);
    roll.style.setProperty('--step-w', STEP_WIDTH + 'px');
    roll.textContent = '';
    columns.clear();
    rlEls = [];
    var corner = document.createElement('div');
    corner.className = 'corner';
    roll.appendChild(corner);
    for (var k = 0; k < 15; k++) {
      var idx = 14 - k, label = document.createElement('button');
      label.type = 'button';
      label.className = 'rl' + (isRoot(idx) ? ' root' : '') + (k > 0 && k % 5 === 0 ? ' g' : '');
      label.dataset.i = idx;
      labelRollKey(label, idx);
      roll.appendChild(label);
      rlEls.push(label);
    }
    wrap.scrollLeft = keep;
    $('#rollStep').max = song.steps.length;
    updateRollWindow();
    updateUndo();
  }
  function updateRollWindow() {
    var wrap = $('#rollWrap'), roll = $('#roll');
    var left = Math.floor(wrap.scrollLeft / STEP_WIDTH);
    var first = Math.max(0, left - 8);
    var end = Math.min(song.steps.length, left + Math.ceil((wrap.clientWidth || 960) / STEP_WIDTH) + 8);
    columns.forEach(function (column, index) {
      if (index < first || index >= end) { column.remove(); columns.delete(index); }
    });
    var fragment = document.createDocumentFragment();
    for (var c = first; c < end; c++) {
      if (columns.has(c)) continue;
      var column = document.createElement('div'), header = document.createElement('button');
      column.className = 'roll-column';
      column.style.setProperty('--column', c);
      header.type = 'button';
      header.className = 'hd';
      header.setAttribute('aria-label', 'Đặt điểm phát tại bước ' + (c + 1));
      header.title = 'Bước ' + (c + 1);
      header.dataset.c = c;
      header.textContent = c % 4 === 0 ? c / 4 + 1 : '';
      column.appendChild(header);
      for (var idx = 14; idx >= 0; idx--) {
        var cell = document.createElement('div');
        cell.className = 'cell' + (c % 4 === 0 ? ' b' : '') + (idx === 9 || idx === 4 ? ' g' : '');
        cell.dataset.c = c;
        cell.dataset.r = idx;
        column.appendChild(cell);
      }
      columns.set(c, column);
      paintRollStep(c);
      fragment.appendChild(column);
    }
    if (fragment.childNodes.length) roll.appendChild(fragment);
  }
  function paintRollStep(c) {
    var column = columns.get(c), notes = song.steps[c];
    if (!column || !notes) return;
    column.firstElementChild.classList.toggle('start', c === cursor);
    column.firstElementChild.classList.toggle('playing-step', paintedStep && paintedStep.column === c);
    column.classList.toggle('practicing', c === practiceColumn);
    var layers = Array.from({ length: 15 }, function () { return []; });
    song.tracks.forEach(function (track, index) {
      if (!showAllTracks && index !== activeT) return;
      var chord = track.steps[c] || [];
      chord.forEach(function (note) { layers[note].push(TRACK_COLORS[index]); });
    });
    for (var i = 0; i < 15; i++) {
      var cell = column.children[15 - i], colors = layers[i];
      cell.classList.toggle('on', notes.includes(i));
      cell.classList.toggle('layer-note', colors.length > 0);
      if (!colors.length) cell.style.removeProperty('--note-fill');
      else if (colors.length === 1) cell.style.setProperty('--note-fill', colors[0]);
      else cell.style.setProperty('--note-fill', 'linear-gradient(to right,' + colors.map(function (color, j) {
        return color + ' ' + (j * 100 / colors.length) + '% ' + ((j + 1) * 100 / colors.length) + '%';
      }).join(',') + ')');
    }
    column.firstElementChild.classList.toggle('guide-cur', c === practiceColumn);
  }
  function updateUndo() {
    $('#undoRollBtn').disabled = rec || !(rollHistory.get(song.steps) || []).length;
  }
  function rememberEdit(steps) {
    var history = rollHistory.get(song.steps);
    if (!history) { history = []; rollHistory.set(song.steps, history); }
    history.push(steps.map(function (c) { return [c, song.steps[c].slice()]; }));
    if (history.length > 100) history.shift();
    updateUndo();
  }
  function toggleCell(idx, c) {
    if (rec) return;
    stopPractice();
    rememberEdit([c]);
    var arr = song.steps[c], p = arr.indexOf(idx);
    if (p >= 0) arr.splice(p, 1);
    else { arr.push(idx); arr.sort(function (a, b) { return a - b; }); ensureAudio(); voice(idx, ctx.currentTime); flashPad(idx); }
    paintRollStep(c);
    syncText();
  }
  function moveNote(from, to) {
    if (rec || !to || from.steps !== song.steps) return;
    var r = +to.dataset.r, c = +to.dataset.c;
    var source = song.steps[from.column], target = song.steps[c], p = source.indexOf(from.note);
    if (p < 0 || target.includes(r)) return;
    stopPractice();
    rememberEdit(c === from.column ? [c] : [from.column, c]);
    source.splice(p, 1); target.push(r);
    target.sort(function (a, b) { return a - b; });
    paintRollStep(from.column); paintRollStep(c);
    syncText();
  }
  function undoRoll() {
    var history = rollHistory.get(song.steps);
    if (rec || !history || !history.length) return;
    stopPractice();
    history.pop().forEach(function (entry) {
      song.steps[entry[0]] = entry[1];
      paintRollStep(entry[0]);
    });
    updateUndo(); syncText();
  }
  function setCursor(c) {
    stopPractice();
    var previous = cursor;
    cursor = c;
    $('#rollStep').value = c + 1;
    paintRollStep(previous); paintRollStep(c);
  }
  function jumpToStep(c) {
    if (rec) return;
    setCursor(c);
    $('#rollWrap').scrollLeft = c * STEP_WIDTH;
    updateRollWindow();
    if (playing) {
      if (c > lastAll()) stopPlay();
      else {
        audio.stopAll();
        cuePlayback(c, 0.04);
        sched();
      }
    }
  }
  function bindRoll() {
    var roll = $('#roll'), wrap = $('#rollWrap');
    wrap.addEventListener('scroll', updateRollWindow, { passive: true });
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(updateRollWindow).observe(wrap);
    $('#undoRollBtn').addEventListener('click', undoRoll);
    $('#rollJump').addEventListener('submit', function (event) {
      event.preventDefault();
      var step = $('#rollStep');
      if (step.checkValidity()) jumpToStep(step.valueAsNumber - 1);
    });
    $('#rollAllTracks').addEventListener('change', function () {
      showAllTracks = this.checked;
      columns.forEach(function (_, c) { paintRollStep(c); });
      if (shownStep) setPlayhead(shownStep);
    });
    $('#rollEditBtn').addEventListener('click', function () {
      touchTools = !touchTools;
      this.setAttribute('aria-pressed', String(touchTools));
      wrap.classList.toggle('touch-edit', touchTools);
    });
    $('#rollFocusBtn').addEventListener('click', function () {
      var wide = $('.workspace').classList.toggle('roll-focus');
      this.setAttribute('aria-pressed', String(wide));
      this.textContent = wide ? 'Thu hẹp lưới' : 'Mở rộng lưới';
    });
    $('#openPadsFromRoll').addEventListener('click', openExpandedPads);
    roll.addEventListener('pointerdown', function (event) {
      skipClick = false;
      var cell = event.target.closest('.cell');
      if (event.pointerType === 'touch' && !touchTools && cell) { skipClick = true; return; }
      if (!cell || !cell.classList.contains('on') || rec || event.button !== 0 || drag) return;
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY,
        column: +cell.dataset.c, note: +cell.dataset.r, steps: song.steps, target: null, moved: false };
    });
    roll.addEventListener('pointermove', function (event) {
      if (!drag || drag.id !== event.pointerId) return;
      if (!drag.moved && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 6) return;
      if (!drag.moved) { roll.setPointerCapture(event.pointerId); drag.moved = true; }
      if (drag.target) drag.target.classList.remove('note-target');
      var hit = document.elementFromPoint(event.clientX, event.clientY);
      drag.target = hit && hit.closest('.cell');
      if (drag.target && roll.contains(drag.target)) drag.target.classList.add('note-target');
      else drag.target = null;
    });
    function finishDrag(event) {
      if (!drag || drag.id !== event.pointerId) return;
      var done = drag;
      drag = null;
      if (done.target) done.target.classList.remove('note-target');
      if (done.moved) {
        skipClick = true;
        if (event.type === 'pointerup') moveNote(done, done.target);
      }
    }
    window.addEventListener('pointerup', finishDrag);
    window.addEventListener('pointercancel', finishDrag);
    roll.addEventListener('lostpointercapture', finishDrag);
    roll.addEventListener('click', function (event) {
      var cell = event.target.closest('.cell'), hd = event.target.closest('.hd'), rl = event.target.closest('.rl');
      if (skipClick && event.detail) { skipClick = false; return; }
      if (cell) toggleCell(+cell.dataset.r, +cell.dataset.c);
      else if (hd) jumpToStep(+hd.dataset.c);
      else if (rl) pressNote(+rl.dataset.i);
    });
  }
  function setPlayhead(step) {
    var activeNotes = new Set(), playedNotes = new Set();
    step.tracks.forEach(function (entry) {
      if (!audible(entry.track)) return;
      entry.notes.forEach(function (idx) {
        playedNotes.add(idx);
        if (showAllTracks || entry.track === song.tracks[activeT]) activeNotes.add(idx);
      });
    });
    playedNotes.forEach(flashPad);
    rlEls.forEach(function (el) { el.classList.toggle('active-hit', activeNotes.has(+el.dataset.i)); });
  }
  function scrollToColumn(c) {
    if ($('#padDialog').open || $('#view-compose').hidden) return;
    var wrap = $('#rollWrap');
    var x = LABEL_W + c * STEP_WIDTH;
    if (x < wrap.scrollLeft + LABEL_W || x > wrap.scrollLeft + wrap.clientWidth - 70) wrap.scrollLeft = Math.max(0, x - 140);
  }
  function clearPlayhead() {
    var column = paintedStep && columns.get(paintedStep.column);
    if (column) column.firstElementChild.classList.remove('playing-step');
    paintedStep = null;
    rlEls.forEach(function (el) { el.classList.remove('active-hit'); });
  }

  /* ---------- tập theo đèn: chờ người chơi, không tự phát ---------- */
  function clearPracticeLights() {
    padEls.forEach(function (pad) { pad.classList.remove('guide-next', 'guide-done'); pad.removeAttribute('aria-description'); });
    if (practiceColumn < 0) return;
    var previous = practiceColumn;
    practiceColumn = -1;
    paintRollStep(previous);
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
    practiceColumn = step;
    paintRollStep(step); scrollToColumn(step);
    $('#guideStatus').hidden = false;
    $('#guideStatus').textContent = (wrong ? 'Chưa đúng · ' : '') + song.tracks[activeT].name + ' · bước ' + (practice.index + 1) + '/' + practice.sequence.length + ' (ô ' + (step + 1) + ') · Bấm ' + Array.from(practice.remaining).map(function (i) { return LETTERS[i]; }).join(' + ');
  }
  function startPractice() {
    if (previewPlayer) previewPlayer.stop();
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
    var now = ctx.currentTime;
    if (document.hidden) advanceTimeline(now);
    if (finishAt) { if (now > finishAt) stopPlay(true); return; }
    var last = rec ? lastBacking() : lastAll();
    if (last < 0) { stopPlay(); return; }
    // If the browser throttled the timer, skip missed steps instead of playing a burst of late notes.
    if (nextT < now - 0.1) {
      var missed = Math.ceil((now - nextT) / stepDur());
      stepI += missed; nextT += missed * stepDur();
      if ($('#loop').checked) stepI %= last + 1;
    }
    var horizon = now + (document.hidden ? 4 : 0.12);
    while (nextT < horizon) {
      if (stepI > last) {
        if ($('#loop').checked) { stepI = 0; continue; }
        finishAt = nextT + 0.4; return;
      }
      var step = { time: nextT, column: stepI, duration: stepDur(), advance: stepI < last, tracks: [] };
      song.tracks.forEach(function (tr, k) {
        if (rec && k === activeT) return;
        var arr = tr.steps[stepI];
        if (!arr || !arr.length || !audible(tr)) return;
        var d = 0;
        if (INSTS[tr.inst].sus) { var k = stepI + 1; while (k < tr.steps.length && !tr.steps[k].length && k - stepI < 8) k++; d = (k - stepI) * stepDur() * 0.96; }
        arr.forEach(function (i) { voice(i, nextT, tr, d); });
        step.tracks.push({ track: tr, notes: arr.slice() });
      });
      queue.push(step);
      stepI++; nextT += step.duration;
    }
  }
  function advanceTimeline(now) {
    while (queue.length && queue[0].time <= now) shownStep = queue.shift();
  }
  function frame() {
    if (!playing) return;
    var now = ctx.currentTime;
    advanceTimeline(now);
    // Cạnh đầu nốt đến sát cột phím đúng lúc audio bắt đầu bước tương ứng.
    var step = shownStep || queue[0];
    if (step && !$('#view-compose').hidden && !$('#padDialog').open) {
      var progress = step.advance ? Math.max(0, Math.min(1, (now - step.time) / step.duration)) : 0;
      $('#rollWrap').scrollLeft = NOTE_EDGE + (step.column + progress) * STEP_WIDTH;
    }
    if (shownStep && shownStep !== paintedStep) {
      var previous = paintedStep && columns.get(paintedStep.column);
      if (previous) previous.firstElementChild.classList.remove('playing-step');
      paintedStep = shownStep;
      var current = columns.get(shownStep.column);
      if (current) current.firstElementChild.classList.add('playing-step');
      setPlayhead(shownStep);
    }
    raf = requestAnimationFrame(frame);
  }
  function cuePlayback(c, delay) {
    finishAt = 0; queue = []; shownStep = null; clearPlayhead();
    stepI = c; nextT = ctx.currentTime + delay;
  }
  function refreshPlaybackTimer() {
    clearInterval(timerId);
    timerId = setInterval(sched, document.hidden ? 250 : 25);
    sched();
  }
  function handleVisibility() {
    if (document.hidden && rec) { stopRec(); audio.stopAll(); }
    if (!playing) return;
    if (!document.hidden) {
      ensureAudio();
      // Keep imminent notes and return the rest to the short foreground scheduling window.
      var pending = queue.findIndex(function (step) { return step.time > ctx.currentTime + 0.12; });
      if (pending >= 0) {
        var step = queue[pending];
        audio.cancelScheduledFrom(step.time);
        stepI = step.column; nextT = step.time; finishAt = 0;
        queue.length = pending;
      }
    }
    refreshPlaybackTimer();
  }
  function startPlay() {
    if (previewPlayer) previewPlayer.stop();
    stopPractice();
    if (rec) stopRec();
    ensureAudio();
    if (lastAll() < 0) { toast('Chưa có nốt nào để phát'); return; }
    playing = true; cuePlayback(Math.min(cursor, lastAll()), 0.06);
    refreshPlaybackTimer();
    raf = requestAnimationFrame(frame); updatePlayBtn();
  }
  function stopPlay(keepTail) {
    playing = false; clearInterval(timerId); timerId = null; cancelAnimationFrame(raf);
    queue = []; shownStep = null; finishAt = 0; clearPlayhead(); if (!keepTail) audio.stopAll(); updatePlayBtn();
  }

  /* ---------- ghi ---------- */
  function toggleRec() { if (previewPlayer) previewPlayer.stop(); if (rec) stopRec(); else startRec(); }
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
      if ($('#ovd').checked && lastBacking() >= 0) { playing = true; cuePlayback(0, 0.02); refreshPlaybackTimer(); raf = requestAnimationFrame(frame); updatePlayBtn(); }
      $('#recBtn').textContent = 'Đang ghi… bấm để dừng'; updatePlayBtn();
      if ($('#metro').checked) { tick(); recTimer = setInterval(tick, 60000 / song.bpm); }
    }
    var s = Math.max(0, Math.round((performance.now() - recT0) / 1000 / stepDur()));
    var grew = false;
    while (s >= song.steps.length) { grow(); grew = true; }
    if (grew) buildRoll();
    if (song.steps[s].indexOf(i) < 0) {
      song.steps[s].push(i); song.steps[s].sort(function (a, b) { return a - b; });
      paintRollStep(s);
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
      row.style.setProperty('--track-color', TRACK_COLORS[k]);
      var rd = document.createElement('input'); rd.type = 'radio'; rd.name = 'trk'; rd.checked = k === activeT;
      rd.setAttribute('aria-label', 'Soạn lớp ' + (k + 1)); rd.addEventListener('change', function () { selectTrack(k); });
      var nm = document.createElement('input'); nm.type = 'text'; nm.value = tr.name; nm.maxLength = 24; nm.setAttribute('aria-label', 'Tên lớp ' + (k + 1));
      nm.addEventListener('change', function () { tr.name = this.value.replace(/\|/g, '/').trim() || 'Lớp ' + (k + 1); updateTrackInfo(); syncText(); });
      var is = document.createElement('select'); is.setAttribute('aria-label', 'Nhạc cụ lớp ' + (k + 1));
      Object.keys(INSTS).forEach(function (id) { opt(is, id, INSTS[id].n); }); is.value = tr.inst;
      is.addEventListener('change', function () {
        tr.inst = this.value;
        if (k === activeT) $('#inst').value = tr.inst;
        lockTrackEditing(); syncText();
      });
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
      var tuning = document.createElement('div'); tuning.className = 'trk-tuning'; tuning.append(is, os);
      var mix = document.createElement('div'); mix.className = 'trk-mix';
      mix.append(vl, liveLabel, flag('mute', 'M', 'Tắt tiếng'), flag('solo', 'S', 'Chỉ nghe lớp này'));
      row.append(rd, nm, tuning, mix, del);
      box.appendChild(row);
    });
    updateTrackInfo(); lockTrackEditing();
  }

  /* ---------- bản nhạc dạng chữ ---------- */
  function tok(a) { return a.length ? a.map(function (i) { return LETTERS[i]; }).join('+') : '-'; }
  function toText() {
    var out = ['# title ' + (song.title || 'Bài chưa đặt tên'), '# bpm ' + song.bpm], t0 = song.tracks[0];
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
        var titleMatch = line.match(/^#+\s*title\s+(.+)$/i);
        if (titleMatch) { title = titleMatch[1]; return; }
        var tm = line.match(/^#+\s*track\b[:\s]*(.*)$/i);
        if (tm) {
          var p = tm[1].split('|').map(function (x) { return x.trim(); }), id = null, oc = 0, vo = null;
          p.slice(1).forEach(function (f) {
            var o = f.match(/^oct\s*([+-]?\d)$/i), v = f.match(/^vol\s*(\d{1,3})$/i);
            if (o) oc = Math.max(-2, Math.min(1, +o[1])); else if (v) vo = Math.min(100, +v[1]); else id = findInst(f) || id;
          });
          nt(p[0], id, oc, vo); return;
        }
        var m = line.match(/^#+\s*bpm\s*[:=]?\s*(\d{2,3})\s*$/i);
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
    loadSong(r.title || song.title, r.bpm || song.bpm, r.tracks, editingSongId); switchTab('compose');
    toast(r.bad.length ? 'Đã áp dụng. Bỏ qua ' + r.bad.length + ' ký tự lạ: ' + r.bad.slice(0, 3).join(' ') : 'Đã áp dụng ' + r.count + ' bước, ' + r.tracks.length + ' lớp');
  }
  function setBpm(v, skipSync) {
    song.bpm = v; $('#bpmRange').value = v; $('#bpmNum').value = v;
    if (!skipSync) syncText();
  }
  function loadSong(title, bpm, tracks, savedId) {
    editingSongId = savedId || null;
    if (previewPlayer) previewPlayer.stop();
    stopPractice();
    if (rec) stopRec();
    if (playing) stopPlay();
    audio.stopAll();
    song.tracks.forEach(function (tr) { if (tr.bus) tr.bus.disconnect(); });
    var m = 0; tracks.forEach(function (t) { m = Math.max(m, t.steps.length); });
    tracks.forEach(function (t) { t.steps = normSteps(t.steps, Math.max(32, Math.ceil(m / 8) * 8)); });
    song = { title: title, bpm: bpm, tracks: tracks, steps: tracks[0].steps }; activeT = 0;
    $('#songTitle').textContent = title || 'Bài chưa đặt tên';
    $('#titleIn').value = title; $('#inst').value = tracks[0].inst; setBpm(bpm, true); setCursor(0);
    renderTracks(); buildRoll(); syncText(true);
    resetRollScroll = $('#view-compose').hidden;
    if (!resetRollScroll) $('#rollWrap').scrollLeft = 0;
    updateRollWindow();
  }

  /* ---------- thư viện ---------- */
  var STORE = 'phongnhacsky.songs';
  var cloud = window.SkyCloud(), cloudState = cloud.snapshot();
  function readUser() { try { var data = JSON.parse(localStorage.getItem(STORE)); return Array.isArray(data) ? data.filter(function (s) { return s && typeof s.title === 'string' && typeof s.text === 'string'; }) : []; } catch (e) { return []; } }
  function writeUser(list) { try { localStorage.setItem(STORE, JSON.stringify(list)); return true; } catch (e) { return false; } }
  function renderLibrary() {
    var ul = $('#songs'); ul.textContent = '';
    $('#libraryBadge').textContent = cloudState.user ? 'Tài khoản · ' + cloudState.user.username : 'Lưu trên trình duyệt';
    $('#libraryStatus').textContent = cloudState.user
      ? cloudState.loading ? 'Đang tải thư viện cá nhân…' : cloudState.error || 'Lưu tối đa 100 bài theo tài khoản. Bấm Lưu bài để cập nhật; bài cùng tên sẽ được thay thế.'
      : 'Bài đã lưu chỉ nằm trong trình duyệt này. Đăng nhập để lưu theo tài khoản và mở trên thiết bị khác.';
    $('#refreshLibraryBtn').hidden = !cloudState.user;
    $('#refreshLibraryBtn').disabled = cloudState.busy || cloudState.loading;
    $('#importLocalBtn').hidden = !cloudState.user || !readUser().length;
    $('#importLocalBtn').textContent = 'Chép bài trên máy vào tài khoản (' + readUser().length + ')';
    $('#importLocalBtn').disabled = cloudState.busy || cloudState.loading || !!cloudState.error;
    $('#saveBtn').disabled = cloudState.busy || (cloudState.user && (cloudState.loading || !!cloudState.error)) || (cloudState.configured && !cloudState.ready && !cloudState.error);
    $('#saveBtn').textContent = cloudState.user ? 'Lưu vào tài khoản' : 'Lưu bài tại máy';
    function section(title) { var li = document.createElement('li'); li.className = 'library-section'; li.textContent = title; ul.appendChild(li); }
    function add(title, meta, onOpen, onDelete, onPublish) {
      var li = document.createElement('li'), b = document.createElement('button');
      b.type = 'button'; b.className = 'song';
      var s = document.createElement('span'); s.textContent = title;
      var m = document.createElement('small'); m.textContent = meta;
      b.appendChild(s); b.appendChild(m); b.addEventListener('click', onOpen); li.appendChild(b);
      if (onDelete) {
        var d = document.createElement('button'); d.type = 'button'; d.className = 'btn small';
        d.textContent = 'Xóa'; d.setAttribute('aria-label', 'Xóa bài ' + title); d.disabled = cloudState.busy || cloudState.loading; d.addEventListener('click', onDelete); li.appendChild(d);
      }
      if (onPublish) {
        var publish = document.createElement('button'); publish.type = 'button'; publish.className = 'btn small'; publish.textContent = 'Công khai';
        publish.setAttribute('aria-label', 'Công khai bài ' + title); publish.disabled = cloudState.busy || cloudState.loading; publish.addEventListener('click', onPublish); li.appendChild(publish);
      }
      ul.appendChild(li);
    }
    section('Bài mẫu');
    add(BLANK.title, 'trống', function () {
      loadSong(BLANK.title, BLANK.bpm, [mkTrack('Lớp 1', 'harp')]);
      toast('Bản nhạc trống. Dán nốt của bạn vào ô Bản nhạc rồi bấm Áp dụng');
      switchTab('sheet'); $('#sheet').focus();
    });
    SONGS.forEach(function (s) {
      add(s.title, s.bpm + ' bpm', function () { loadSong(s.title, s.bpm, parse(s.text).tracks); switchTab('compose'); });
    });
    section(cloudState.user ? 'Bài của ' + cloudState.user.username : 'Bài lưu tại máy');
    (cloudState.user ? cloudState.songs : readUser()).forEach(function (s) {
      add(s.title, s.source ? 'từ @' + s.source.username : cloudState.user ? 'tài khoản' : 'tại máy', function () { var r = parse(s.text); loadSong(s.title, s.bpm || r.bpm || 100, r.tracks, s.id); switchTab('compose'); }, async function () {
        if (cloudState.user) {
          var uid = cloudState.user.uid;
          try { await cloud.remove(s.id); if (cloudState.user && cloudState.user.uid === uid) { if (editingSongId === s.id) editingSongId = null; toast('Đã xóa khỏi tài khoản'); } }
          catch (error) { toast(window.SkyCloud.errorMessage(error)); }
        } else {
          var l = readUser().filter(function (item) { return item.title !== s.title; });
          if (writeUser(l)) { renderLibrary(); toast('Đã xóa khỏi thư viện tại máy'); }
          else toast('Trình duyệt không cho xóa bài. Hãy thử lại.');
        }
      }, cloudState.user ? function () { if (communityUI) communityUI.openPublish(s.id); } : null);
    });
  }
  async function saveSong() {
    if (lastAll() < 0) { toast('Chưa có nốt nào để lưu'); return; }
    song.title = ($('#titleIn').value || '').trim() || 'Bài chưa đặt tên';
    $('#titleIn').value = song.title; $('#songTitle').textContent = song.title; syncText(true);
    var value = { title: song.title, bpm: song.bpm, text: toText() };
    if (cloudState.user) {
      var uid = cloudState.user.uid;
      if (editingSongId) value.id = editingSongId;
      try { var saved = await cloud.save(value); if (cloudState.user && cloudState.user.uid === uid) { if (saved) editingSongId = saved.id; toast('Đã lưu "' + value.title + '" vào tài khoản'); } }
      catch (error) { toast(window.SkyCloud.errorMessage(error)); }
      return;
    }
    var list = readUser().filter(function (s) { return s.title !== song.title; });
    list.push(value);
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
      '- Có thể soạn nhiều lớp nhạc cụ chạy cùng lúc, cùng nhịp. Trước các dòng nốt của mỗi lớp, thêm một dòng "# track Tên lớp | mã nhạc cụ | oct 0 | vol 80". Mã nhạc cụ: harp, piano, guitar, zheng, bell, flute, dizi, xiao, erhu, organ, strings, bass, drums. oct từ -2 đến 1. Với drums, Q kick, W snare, E hi-hat kín, R hi-hat mở.\n' +
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
    if (!document || !document.body || !$('#keyboardBtn')) return;
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
    if (name === 'compose') {
      if (resetRollScroll) { $('#rollWrap').scrollLeft = 0; resetRollScroll = false; }
      updateRollWindow();
    }
    if (name === 'community' && communityUI) communityUI.open();
  }
  function updateTrackInfo() {
    if (!song.tracks.length) return;
    $('#trackCount').textContent = song.tracks.length + ' / 8';
    var layered = $('#liveMode').value === 'layered';
    $('#liveStatus').textContent = layered
      ? 'Chồng ' + song.tracks.filter(function (t) { return t.live && audible(t); }).length + ' lớp khi bấm đàn'
      : 'Đang chơi: ' + song.tracks[activeT].name;
    $('#inst').disabled = rec || layered;
    $('#inst').closest('.field').classList.toggle('field-disabled', layered);
    $('#layeredHint').hidden = !layered;
    $('#trackPlayHint').hidden = !layered;
    $('#tracks').querySelectorAll('.live-check').forEach(function (label) { label.hidden = !layered; });
  }
  function lockTrackEditing() {
    document.querySelectorAll('#tracks input, #tracks select, #tracks button, #inst, #addTrk, #clearBtn, #bpmNum, #bpmRange, #applyBtn').forEach(function (el) { el.disabled = rec; });
    $('#inst').disabled = rec || $('#liveMode').value === 'layered';
    $('#rollJump').querySelectorAll('input, button').forEach(function (element) { element.disabled = rec; });
    $('#tracks').querySelectorAll('.octave').forEach(function (select, i) {
      select.disabled = rec || song.tracks[i].inst === 'drums';
    });
    refreshLabels();
    updateUndo();
  }
  function initAccount() {
    var dialog = $('#accountDialog'), register = false;
    function clearPasswords() { $('#accountPassword').value = ''; $('#accountConfirm').value = ''; }
    function close() { dialog.close(); clearPasswords(); $('#accountMessage').textContent = ''; $('#accountBtn').focus(); }
    function mode(isRegister) {
      register = isRegister; clearPasswords(); $('#accountMessage').textContent = '';
      $('#accountDialogTitle').textContent = isRegister ? 'Tạo tài khoản' : 'Đăng nhập';
      $('#accountSubmit').textContent = isRegister ? 'Đăng ký' : 'Đăng nhập';
      $('#confirmPasswordField').hidden = !isRegister; $('#accountConfirm').required = isRegister;
      $('#accountPassword').minLength = isRegister ? 8 : 1;
      $('#accountPassword').autocomplete = isRegister ? 'new-password' : 'current-password';
      $('#loginModeBtn').classList.toggle('primary', !isRegister); $('#registerModeBtn').classList.toggle('primary', isRegister);
      $('#loginModeBtn').setAttribute('aria-pressed', !isRegister); $('#registerModeBtn').setAttribute('aria-pressed', isRegister);
    }
    $('#accountBtn').addEventListener('click', function () {
      mode(false);
      if (typeof dialog.showModal !== 'function') { toast('Hãy dùng trình duyệt mới hơn để mở tài khoản.'); return; }
      dialog.showModal(); $('#accountUsername').focus();
    });
    $('#closeAccountBtn').addEventListener('click', close);
    dialog.addEventListener('cancel', function (event) { event.preventDefault(); close(); });
    dialog.addEventListener('close', clearPasswords);
    $('#loginModeBtn').addEventListener('click', function () { mode(false); });
    $('#registerModeBtn').addEventListener('click', function () { mode(true); });
    $('#accountForm').addEventListener('submit', async function (event) {
      event.preventDefault();
      if (!this.reportValidity() || cloudState.busy || !cloudState.configured || !cloudState.ready) return;
      if (register && $('#accountPassword').value !== $('#accountConfirm').value) {
        $('#accountMessage').textContent = 'Mật khẩu nhập lại chưa khớp.'; $('#accountConfirm').focus(); return;
      }
      $('#accountMessage').textContent = '';
      var wasRegister = register;
      try {
        await (wasRegister ? cloud.register : cloud.signIn)($('#accountUsername').value, $('#accountPassword').value);
        if (dialog.open) close();
        toast(wasRegister ? 'Đã tạo tài khoản' : 'Đã đăng nhập');
      } catch (error) { $('#accountMessage').textContent = window.SkyCloud.errorMessage(error); }
      finally { clearPasswords(); }
    });
    $('#logoutBtn').addEventListener('click', async function () {
      try { await cloud.signOut(); toast('Đã đăng xuất'); }
      catch (error) { toast(window.SkyCloud.errorMessage(error)); }
    });
    $('#refreshLibraryBtn').addEventListener('click', function () { cloud.refresh(); });
    $('#importLocalBtn').addEventListener('click', async function () {
      var uid = cloudState.user && cloudState.user.uid;
      try {
        var result = await cloud.importSongs(readUser());
        if (cloudState.user && cloudState.user.uid === uid) toast('Đã chép ' + result.imported + ' bài; bỏ qua ' + result.skipped + ' bài trùng tên, không hợp lệ hoặc thư viện đầy. Bản tại máy vẫn được giữ.');
      } catch (error) { toast(window.SkyCloud.errorMessage(error)); }
    });
    cloud.subscribe(function (state) {
      var previousUid = cloudState.user && cloudState.user.uid;
      cloudState = state;
      if (previousUid && (!state.user || state.user.uid !== previousUid)) {
        stopPractice(); if (rec) stopRec(); if (playing) stopPlay(); audio.stopAll();
        var first = SONGS[0]; loadSong(first.title, first.bpm, parse(first.text).tracks);
      }
      $('#accountName').hidden = !state.user;
      $('#accountName').textContent = state.user ? state.user.username : '';
      $('#accountName').title = state.user ? state.user.username : '';
      $('#accountBtn').hidden = !!state.user; $('#logoutBtn').hidden = !state.user;
      $('#logoutBtn').disabled = state.busy;
      $('#accountBtn').textContent = state.configured && !state.ready && !state.error ? 'Đang kết nối…' : 'Đăng nhập / Đăng ký';
      $('#accountConnection').textContent = !state.configured
        ? 'Tài khoản chưa được mở trên trang này. Bạn vẫn có thể chơi và lưu bài tại máy.'
        : !state.ready ? state.error || 'Đang kết nối tài khoản…' : '';
      document.querySelectorAll('#accountForm input, #accountSubmit, #loginModeBtn, #registerModeBtn').forEach(function (el) {
        el.disabled = !state.configured || !state.ready || state.busy;
      });
      renderLibrary();
    });
    cloud.start();
  }
  var openExpandedPads;
  function initExpandedPads() {
    var dialog = $('#padDialog'), transport = $('.transport'), surface = $('#playSurface'), toastElement = $('#toast');
    var transportAnchor = null, surfaceAnchor = null, toastAnchor = null, openTrigger = null;
    var ownsFullscreen = false, fullscreenRequest = 0;
    function fullscreenElement() { return document.fullscreenElement || document.webkitFullscreenElement; }
    function exitFullscreen() {
      if (!ownsFullscreen) return;
      ownsFullscreen = false;
      var exit = document.exitFullscreen || document.webkitExitFullscreen;
      if (exit && fullscreenElement() === document.documentElement) { try { Promise.resolve(exit.call(document)).catch(function () {}); } catch (_) {} }
    }
    function fullscreenStatus() {
      var full = !!fullscreenElement();
      $('#screenModeBtn').hidden = full;
      $('#fullscreenStatus').textContent = full ? 'Đang toàn màn hình · Thu nhỏ để trở về.' : 'Đang phóng to trong trang.';
    }
    function requestFullscreen() {
      if (fullscreenElement()) { fullscreenStatus(); return; }
      var enter = document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen;
      if (!enter) { $('#screenModeBtn').hidden = true; $('#fullscreenStatus').textContent = 'Đang phóng to trong trang.'; return; }
      var request = ++fullscreenRequest;
      try {
        Promise.resolve(enter.call(document.documentElement, { navigationUI: 'hide' })).then(function () {
          ownsFullscreen = fullscreenElement() === document.documentElement;
          if (!dialog.open || request !== fullscreenRequest) exitFullscreen();
          fullscreenStatus();
        }, function () { if (dialog.open) { fullscreenStatus(); $('#fullscreenStatus').textContent = 'Chưa vào toàn màn hình được · vẫn có thể chơi ở vùng phóng to.'; } });
      } catch (_) { fullscreenStatus(); }
    }
    function restore() {
      if (!surfaceAnchor) return;
      transportAnchor.replaceWith(transport); surfaceAnchor.replaceWith(surface);
      toastAnchor.replaceWith(toastElement);
      transportAnchor = surfaceAnchor = toastAnchor = null;
      document.documentElement.classList.remove('pads-expanded');
      fullscreenRequest++; exitFullscreen();
      $('#expandPadsBtn').setAttribute('aria-expanded', 'false');
      if (openTrigger) openTrigger.focus({ preventScroll: true });
      if (practiceColumn >= 0) scrollToColumn(practiceColumn);
    }
    function close() { if (dialog.open) dialog.close(); restore(); }
    openExpandedPads = function () {
      if (dialog.open) return;
      openTrigger = this;
      if (typeof dialog.showModal !== 'function') { toast('Trình duyệt này chưa hỗ trợ vùng đàn phóng to. Hãy dùng trình duyệt mới hơn.'); return; }
      clearTimeout(toastTimer); toastElement.classList.remove('show');
      transportAnchor = document.createComment('transport'); surfaceAnchor = document.createComment('play-surface');
      toastAnchor = document.createComment('toast'); toastElement.before(toastAnchor);
      transport.before(transportAnchor); surface.before(surfaceAnchor);
      $('#expandedTransport').appendChild(transport); $('#expandedPlay').appendChild(surface);
      dialog.appendChild(toastElement);
      try {
        dialog.showModal(); document.documentElement.classList.add('pads-expanded');
        $('#expandPadsBtn').setAttribute('aria-expanded', 'true');
        $('#closePadDialog').focus({ preventScroll: true });
        requestFullscreen();
      } catch (_) { restore(); toast('Không mở được vùng đàn phóng to. Bạn vẫn có thể chơi ở vùng đàn thường.'); }
    };
    $('#expandPadsBtn').addEventListener('click', openExpandedPads);
    $('#closePadDialog').addEventListener('click', close);
    dialog.addEventListener('cancel', function (event) { event.preventDefault(); close(); });
    dialog.addEventListener('close', function () { if (!dialog.open) restore(); });
    $('#screenModeBtn').addEventListener('click', requestFullscreen);
    document.addEventListener('fullscreenchange', fullscreenStatus);
    document.addEventListener('webkitfullscreenchange', fullscreenStatus);
  }
  function initPadColors() {
    var dialog = $('#padColorDialog'), surface = $('#playSurface'), trigger;
    var root = document.documentElement, preview = $('.palette-preview'), reset = $('#resetPaletteBtn');
    var padPicker = $('#customPadColor'), bgPicker = $('#customBackgroundColor');
    var choices = Array.from(dialog.querySelectorAll('input[name="padColor"]'));
    function read(key) {
      try { return localStorage.getItem('phongnhacsky.' + key); } catch (_) { return null; }
    }
    function save(key, value) {
      try {
        if (value) localStorage.setItem('phongnhacsky.' + key, value);
        else localStorage.removeItem('phongnhacsky.' + key);
      } catch (_) {}
    }
    function hex(value) { return /^#[0-9a-f]{6}$/i.test(value || '') ? value : ''; }
    var saved = read('pad_color');
    var selected = choices.find(function (choice) { return choice.value === saved; }) || choices[0];
    var customKey = hex(read('custom_pad_color')), customBackground = hex(read('custom_background_color'));

    function applyColors() {
      root.dataset.palette = selected.value;
      surface.dataset.padColor = preview.dataset.padColor = selected.value;
      root.toggleAttribute('data-custom-key', !!customKey);
      root.toggleAttribute('data-custom-background', !!customBackground);
      root.style.setProperty('--custom-key', customKey);
      root.style.setProperty('--custom-background', customBackground);
      reset.hidden = !customKey && !customBackground;
    }
    function syncPickers() {
      padPicker.value = customKey || hex(getComputedStyle(surface).getPropertyValue('--key-light').trim()) || '#ddd3fa';
      bgPicker.value = customBackground || hex(getComputedStyle(root).getPropertyValue('--palette-tint').trim()) || '#8b9ce0';
    }
    function usePalette() {
      customKey = customBackground = '';
      save('custom_pad_color', '');
      save('custom_background_color', '');
      applyColors();
      syncPickers();
    }
    selected.checked = true;
    applyColors();

    dialog.addEventListener('change', function (event) {
      var choice = event.target;
      if (choices.includes(choice) && choice.checked) {
        selected = choice;
        save('pad_color', choice.value);
        usePalette();
      }
    });
    [[padPicker, 'custom_pad_color'], [bgPicker, 'custom_background_color']].forEach(function (entry) {
      var picker = entry[0], key = entry[1];
      function update() {
        if (picker === padPicker) customKey = hex(picker.value);
        else customBackground = hex(picker.value);
        applyColors();
      }
      picker.addEventListener('input', update);
      picker.addEventListener('change', function () { update(); save(key, hex(picker.value)); });
    });
    reset.addEventListener('click', function () { usePalette(); selected.focus(); });
    function openColors() {
      if (dialog.open) return;
      trigger = this;
      syncPickers();
      dialog.showModal();
      dialog.querySelector('input:checked').focus();
    }
    $('#padColorBtn').addEventListener('click', openColors);
    $('#expandedColorBtn').addEventListener('click', openColors);
    $('#closePadColorBtn').addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('close', function () {
      if (trigger) trigger.focus({ preventScroll: true });
    });
  }
  function initInterface() {
    initExpandedPads();
    initPadColors();
    initAccount();
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
    $('#titleIn').addEventListener('change', function () { song.title = this.value.trim(); $('#songTitle').textContent = song.title || 'Bài chưa đặt tên'; syncText(true); });
    $('#applyBtn').addEventListener('click', applyText);
    $('#copyBtn').addEventListener('click', function () { copyText($('#sheet').value, $('#sheet')); });
    $('#saveBtn').addEventListener('click', saveSong);
    $('#reqIn').addEventListener('input', buildPrompt);
    $('#copyPrompt').addEventListener('click', function () { copyText($('#promptOut').value, $('#promptOut')); });
    window.addEventListener('keydown', function (e) {
      if (!keyboardEnabled || e.defaultPrevented || $('#accountDialog').open || $('#publishDialog').open || $('#padColorDialog').open || isEditing(e.target)) return;
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      var letter = /^Key[A-Z]$/.test(e.code || '') ? e.code.slice(3) : (e.key || '').toUpperCase();
      var i = letter.length === 1 ? LETTERS.indexOf(letter) : -1;
      if (i >= 0) { e.preventDefault(); pressNote(i); }
    });
    window.addEventListener('pagehide', function () { stopPractice(); if (rec) stopRec(); if (playing) stopPlay(); audio.stopAll(); });
    document.addEventListener('visibilitychange', handleVisibility);

    initInterface(); bindRoll(); renderLibrary(); buildPrompt(); updatePlayBtn();
    var first = SONGS[0];
    loadSong(first.title, first.bpm, parse(first.text).tracks);
    refreshLabels();
    previewPlayer = window.SkyPreview(parse, toast, audio.sampleLibrary);
    function preview(data, button) {
      if (rec) { toast('Hãy dừng ghi trước khi nghe thử.'); return; }
      if (playing) stopPlay(); stopPractice(); previewPlayer.play(data, button);
    }
    function stage(data) {
      previewPlayer.stop(); editingSongId = null; $('#sheet').value = data.text; $('#titleIn').value = data.title; switchTab('sheet'); $('#sheet').focus();
      toast('Đã đưa vào Bản nhạc & AI. Bấm Áp dụng để dùng rồi lưu vào thư viện.');
    }
    window.SkyMidi.init({ toast: toast, copy: copyText, stage: stage, stopPreview: function () { previewPlayer.stop(); }, preview: function (data) { preview(data, $('#midiPreview')); } });
    communityUI = window.SkyCommunity({ cloud: cloud, toast: toast, copy: copyText, preview: preview, stopPreview: function () { previewPlayer.stop(); },
      stage: stage, title: function () { return $('#titleIn').value; }, login: function () { $('#accountBtn').click(); }, goCommunity: function () { switchTab('community'); } });
  }
  init();
})();

