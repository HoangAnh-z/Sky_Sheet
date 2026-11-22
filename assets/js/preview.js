(function () {
  'use strict';
  window.SkyPreview = function (parse, notify, sampleLibrary) {
    var temporary = null, engine = null, context = null, timer = null, endTimer = null, activeButton = null;
    function stop() {
      clearInterval(timer); clearTimeout(endTimer); timer = endTimer = null;
      if (engine) engine.stopAll();
      if (temporary) temporary.tracks.forEach(function (track) { if (track.bus) { track.bus.disconnect(); track.bus = null; } });
      if (activeButton) { activeButton.textContent = activeButton.dataset.previewLabel || 'Nghe thử'; activeButton.setAttribute('aria-pressed', 'false'); }
      activeButton = null;
    }
    function play(data, button) {
      if (activeButton === button) { stop(); return; }
      stop();
      var parsed = parse(data.text);
      if (parsed.tracks.length > 8 || parsed.count > 4096 || !parsed.count) { notify('Bản nghe thử cần 1–8 lớp, tối đa 4.096 bước.'); return; }
      temporary = { bpm: data.bpm || parsed.bpm || 100, tracks: parsed.tracks };
      if (!engine) engine = new window.SkyAudio(function () { return temporary; }, function () { return temporary.tracks[0]; }, sampleLibrary);
      context = engine.ensureAudio();
      if (!context) return;
      var duration = 60 / temporary.bpm / 2, step = 0, time = context.currentTime + 0.04, finish = context.currentTime + 30;
      activeButton = button; button.dataset.previewLabel = button.textContent; button.textContent = 'Dừng nghe thử'; button.setAttribute('aria-pressed', 'true');
      function tick() {
        while (step < parsed.count && time < context.currentTime + 0.15 && time < finish) {
          temporary.tracks.forEach(function (track) { (track.steps[step] || []).forEach(function (key) { engine.voice(key, time, track, duration * 0.95); }); });
          time += duration; step++;
        }
        if (step >= parsed.count || time >= finish) { clearInterval(timer); timer = null; endTimer = setTimeout(stop, Math.max(0, (time - context.currentTime + 0.4) * 1000)); }
      }
      timer = setInterval(tick, 40); tick();
    }
    window.addEventListener('pagehide', stop);
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); });
    return { play: play, stop: stop };
  };
})();
