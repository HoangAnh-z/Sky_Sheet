(function (root) {
  'use strict';
  // Order matches QWERT / ASDFG / ZXCVB. The second column lists General MIDI aliases.
  var kit = [
    ['Kick', [35,36]], ['Snare', [38,40]], ['HH kín', [42]], ['HH mở', [46]], ['HH đạp', [44]],
    ['Rim', [37]], ['Tom trầm', [41,43,45]], ['Tom cao', [47,48,50]], ['Crash', [49,52,55,57]], ['Ride', [51,53,59]],
    ['Tamb', [54]], ['Shaker', [69,70,82]], ['Claves', [75]], ['Wood', [76,77]], ['Conga', [62,63,64]]
  ];
  var byMidi = new Map();
  kit.forEach(function (piece, index) { piece[1].forEach(function (note) { byMidi.set(note, index); }); });
  var api = {
    labels: kit.map(function (piece) { return piece[0]; }),
    midiKey: function (note) { return byMidi.get(note); }
  };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SkyDrums = api;
})(typeof window !== 'undefined' ? window : globalThis);
