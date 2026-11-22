const assert = require('node:assert/strict');
const { Midi } = require('@tonejs/midi');
const { parseMidi, inspect, convert, mapPitch } = require('../assets/js/midi-import.js');
const checks = [];
function check(name, fn) { fn(); checks.push(name); }
function fixture(notes, extra) {
  const midi = new Midi(); midi.header.setTempo(100);
  const track = midi.addTrack(); track.name = 'Melody';
  notes.forEach(note => track.addNote({ durationTicks: midi.header.ppq / 2, ...note }));
  if (extra) extra(midi);
  return parseMidi(midi.toArray());
}
// Raw SMF fixtures cover encodings that a high-level writer normalizes away.
function raw(events, { division = 480, format = 0 } = {}) {
  const data = Buffer.from([...events, 0, 255, 47, 0]);
  const header = Buffer.from([77,84,104,100,0,0,0,6,0,format,0,1,division >> 8,division & 255,77,84,114,107,0,0,0,0]);
  header.writeUInt32BE(data.length, 18); return Buffer.concat([header, data]);
}
const options = { tracks: [0], title: 'Test' };
check('Reference auto-transposition tie behavior, chords, rests and metadata', () => {
  const result = convert(fixture([{ midi: 60, ticks: 0 }, { midi: 64, ticks: 0 }, { midi: 62, ticks: 480 }]), options);
  assert.equal(result.usable, true); assert.equal(result.report.shift, -5);
  assert.equal(result.text, '# title Test\n# bpm 100\n# track Melody | piano | oct 0 | vol 90\nT+S - A');
});
check('Chromatic notes are approximated and counted without blocking upload', () => {
  const result = convert(fixture(Array.from({ length: 12 }, (_, i) => ({ midi: 60 + i, ticks: i * 240 }))), options);
  assert.equal(result.usable, true); assert.equal(result.report.imported, 12);
  assert.equal(result.report.shift, -6); assert.equal(result.report.adjusted, 5);
});
check('Pitch folding and nearest-natural ties match the reference', () => {
  assert.deepEqual(mapPitch(36), { key: 0, folded: true, rounded: false });
  assert.deepEqual(mapPitch(85), { key: 7, folded: true, rounded: true });
  assert.deepEqual(mapPitch(61), { key: 0, folded: false, rounded: true });
  assert.deepEqual(mapPitch(84), { key: 14, folded: false, rounded: false });
});
check('Layer defaults and editable name/instrument/octave reach output headers', () => {
  const midi = fixture([{ midi: 36, ticks: 0 }], value => value.addTrack().addNote({ midi: 72, ticks: 0, durationTicks: 240 }));
  const info = inspect(midi);
  assert.equal(info.tracks[0].inst, 'bass'); assert.equal(info.tracks[0].oct, -1); assert.equal(info.tracks[1].inst, 'strings');
  const result = convert(midi, { tracks: [{ index: 0, name: 'Bass | mới', inst: 'guitar', oct: -2 }, { index: 1, name: 'Lead', inst: 'flute', oct: 1 }] });
  assert.match(result.text, /# track Bass \/ mới \| guitar \| oct -2 \| vol 90/);
  assert.match(result.text, /# track Lead \| flute \| oct 1 \| vol 75/);
});
check('Whole-file default retains 1,367 steps beyond the old excerpt/preview limits', () => {
  const result = convert(fixture([{ midi: 60, ticks: 0 }, { midi: 62, ticks: 480 * 683 }]), options);
  assert.equal(result.report.maxSteps, 1367); assert.equal(result.report.imported, 2); assert.equal(result.report.outside, 0);
  const lines = result.text.split('\n').filter(line => !line.startsWith('#'));
  assert.equal(lines[0].split(/\s+/).length, 16); assert.equal(lines.join(' ').split(/\s+/).length, 1367);
});
check('Explicit excerpts rebase positions and report excluded notes; empty excerpts stay unusable', () => {
  const midi = fixture([{ midi: 60, ticks: 0 }, { midi: 64, ticks: 960 }, { midi: 67, ticks: 1920 }]);
  const result = convert(midi, { ...options, range: 'excerpt', startBeat: 2, beats: 1 });
  assert.equal(result.report.imported, 1); assert.equal(result.report.outside, 2); assert.equal(result.report.maxSteps, 1);
  assert.equal(convert(midi, { ...options, range: 'excerpt', startBeat: 10, beats: 1 }).usable, false);
});
check('Oversized timeline fails without silently cutting and allows explicit excerpts', () => {
  const midi = fixture([{ midi: 60, ticks: 0 }, { midi: 62, ticks: 480 * 2048 }]);
  assert.throws(() => convert(midi, options), /không tự cắt/);
  assert.equal(convert(midi, { ...options, range: 'excerpt', beats: 128 }).report.outside, 1);
  assert.equal(convert(fixture([{ midi: 60, ticks: 480 * 2047.5 }]), options).report.maxSteps, 4096);
});
check('Beat quantization and merged duplicate pitches are counted', () => {
  assert.equal(convert(fixture([{ midi: 60, ticks: 0 }, { midi: 60, ticks: 120 }]), options).report.quantized, 1);
  assert.equal(convert(fixture([{ midi: 36, ticks: 0 }, { midi: 48, ticks: 0 }]), options).report.merged, 1);
});
check('Tempo events follow reference final BPM, report tempo maps and clamp supported range', () => {
  const midi = fixture([{ midi: 60, ticks: 0 }], value => { value.header.tempos.push({ ticks: 480, bpm: 80 }); value.header.update(); });
  assert.equal(midi.bpm, 80); assert.equal(convert(midi, options).report.tempoChanges, true);
  assert.equal(fixture([{ midi: 60, ticks: 0 }], value => value.header.setTempo(300)).bpm, 220);
});
check('Type 0 preserves physical tracks with multiple channels and ignores velocity-zero note-ons', () => {
  const midi = parseMidi(raw([0,144,60,100,0,145,64,100,0,145,67,0]));
  assert.equal(midi.tracks.length, 1); assert.equal(midi.tracks[0].notes.length, 2); assert.equal(midi.tracks[0].isDrum, false);
  assert.equal(parseMidi(raw([0,153,36,100])).tracks[0].isDrum, true);
});
check('Running status and SysEx payloads leave subsequent event bytes aligned', () => {
  const midi = parseMidi(raw([0,144,60,100,0,62,90,0,240,3,1,2,247,0,144,64,100]));
  assert.deepEqual(midi.tracks[0].notes.map(note => note.midi), [60,62,64]);
});
check('General MIDI percussion maps individual hits without changing melodic transposition', () => {
  const midi = fixture([{ midi: 60, ticks: 0 }, { midi: 64, ticks: 0 }], value => {
    const kit = value.addTrack(); kit.channel = 9;
    [36, 38, 42, 46, 100].forEach(note => kit.addNote({ midi: note, ticks: 0, durationTicks: 240 }));
  });
  assert.equal(inspect(midi).tracks[1].inst, 'drums');
  const result = convert(midi, { tracks: [0, 1] });
  assert.equal(result.report.shift, convert(midi, { tracks: [0] }).report.shift);
  assert.equal(result.report.unsupportedDrums, 1);
  assert.match(result.text, /\| drums \| oct 0 \| vol 75\nQ\+W\+E\+R$/);
  assert.equal(convert(midi, { tracks: [1] }).report.shift, 0);
});
check('UTF-8 metadata is decoded and cannot inject header lines', () => {
  const name = Buffer.from('Giai điệu\n# track | X');
  const midi = parseMidi(raw([0,255,3,name.length,...name,0,144,60,100]));
  assert.match(midi.tracks[0].name, /^Giai điệu/);
  const result = convert(midi, { ...options, title: 'Title\n# bpm 200' });
  assert.equal(result.text.split('\n').filter(line => line.startsWith('# track ')).length, 1);
  assert.equal(result.text.split('\n').filter(line => line.startsWith('# bpm ')).length, 1);
});
check('Track count, octave, instrument, BPM and excerpt limits are validated', () => {
  const midi = fixture([{ midi: 60, ticks: 0 }]);
  for (const override of [{ tracks: [] }, { tracks: [0,0] }, { tracks: [9] }, { range: 'excerpt', beats: 0 }, { range: 'excerpt', beats: 2049 }, { range: 'excerpt', startBeat: -1 }, { bpm: 10 }, { tracks: [{ index: 0, inst: 'unknown', oct: 0 }] }, { tracks: [{ index: 0, inst: 'piano', oct: 2 }] }]) assert.throws(() => convert(midi, { ...options, ...override }));
  const nine = fixture([{ midi: 60, ticks: 0 }], value => { for (let i = 0; i < 8; i++) value.addTrack().addNote({ midi: 60, ticks: 0, durationTicks: 240 }); });
  assert.throws(() => convert(nine, { tracks: Array.from({ length: 9 }, (_, i) => i) }), /1 đến 8/);
});
check('Malformed, empty, unsupported SMPTE/type 2 and over-limit binaries fail readably', () => {
  assert.throws(() => parseMidi(Buffer.from('not MIDI')), /MIDI/);
  const valid = raw([0,144,60,100]);
  assert.throws(() => parseMidi(valid.subarray(0, valid.length - 1)), /thiếu/);
  assert.throws(() => parseMidi(raw([0,60,100])), /running status/);
  assert.throws(() => parseMidi(raw([0,144,60,200])), /kênh/);
  assert.throws(() => parseMidi(raw([0,144,60,100], { division: 0xE728 })), /SMPTE/);
  assert.throws(() => parseMidi(raw([0,144,60,100], { format: 2 })), /type 2/);
  assert.throws(() => parseMidi(raw([])), /không có nốt/);
  assert.throws(() => parseMidi(Buffer.alloc(1024 * 1024 + 1)), /1 MB/);
  assert.throws(() => parseMidi(raw(Array.from({ length: 20001 }, () => [0,144,60,100]).flat())), /20.000/);
});
console.log(checks.map((name, i) => `${i + 1}. PASS ${name}`).join('\n'));
console.log(`\n${checks.length} MIDI checks passed using actual binary files.`);
