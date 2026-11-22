(function () {
  'use strict';
  window.SkyAudio = function (getSong, getActiveTrack, sampleLibrary) {
  var INSTS = window.SKY_INSTRUMENTS;
  var ctx = null, master = null, samples = sampleLibrary || {}, voices = new Set();
  var SEMI = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 23, 24];
  function freq(i) { return 261.63 * Math.pow(2, SEMI[i] / 12); }
  function ensureAudio(resume) {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      var comp = ctx.createDynamicsCompressor();
      master = ctx.createGain(); master.gain.value = 0.6;
      master.connect(comp); comp.connect(ctx.destination);
    }
    if (resume !== false && (ctx.state === 'suspended' || ctx.state === 'interrupted')) ctx.resume().catch(function () {});
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
  function voice(i, t, tr, dur, synthesized) {
    tr = tr || getActiveTrack();
    if (!audible(tr)) return;
    if (!synthesized && samples[tr.inst]) { sampleVoice(i, t, tr, dur); return; }
    if (tr.inst === 'drums') { fallbackDrum(i, t, tr); return; }
    var ins = INSTS[tr.inst], f = freq(i) * Math.pow(2, tr.oct), g = ctx.createGain(), peak = 0.3, end;
    g.connect(bus(tr));
    var token = { gain: g, sources: [], track: tr, time: t }; voices.add(token);
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
    voices.forEach(stopVoice);
  }
  function cancelScheduledFrom(time) {
    voices.forEach(function (voice) { if (voice.time >= time) stopVoice(voice); });
  }
  function stopVoice(voice) {
    voice.gain.gain.cancelScheduledValues(ctx.currentTime);
    voice.gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.015);
    voice.sources.forEach(function (source) { try { source.stop(ctx.currentTime + 0.06); } catch (_) {} });
    voices.delete(voice);
  }
  function fallbackDrum(i, t, track) {
    var low = i === 0 || i === 6 || i === 7;
    var duration = low ? 0.18 : i === 3 || i === 8 || i === 9 ? 0.26 : 0.08;
    var source = low ? ctx.createOscillator() : ctx.createBufferSource();
    var gain = ctx.createGain(), filter;
    if (low) {
      source.frequency.setValueAtTime(i === 0 ? 135 : i === 6 ? 190 : 240, t);
      source.frequency.exponentialRampToValueAtTime(48, t + duration);
      source.connect(gain);
    } else {
      source.buffer = noiseBuf(); source.loop = true;
      filter = ctx.createBiquadFilter();
      filter.type = 'bandpass'; filter.frequency.value = i === 1 ? 1400 : 6500;
      source.connect(filter); filter.connect(gain);
    }
    gain.connect(bus(track));
    gain.gain.setValueAtTime(low ? 0.35 : 0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    var token = { gain: gain, sources: [source], track: track, time: t }; voices.add(token);
    source.onended = function () {
      voices.delete(token); source.disconnect(); gain.disconnect();
      if (filter) filter.disconnect();
    };
    source.start(t); source.stop(t + duration);
  }
  function sampleVoice(i, t, tr, dur) {
    var bank = samples[tr.inst], midi = bank.mode === 'kit' ? i : 60 + SEMI[i] + tr.oct * 12;
    var sample = bank.notes.reduce(function (closest, candidate) {
      return Math.abs(midi - candidate.rootMidi) < Math.abs(midi - closest.rootMidi) ? candidate : closest;
    });
    var source = ctx.createBufferSource(), gain = ctx.createGain();
    source.buffer = sample.buffer;
    source.playbackRate.value = Math.pow(2, (midi - sample.rootMidi) / 12);
    var release = bank.mode === 'sustain' ? 0.15 : 0.04;
    var limit = bank.mode === 'sustain' ? (dur || 0.6) + release : bank.recorded ? 6 : dur || 6;
    var length = Math.min(sample.buffer.duration / source.playbackRate.value, limit);
    var attack = Math.min(0.005, length / 4);
    source.connect(gain); gain.connect(bus(tr));
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.65, t + attack);
    gain.gain.setValueAtTime(0.65, t + Math.max(attack, length - release));
    gain.gain.linearRampToValueAtTime(0.0001, t + length);
    var token = { gain: gain, sources: [source], track: tr, time: t }; voices.add(token);
    source.onended = function () { voices.delete(token); source.disconnect(); gain.disconnect(); };
    source.start(t); source.stop(t + length);
  }
  var previewTrack = { inst: 'harp', oct: 0, vol: 75, mute: false, solo: true, bus: null };
  return {
    ensureAudio: ensureAudio, voice: voice, audible: audible, refreshBus: refreshBus, tick: tick, stopAll: stopAll,
    cancelScheduledFrom: cancelScheduledFrom,
    sampleLibrary: samples,
    setSample: function (id, buffer, rootMidi) { samples[id] = { notes: [{ buffer: buffer, rootMidi: rootMidi }] }; },
    setSampleBank: function (id, notes, mode) { samples[id] = { notes: notes, mode: mode, recorded: true }; },
    removeSample: function (id) { delete samples[id]; },
    preview: function (id, synthesized) {
      ensureAudio();
      voices.forEach(function (voice) { if (voice.track === previewTrack) stopVoice(voice); });
      previewTrack.inst = id;
      voice(0, ctx.currentTime, previewTrack, undefined, synthesized);
    }
  };
  };
})();
