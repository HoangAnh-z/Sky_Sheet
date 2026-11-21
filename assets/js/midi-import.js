(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SkyMidi = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  // Quy nốt, chọn tông và bảng lớp theo kiem-tra-midi.html người dùng cung cấp.
  var LETTERS = 'QWERTASDFGZXCVB';
  var SKY_MIDI = [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81, 83, 84];
  var C_MAJOR_PC = new Set([0, 2, 4, 5, 7, 9, 11]);
  var INSTRUMENTS = [
    ['piano', 'Piano'], ['harp', 'Đàn hạc'], ['strings', 'Dàn dây'], ['bass', 'Bass'],
    ['guitar', 'Guitar'], ['zheng', 'Đàn tranh'], ['dizi', 'Sáo dizi'], ['flute', 'Sáo'],
    ['xiao', 'Tiêu'], ['erhu', 'Nhị hồ'], ['bell', 'Chuông'], ['organ', 'Đàn organ']
  ];
  var MAX_BYTES = 1024 * 1024, MAX_NOTES = 20000, MAX_STEPS = 4096;
  function clean(value, length) { return String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\|/g, '/').trim().slice(0, length); }
  function error(text) { throw new Error(text); }
  function parseMidi(buffer) {
    var bytes = ArrayBuffer.isView(buffer) ? new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) : new Uint8Array(buffer);
    if (bytes.length > MAX_BYTES) error('Chọn file .mid/.midi tối đa 1 MB.');
    var view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), p = 0, limit = bytes.length;
    function need(n) { if (!Number.isSafeInteger(n) || n < 0 || p + n > limit) error('File MIDI bị thiếu dữ liệu hoặc độ dài track không hợp lệ.'); }
    function byte() { need(1); return view.getUint8(p++); }
    function number(n) { need(n); var value = n === 2 ? view.getUint16(p) : view.getUint32(p); p += n; return value; }
    function text(n) { need(n); var value = ''; for (var i = 0; i < n; i++) value += String.fromCharCode(byte()); return value; }
    function vlq() {
      var value = 0;
      for (var i = 0; i < 4; i++) { var b = byte(); value = value * 128 + (b & 127); if (!(b & 128)) return value; }
      error('File MIDI có số delta/độ dài VLQ không hợp lệ.');
    }
    function dataByte() { var value = byte(); if (value > 127) error('File MIDI có dữ liệu kênh không hợp lệ.'); return value; }
    if (text(4) !== 'MThd') error('Không phải file MIDI hợp lệ.');
    var headerLength = number(4); if (headerLength < 6) error('Header MIDI không hợp lệ.'); need(headerLength);
    var headerEnd = p + headerLength, format = number(2), declaredTracks = number(2), ppq = number(2);
    if (format > 1) error('Chưa hỗ trợ MIDI type 2. Hãy xuất lại file type 0 hoặc type 1.');
    if (!declaredTracks || declaredTracks > 128) error('File cần từ 1 đến 128 track nguồn.');
    if (!ppq || (ppq & 32768)) error('Chưa hỗ trợ MIDI dùng đồng hồ SMPTE hoặc nhịp PPQ không hợp lệ.');
    p = headerEnd;
    var tracks = [], tempos = [], bpm = 100, originalBpm = 100, count = 0;
    for (var t = 0; t < declaredTracks; t++) {
      if (text(4) !== 'MTrk') error('Thiếu chunk MTrk trong file MIDI.');
      var length = number(4); need(length); var end = p + length; limit = end;
      var tick = 0, running = 0, name = '', notes = [], channels = new Set();
      while (p < end) {
        tick += vlq(); if (!Number.isSafeInteger(tick)) error('Mốc thời gian MIDI quá lớn.');
        need(1); var status = view.getUint8(p);
        if (status < 128) { if (!running) error('File MIDI có running status không hợp lệ.'); status = running; }
        else { p++; if (status < 240) running = status; }
        if (status === 255) {
          var type = byte(), metaLength = vlq(); need(metaLength);
          if (type === 81 && metaLength === 3) {
            var mpqn = view.getUint8(p) * 65536 + view.getUint8(p + 1) * 256 + view.getUint8(p + 2);
            if (!mpqn) error('Tempo MIDI bằng 0 không hợp lệ.');
            originalBpm = 60000000 / mpqn; bpm = Math.min(220, Math.max(50, Math.round(originalBpm))); tempos.push({ tick: tick, bpm: originalBpm });
          } else if (type === 3 && metaLength) {
            var raw = bytes.subarray(p, p + metaLength), decoded = '';
            try { decoded = new TextDecoder('utf-8', { fatal: true }).decode(raw); }
            catch (_) { for (var c = 0; c < Math.min(raw.length, 256); c++) decoded += String.fromCharCode(raw[c]); }
            if (clean(decoded, 24)) name = clean(decoded, 24);
          }
          p += metaLength;
        } else if (status === 240 || status === 247) {
          var sysexLength = vlq(); need(sysexLength); p += sysexLength; running = 0;
        } else {
          var event = status & 240, channel = status & 15;
          if (event < 128 || event > 224) error('File có sự kiện MIDI chưa hỗ trợ.');
          var d1 = dataByte(), d2 = event === 192 || event === 208 ? 0 : dataByte();
          if (event === 144 && d2 > 0) {
            if (++count > MAX_NOTES) error('File có quá 20.000 nốt. Hãy xuất một đoạn ngắn hơn.');
            notes.push({ tick: tick, midi: d1, ch: channel }); channels.add(channel);
          }
        }
      }
      p = end; limit = bytes.length;
      if (notes.length) {
        var drum = channels.size === 1 && channels.has(9);
        tracks.push({ name: name || (drum ? 'Trống (Percussion)' : 'Lớp ' + (tracks.length + 1)), notes: notes, isDrum: drum,
          avgMidi: Math.round(notes.reduce(function (sum, note) { return sum + note.midi; }, 0) / notes.length) });
      }
    }
    if (!count) error('File MIDI không có nốt nhạc.');
    return { ppq: ppq, bpm: bpm, originalBpm: originalBpm, tracks: tracks, tempos: tempos };
  }
  function defaults(track, index) {
    return { index: index, name: track.name, inst: track.isDrum ? 'bell' : track.avgMidi < 54 ? 'bass' : index === 0 ? 'piano' : index === 1 ? 'strings' : 'harp', oct: track.avgMidi < 54 ? -1 : 0 };
  }
  function inspect(parsed) {
    if (!parsed || !parsed.ppq || !Array.isArray(parsed.tracks) || !parsed.tracks.length) error('Hãy chọn một file MIDI có nốt nhạc.');
    return { bpm: parsed.bpm, originalBpm: parsed.originalBpm, tracks: parsed.tracks.map(function (track, index) {
      return Object.assign(defaults(track, index), { notes: track.notes.length, percussion: track.isDrum, avgMidi: track.avgMidi });
    }), notes: parsed.tracks.reduce(function (sum, track) { return sum + track.notes.length; }, 0), tempoChanges: parsed.tempos.length > 1 };
  }
  function mapPitch(pitch) {
    var folded = pitch;
    while (folded < 60) folded += 12;
    while (folded > 84) folded -= 12;
    var best = 0, distance = Infinity;
    SKY_MIDI.forEach(function (value, i) { if (Math.abs(value - folded) < distance) { distance = Math.abs(value - folded); best = i; } });
    return { key: best, folded: folded !== pitch, rounded: SKY_MIDI[best] !== folded };
  }
  function convert(parsed, options) {
    options = options || {}; var info = inspect(parsed), selected = options.tracks || [];
    if (!selected.length || selected.length > 8) error('Hãy chọn từ 1 đến 8 lớp MIDI.');
    var choices = selected.map(function (value) { return typeof value === 'number' ? defaults(parsed.tracks[value] || {}, value) : value; });
    if (new Set(choices.map(function (choice) { return choice.index; })).size !== choices.length || choices.some(function (choice) { return !Number.isInteger(choice.index) || !parsed.tracks[choice.index]; })) error('Lớp MIDI được chọn không hợp lệ.');
    choices.forEach(function (choice) { if (!INSTRUMENTS.some(function (inst) { return inst[0] === choice.inst; }) || ![-2, -1, 0, 1].includes(Number(choice.oct))) error('Nhạc cụ hoặc quãng tám của lớp không hợp lệ.'); });
    var bpm = Number(options.bpm == null ? parsed.bpm : options.bpm);
    var excerpt = options.range === 'excerpt', start = excerpt ? Number(options.startBeat == null ? 0 : options.startBeat) : 0, beats = excerpt ? Number(options.beats == null ? 128 : options.beats) : null;
    if (!Number.isInteger(bpm) || bpm < 50 || bpm > 220 || !Number.isFinite(start) || start < 0 || start > 100000 || (excerpt && (!Number.isInteger(beats) || beats < 1 || beats > 2048))) error('Kiểm tra BPM 50–220 và đoạn nhập từ 1 đến 2.048 phách.');
    var sourceNotes = choices.flatMap(function (choice) { return parsed.tracks[choice.index].notes; });
    var shift = 0, score = -1;
    // Giữ nguyên thứ tự -6…+5 và cách xử lý hòa điểm của bản tham chiếu.
    for (var candidate = -6; candidate <= 5; candidate++) {
      var hits = 0; sourceNotes.forEach(function (note) { if (C_MAJOR_PC.has(((note.midi + candidate) % 12 + 12) % 12)) hits++; });
      if (hits > score) { score = hits; shift = candidate; }
    }
    var title = clean(options.title, 80) || 'Bài nhập MIDI';
    var lines = ['# title ' + title, '# bpm ' + bpm];
    var report = { imported: 0, folded: 0, adjusted: 0, quantized: 0, outside: 0, merged: 0, shift: shift, tempoChanges: info.tempoChanges, maxSteps: 0 };
    choices.forEach(function (choice, order) {
      var track = parsed.tracks[choice.index], steps = new Map(), last = -1;
      track.notes.forEach(function (note) {
        var beat = note.tick / parsed.ppq;
        if (excerpt && (beat < start || beat >= start + beats)) { report.outside++; return; }
        var position = (beat - start) * 2, step = Math.max(0, Math.round(position));
        if (excerpt && step >= beats * 2) { report.outside++; return; }
        if (step >= MAX_STEPS) error('Bài dài hơn 4.096 bước/lớp. Chọn “Chỉ một đoạn” hoặc xuất MIDI ngắn hơn; hệ thống không tự cắt bài.');
        var mapped = mapPitch(note.midi + shift);
        if (mapped.folded) report.folded++; if (mapped.rounded) report.adjusted++; if (Math.abs(position - step) > 0.04) report.quantized++;
        if (!steps.has(step)) steps.set(step, new Set());
        if (steps.get(step).has(mapped.key)) report.merged++;
        steps.get(step).add(mapped.key); last = Math.max(last, step); report.imported++;
      });
      if (last < 0) return;
      lines.push('# track ' + (clean(choice.name, 24) || 'Lớp ' + (order + 1)) + ' | ' + choice.inst + ' | oct ' + Number(choice.oct) + ' | vol ' + (order === 0 ? 90 : 75));
      var tokens = [];
      for (var i = 0; i <= last; i++) tokens.push(steps.has(i) ? Array.from(steps.get(i)).sort(function (a, b) { return a - b; }).map(function (key) { return LETTERS[key]; }).join('+') : '-');
      for (i = 0; i < tokens.length; i += 16) {
        var groups = []; for (var g = i; g < Math.min(i + 16, tokens.length); g += 4) groups.push(tokens.slice(g, Math.min(g + 4, tokens.length)).join(' '));
        lines.push(groups.join('  '));
      }
      report.maxSteps = Math.max(report.maxSteps, tokens.length);
    });
    var output = lines.join('\n'); if (output.length > 200000) error('Bản chuyển đổi vượt 200.000 ký tự. Hãy chọn ít lớp hơn hoặc chỉ một đoạn.');
    return { title: title, bpm: bpm, text: output, report: report, usable: report.imported > 0 };
  }
  function init(options) {
    var $ = function (id) { return document.getElementById(id); }, parsed = null, result = null, generation = 0;
    function invalidate() { options.stopPreview(); result = null; $('midiOutput').value = ''; $('midiShift').textContent = '—'; $('midiApply').disabled = $('midiCopy').disabled = $('midiPreview').disabled = true; }
    function renderTracks() {
      var table = document.createElement('table'); table.className = 'midi-track-table';
      var caption = document.createElement('caption'); caption.textContent = 'Chọn lớp, tên, nhạc cụ và quãng tám'; table.appendChild(caption);
      var head = document.createElement('thead'), heading = document.createElement('tr');
      ['Dùng', 'Tên lớp', 'Số nốt', 'Nhạc cụ', 'Quãng tám'].forEach(function (label) { var th = document.createElement('th'); th.scope = 'col'; th.textContent = label; heading.appendChild(th); }); head.appendChild(heading); table.appendChild(head);
      var body = document.createElement('tbody'), checked = 0;
      inspect(parsed).tracks.forEach(function (track) {
        var row = document.createElement('tr'); row.dataset.index = track.index;
        function cell(node) { var td = document.createElement('td'); td.appendChild(node); row.appendChild(td); }
        function input(className, label) { var node = document.createElement('input'); node.className = className; node.dataset.i = track.index; node.setAttribute('aria-label', label + ' ' + (track.index + 1)); return node; }
        var use = input('use-trk', 'Nhập lớp'); use.type = 'checkbox'; use.value = track.index; use.checked = !track.percussion && checked++ < 8; cell(use);
        var name = input('nm-trk', 'Tên lớp MIDI'); name.type = 'text'; name.maxLength = 24; name.value = track.name; cell(name);
        var count = document.createElement('span'); count.textContent = track.notes + ' nốt' + (track.percussion ? ' · trống' : ''); cell(count);
        function select(className, label, choices, value) {
          var node = document.createElement('select'); node.className = className; node.dataset.i = track.index; node.setAttribute('aria-label', label + ' ' + (track.index + 1));
          choices.forEach(function (entry) { var option = document.createElement('option'); option.value = entry[0]; option.textContent = entry[1]; node.appendChild(option); }); node.value = String(value); cell(node);
        }
        select('inst-trk', 'Nhạc cụ MIDI lớp', INSTRUMENTS, track.inst);
        select('oct-trk', 'Quãng tám MIDI lớp', [[-2, 'Thấp 2 quãng (-2)'], [-1, 'Thấp 1 quãng (-1)'], [0, 'Quãng gốc (0)'], [1, 'Cao 1 quãng (+1)']], track.oct);
        body.appendChild(row);
      }); table.appendChild(body); $('midiTracks').replaceChildren(table);
    }
    function generate() {
      invalidate(); if (!parsed) return;
      try {
        var tracks = Array.from($('midiTracks').querySelectorAll('.use-trk:checked')).map(function (node) {
          var row = node.closest('tr'); return { index: +node.value, name: row.querySelector('.nm-trk').value, inst: row.querySelector('.inst-trk').value, oct: +row.querySelector('.oct-trk').value };
        });
        result = convert(parsed, { tracks: tracks, title: $('midiTitle').value, bpm: +$('midiBpm').value, range: $('midiRange').value, startBeat: +$('midiStart').value, beats: +$('midiBeats').value });
        $('midiOutput').value = result.text; var r = result.report;
        $('midiShift').textContent = (r.shift > 0 ? '+' : '') + r.shift + ' bán âm (tự chọn theo các lớp đã chọn)';
        $('midiStatus').textContent = 'Đã tạo ' + tracks.length + ' lớp, ' + r.maxSteps + ' bước; xử lý ' + r.imported + ' nốt. Gấp quãng: ' + r.folded + '; quy nốt gần nhất: ' + r.adjusted + '; làm tròn nhịp: ' + r.quantized + '; gộp nốt trùng: ' + r.merged +
          (r.outside ? '; ngoài đoạn đã chọn: ' + r.outside : '') + '. ' + (r.tempoChanges ? 'MIDI có đổi tempo; bản chuyển dùng một BPM. ' : '') + 'Trường độ/pedal không giữ nguyên. ' + (result.usable ? 'Nghe thử trước khi áp dụng.' : 'Đoạn đã chọn không có nốt.');
        $('midiApply').disabled = $('midiCopy').disabled = $('midiPreview').disabled = !result.usable;
      } catch (failure) { $('midiStatus').textContent = failure.message; }
    }
    $('midiFile').addEventListener('change', async function () {
      var version = ++generation, file = this.files[0]; parsed = null; invalidate(); $('midiTracks').textContent = ''; $('midiSummary').textContent = 'Chưa tải file.'; $('midiShift').textContent = '—'; $('midiConvert').disabled = true;
      if (!file) return;
      try {
        if (!/\.midi?$/i.test(file.name) || file.size > MAX_BYTES) error('Chọn file .mid/.midi tối đa 1 MB.');
        $('midiStatus').textContent = 'Đang đọc MIDI tại máy…';
        var buffer = await file.arrayBuffer(); if (version !== generation) return;
        parsed = parseMidi(buffer); var info = inspect(parsed);
        $('midiTitle').value = clean(file.name.replace(/\.midi?$/i, ''), 80); $('midiBpm').value = info.bpm;
        $('midiRange').value = 'all'; $('midiExcerpt').hidden = true; $('midiStart').value = 0;
        $('midiSummary').textContent = 'File có ' + info.tracks.length + ' track chứa nốt (' + info.tracks.filter(function (track) { return !track.percussion; }).length + ' lớp giai điệu/hòa âm), ' + info.notes + ' nốt; BPM đọc từ file: ' + Math.round(info.originalBpm) + ', BPM chọn: ' + info.bpm + '.';
        renderTracks(); $('midiConvert').disabled = false; generate();
      } catch (failure) { if (version !== generation) return; parsed = null; $('midiStatus').textContent = failure.message || 'Không đọc được file MIDI.'; }
    });
    $('midiOptions').addEventListener('input', function () { invalidate(); $('midiStatus').textContent = 'Đã đổi tùy chọn. Bấm Tạo bản nhạc để cập nhật kết quả.'; });
    $('midiOptions').addEventListener('change', function () { $('midiExcerpt').hidden = $('midiRange').value !== 'excerpt'; generate(); });
    $('midiConvert').addEventListener('click', generate);
    $('midiApply').addEventListener('click', function () { if (result && result.usable) options.stage(result); });
    $('midiCopy').addEventListener('click', function () { if (result && result.usable) options.copy(result.text, $('midiOutput')); });
    $('midiPreview').addEventListener('click', function () { if (result && result.usable) options.preview(result); });
  }
  return { parseMidi: parseMidi, inspect: inspect, defaults: defaults, mapPitch: mapPitch, convert: convert, init: init, maxSteps: MAX_STEPS };
});
