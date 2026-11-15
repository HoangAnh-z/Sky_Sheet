(function () {
  'use strict';
  window.SkyAudio = function (getSong, getActiveTrack) {
  var INSTS = window.SKY_INSTRUMENTS;
  var ctx = null, master = null, samples = {}, voices = new Set();
  var SEMI = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 23, 24];
  function freq(i) { return 261.63 * Math.pow(2, SEMI[i] / 12); }
  function ensureAudio() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      var comp = ctx.createDynamicsCompressor();
      master = ctx.createGain(); master.gain.value = 0.6;
      master.connect(comp); comp.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume().catch(function () {});
    return ctx;
  }
  var nbuf = null, buzzC = null;
  function noiseBuf() {
    if (!nbuf) { nbuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); var d = nbuf.getChannelData(0); for (var k = 0; k < d.length; k++) d[k] = Math.random() * 2 - 1; }
    return nbuf;
  }
  function buzzCurve() {
    if (!buzzC) { buzzC = new Float32Array(257); for (var k = 0; k < 257; k++) buzzC[k] = Math.tanh(2.2 * (k / 128 - 1)); }
    return buzzC;
  }
  function audible(tr) {
    var solo = getSong().tracks.some(function (x) { return x.solo; });
    return !tr.mute && (!solo || !!tr.solo);
  }
  function bus(tr) {
    if (!tr.bus) { tr.bus = ctx.createGain(); tr.bus.connect(master); }
    tr.bus.gain.value = audible(tr) ? tr.vol / 100 : 0;
    return tr.bus;
  }
  function refreshBus() { if (ctx) getSong().tracks.forEach(function (tr) { if (tr.bus) tr.bus.gain.value = audible(tr) ? tr.vol / 100 : 0; }); }
  function voice(i, t, tr, dur) {
    tr = tr || getActiveTrack();
    if (!audible(tr)) return;
    if (samples[tr.inst]) { sampleVoice(i, t, tr, dur); return; }
    var ins = INSTS[tr.inst], f = freq(i) * Math.pow(2, tr.oct), g = ctx.createGain(), peak = 0.3, end;
    g.connect(bus(tr));
    var token = { gain: g, sources: [] }; voices.add(token);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + ins.a);
    if (ins.sus) { var d = Math.max(dur || 0.6, ins.a + 0.12); end = t + d + 0.1; g.gain.setValueAtTime(peak, t + d); }
    else end = t + ins.len;
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    var dst = g, mix = ctx.createGain(), vg = null;
    if (ins.lp) { var lp = ctx.createBiquadFilter(); lp.frequency.value = ins.lp; lp.connect(g); dst = lp; }
    if (ins.buzz) { var ws = ctx.createWaveShaper(); ws.curve = buzzCurve(); ws.connect(dst); mix.connect(ws); mix.gain.value = 0.5; }
    else mix.connect(dst);
    if (ins.vib) {
      var lfo = ctx.createOscillator(); vg = ctx.createGain();
      lfo.frequency.value = ins.vib[0]; vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(ins.vib[1], t + 0.35);
      lfo.connect(vg); token.sources.push(lfo); lfo.start(t); lfo.stop(end + 0.05);
    }
    ins.parts.forEach(function (p) {
      var o = ctx.createOscillator(), og = ctx.createGain();
      o.type = p[2]; o.frequency.value = f * p[0]; og.gain.value = p[1];
      if (vg) vg.connect(o.detune);
      if (ins.scoop) { o.detune.setValueAtTime(-35, t); o.detune.linearRampToValueAtTime(0, t + 0.07); }
      o.connect(og); og.connect(mix); token.sources.push(o); o.start(t); o.stop(end + 0.05);
    });
    if (ins.br) {
      var ns = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), ng = ctx.createGain();
      ns.buffer = noiseBuf(); ns.loop = true; bp.type = 'bandpass'; bp.frequency.value = Math.min(f * 3, 7000); bp.Q.value = 1.4; ng.gain.value = ins.br;
      ns.connect(bp); bp.connect(ng); ng.connect(g); token.sources.push(ns); ns.start(t); ns.stop(end + 0.05);
    }
    var remaining = token.sources.length;
    token.sources.forEach(function (source) { source.onended = function () { source.disconnect(); if (--remaining === 0) { voices.delete(token); g.disconnect(); } }; });
  }
  function tick() {
    if (!ctx) return;
    var t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'square'; o.frequency.value = 1400;
    g.gain.setValueAtTime(0.06, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.05);
  }


  function stopAll() {
    if (!ctx) return;
    voices.forEach(function (v) {
      v.gain.gain.cancelScheduledValues(ctx.currentTime);
      v.gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.015);
      v.sources.forEach(function (s) { try { s.stop(ctx.currentTime + 0.06); } catch (_) {} });
    });
    voices.clear();
  }
  function sampleVoice(i, t, tr, dur) {
    var sample = samples[tr.inst], source = ctx.createBufferSource(), gain = ctx.createGain();
    source.buffer = sample.buffer;
    source.playbackRate.value = Math.pow(2, (60 + SEMI[i] + tr.oct * 12 - sample.rootMidi) / 12);
    var length = Math.min(sample.buffer.duration / source.playbackRate.value, dur || 6);
    source.connect(gain); gain.connect(bus(tr));
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.65, t + Math.min(0.005, length / 4));
    gain.gain.setValueAtTime(0.65, t + Math.max(Math.min(0.005, length / 4), length - 0.04));
    gain.gain.linearRampToValueAtTime(0.0001, t + length);
    var token = { gain: gain, sources: [source] }; voices.add(token);
    source.onended = function () { voices.delete(token); source.disconnect(); gain.disconnect(); };
    source.start(t); source.stop(t + length);
  }
  var previewTrack = { inst: 'harp', oct: 0, vol: 75, mute: false, solo: true, bus: null };
  return {
    ensureAudio: ensureAudio, voice: voice, audible: audible, refreshBus: refreshBus, tick: tick, stopAll: stopAll,
    setSample: function (id, buffer, rootMidi) { samples[id] = { buffer: buffer, rootMidi: rootMidi }; },
    removeSample: function (id) { delete samples[id]; },
    preview: function (id) { ensureAudio(); previewTrack.inst = id; voice(0, ctx.currentTime, previewTrack); }
  };
  };
})();
