(function () {
  'use strict';
  window.SkySamples = function (audio, instruments, toast) {
    var $ = function (id) { return document.getElementById(id); };
    var metadata = {}, versions = {}, busy = {};
    var config = window.SKY_AUDIO_CONFIG || {};
    var dbPromise = new Promise(function (resolve) {
      try {
        var request = indexedDB.open('phongnhacsky.audio', 1);
        request.onupgradeneeded = function () { request.result.createObjectStore('samples', { keyPath: 'id' }); };
        request.onsuccess = function () { resolve(request.result); };
        request.onerror = request.onblocked = function () { resolve(null); };
      } catch (_) { resolve(null); }
    });
    function store(mode, operation) {
      return dbPromise.then(function (db) {
        if (!db) throw new Error('Không thể truy cập bộ nhớ trình duyệt');
        return new Promise(function (resolve, reject) {
          var tx = db.transaction('samples', mode), request = operation(tx.objectStore('samples'));
          tx.oncomplete = function () { resolve(request.result); };
          tx.onerror = tx.onabort = function () { reject(tx.error || new Error('Lỗi lưu bộ âm')); };
        });
      });
    }
    function refresh() {
      var id = $('sampleInst').value, info = metadata[id], kit = id === 'drums';
      if (!kit && info && !Array.from($('sampleRoot').options).some(function (o) { return +o.value === info.rootMidi; })) {
        var option = document.createElement('option'); option.value = info.rootMidi; option.textContent = 'MIDI ' + info.rootMidi; $('sampleRoot').appendChild(option);
      }
      $('sampleRoot').value = info && !kit ? info.rootMidi : 60;
      $('sampleFile').disabled = !!busy[id]; $('resetSample').disabled = !!busy[id];
      $('previewSample').disabled = !!busy[id]; $('sampleRoot').disabled = !!busy[id];
      $('sampleFile').closest('.sample-drop').hidden = $('sampleRoot').closest('.field').hidden = $('resetSample').hidden = kit;
      $('previewSample').textContent = kit ? 'Nghe tiếng kick' : 'Nghe mẫu C4';
      $('previewSynthSample').hidden = !info || kit;
      $('sampleStatus').textContent = busy[id] ? 'Đang nạp mẫu âm…' : info
        ? info.name + ' · ' + (info.saved ? 'đã lưu trên trình duyệt' : info.shared ? 'bộ âm của trang' + (info.count ? ' (' + info.count + (kit ? ' tiếng)' : ' nốt gốc)') : '') : 'chỉ trong phiên này')
        : kit ? 'Đang dùng tiếng gõ dự phòng.' : 'Đang dùng âm tổng hợp. Chọn nốt gốc trước khi nạp file.';
    }
    async function decode(data) {
      var ctx = audio.ensureAudio(false), buffer = await ctx.decodeAudioData(data.slice(0));
      if (buffer.duration < 0.03 || buffer.duration > 10) throw new Error('Mẫu âm cần dài từ 0,03 đến 10 giây');
      return buffer;
    }
    async function loadConfigured(id) {
      var entry = config[id];
      if (!entry || !instruments[id]) return;
      var version = versions[id] = (versions[id] || 0) + 1;
      busy[id] = true; refresh();
      try {
        var files = entry.samples || [entry];
        if (!files.length) throw new Error('Bộ âm trống');
        var notes = await Promise.all(files.map(async function (file) {
          if (!Number.isInteger(file.rootMidi) || file.rootMidi < 0 || file.rootMidi > 127) throw new Error('Nốt gốc không hợp lệ');
          var response = await fetch(file.url);
          if (!response.ok) throw new Error('Không tải được file (' + response.status + ')');
          var data = await response.arrayBuffer();
          if (data.byteLength > 10 * 1024 * 1024) throw new Error('File vượt quá 10 MB');
          return { buffer: await decode(data), rootMidi: file.rootMidi };
        }));
        if (versions[id] !== version) return;
        if (entry.samples) audio.setSampleBank(id, notes, entry.mode);
        else audio.setSample(id, notes[0].buffer, notes[0].rootMidi);
        var root = notes.find(function (sample) { return sample.rootMidi === 60; }) || notes[0];
        metadata[id] = { name: entry.name || files[0].url.split('/').pop(), rootMidi: root.rootMidi, shared: true, count: notes.length > 1 ? notes.length : 0 };
      } catch (error) {
        if (versions[id] === version) toast('Mẫu ' + instruments[id].n + ': ' + error.message + '. Dùng âm tổng hợp.');
      } finally { if (versions[id] === version) { busy[id] = false; refresh(); } }
    }
    Object.keys(instruments).forEach(function (id) {
      var option = document.createElement('option'); option.value = id; option.textContent = instruments[id].n;
      $('sampleInst').appendChild(option);
    });
    $('sampleInst').addEventListener('change', refresh);
    $('sampleFile').addEventListener('change', async function () {
      var file = this.files[0], id = $('sampleInst').value, rootMidi = +$('sampleRoot').value;
      if (!file || id === 'drums') return;
      var version = versions[id] = (versions[id] || 0) + 1;
      busy[id] = true; refresh();
      try {
        if (file.size > 10 * 1024 * 1024) throw new Error('File vượt quá 10 MB');
        var data = await file.arrayBuffer(), buffer = await decode(data);
        if (versions[id] !== version) return;
        audio.setSample(id, buffer, rootMidi);
        metadata[id] = { name: file.name, rootMidi: rootMidi, saved: false };
        try {
          await store('readwrite', function (s) { return s.put({ id: id, name: file.name, rootMidi: rootMidi, data: data }); });
          metadata[id].saved = true;
          toast('Đã thay mẫu ' + instruments[id].n + ' và lưu trên trình duyệt');
        } catch (_) { toast('Đã thay âm cho phiên này; trình duyệt không cho lưu mẫu'); }
      } catch (error) { toast('Không nạp được mẫu: ' + error.message); }
      finally { if (versions[id] === version) { busy[id] = false; refresh(); } this.value = ''; }
    });
    $('resetSample').addEventListener('click', async function () {
      var id = $('sampleInst').value;
      versions[id] = (versions[id] || 0) + 1; busy[id] = true; refresh();
      audio.removeSample(id); delete metadata[id];
      var persisted = true;
      try { await store('readwrite', function (s) { return s.delete(id); }); } catch (_) { persisted = false; }
      busy[id] = false;
      await loadConfigured(id); refresh();
      toast(persisted ? 'Đã khôi phục âm mặc định của trang' : 'Đã khôi phục cho phiên này; không xóa được mẫu đã lưu');
    });
    $('previewSample').addEventListener('click', function () { audio.preview($('sampleInst').value); });
    $('previewSynthSample').addEventListener('click', function () { audio.preview($('sampleInst').value, true); });
    // Restore local overrides before shared configuration. Mutations win over pending startup loads.
    store('readonly', function (s) { return s.getAll(); }).catch(function () { return []; }).then(async function (records) {
      var restored = new Set();
      await Promise.all(records.filter(function (record) { return instruments[record.id]; }).map(async function (record) {
        var id = record.id;
        if (versions[id]) { restored.add(id); return; }
        var version = versions[id] = 1;
        busy[id] = true; refresh();
        try {
          var buffer = await decode(record.data);
          if (versions[id] !== version) return;
          audio.setSample(id, buffer, record.rootMidi);
          metadata[id] = { name: record.name, rootMidi: record.rootMidi, saved: true }; restored.add(id);
        } catch (_) { if (versions[id] === version) { versions[id] = 0; busy[id] = false; refresh(); } toast('Không khôi phục được mẫu ' + instruments[id].n); }
        finally { if (versions[id] === version) { busy[id] = false; refresh(); } }
      }));
      await Promise.all(Object.keys(config).filter(function (id) { return !restored.has(id) && !versions[id]; }).map(loadConfigured));
    });
    refresh();
  };
})();
