// Mẫu thu CC0 từ FreePats và Versilian. Xem docs/AUDIO-SOURCES.md.
(function () {
  function bank(folder, id, name, roots, mode) {
    return { name: name, mode: mode, samples: roots.map(function (rootMidi) {
      return { url: 'assets/audio/' + folder + '/' + id + '-' + rootMidi + '.mp3', rootMidi: rootMidi };
    }) };
  }
  window.SKY_AUDIO_CONFIG = {
    piano: bank('freepats', 'piano', 'FreePats Upright Piano KW', [36,42,48,54,60,66,72,78,84,90,96]),
    guitar: bank('freepats', 'guitar', 'FreePats Spanish Classical Guitar', [36,43,48,54,60,66,72,78,84]),
    harp: bank('versilian', 'harp', 'VSCO 2 CE · Concert Harp', [38,45,52,59,65,72,79,86,93]),
    flute: bank('versilian', 'flute', 'VSCO 2 CE · Flute', [60,64,69,72,76,81,84,88,93,96], 'sustain'),
    strings: bank('versilian', 'strings', 'VSCO 2 CE · Cello & Violin Sections', [47,53,57,60,64,67,72,76,79,83,86], 'sustain'),
    drums: bank('versilian', 'drums', 'VCSL · Bộ trống cơ bản', window.SkyDrums.labels.map(function (_, key) { return key; }), 'kit')
  };
})();
