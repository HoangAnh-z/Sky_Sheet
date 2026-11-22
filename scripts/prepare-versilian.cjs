// Regenerate the web-ready subset from pinned CC0 recordings.
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const orchestra = 'VSCO-2-CE/440300901dfe9275fd84e0b7763af1f8443ae62e';
const library = 'VCSL/c1ea7bcc3c7309650ab0da9d15c9cd1fbc4a4c7e';
const idiophones = 'Idiophones/Struck Idiophones';
const drums = 'Membranophones/Struck Membranophones';
const banks = {
  harp: { repo: orchestra, length: 3.6, peak: -5, notes: [[38,'D2'],[45,'A2'],[52,'E3'],[59,'B3'],[65,'F4'],[72,'C5'],[79,'G5'],[86,'D6'],[93,'A6']]
    .map(([key,note]) => [key, 'Strings/Harp/KSHarp_' + note + '_mf.wav']) },
  // Flute and section filenames use an octave numbering convention with middle C labeled C3.
  flute: { repo: orchestra, length: 4.2, peak: -6, notes: [[60,'C3'],[64,'E3'],[69,'A3'],[72,'C4'],[76,'E4'],[81,'A4'],[84,'C5'],[88,'E5'],[93,'A5'],[96,'C6']]
    .map(([key,note]) => [key, 'Woodwinds/Flute/susNV/LDFlute_susNV_' + note + '_v1_1.wav']) },
  strings: { repo: orchestra, length: 4.2, peak: -6, notes: [
    ...[[47,'B1'],[53,'F2'],[57,'A2'],[60,'C3'],[64,'E3'],[67,'G3']].map(([key,note]) => [key, 'Strings/Cello Section/susvib/susvib_' + note + '_v1_1.wav']),
    ...[[72,'C4'],[76,'E4'],[79,'G4'],[83,'B4'],[86,'D5']].map(([key,note]) => [key, 'Strings/Violin Section/susVib/VlnEns_susVib_' + note + '_v1.wav'])
  ] },
  drums: { repo: library, length: 2.3, peak: -9, notes: [
    [0, drums + '/Bass Drum 1/BDrumNew_hit_v3_rr1_Sum.wav'],
    [1, drums + '/Snare Drum, Modern 1/Snare2_HitNS_v4_rr1_Mid.wav'],
    [2, idiophones + '/Hi-Hat Cymbal/HiHat_HitC_v2_rr1_Mid.wav'],
    [3, idiophones + '/Hi-Hat Cymbal/HiHat_HitO_rr1_Mid.wav'],
    [4, idiophones + '/Hi-Hat Cymbal/HiHat_Close_rr1_Mid.wav'],
    [5, drums + '/Legacy Snares/drum1/snare1_rim_fff_rr1.wav'],
    [6, drums + '/Legacy Toms/tenor_lower/tenor_f_rr1.wav'],
    [7, drums + '/Legacy Toms/tenor_higher/tenorH_f_rr1.wav'],
    [8, idiophones + '/Clash Cymbals 1/cymbal_crash1_mf1.wav'],
    [9, idiophones + '/Suspended Cymbal 1/susCymb1_hit_stick_mp1.wav'],
    [10, idiophones + '/Tambourine 1/Tamb1_Hit_v2_rr1_Mid.wav'],
    [11, idiophones + '/Shaker, Small/Mid_ShakerDouble_Down_rr1.wav'],
    [12, idiophones + '/Claves/Claves1_Hit_v2_rr1_Mid.wav'],
    [13, idiophones + '/Woodblock/wood_click_mp.wav'],
    [14, drums + '/Conga/Conga_HitN_v2_rr1_Sum.wav']
  ] }
};

async function prepare() {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'sky-versilian-'));
  const output = path.resolve(__dirname, '../assets/audio/versilian');
  await fs.mkdir(output, { recursive: true });
  try {
    for (const [id, bank] of Object.entries(banks)) {
      for (let i = 0; i < bank.notes.length; i += 5) {
        const results = await Promise.allSettled(bank.notes.slice(i, i + 5).map(async ([key, source]) => {
          const url = 'https://raw.githubusercontent.com/sgossner/' + bank.repo + '/' + source.split('/').map(encodeURIComponent).join('/');
          const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
          if (!response.ok) throw Error(response.status + ' fetching ' + url);
          const bytes = Buffer.from(await response.arrayBuffer());
          if (bytes.toString('ascii', 0, 4) !== 'RIFF') throw Error('Not a WAV: ' + url);
          const input = path.join(temp, id + '-' + key + '.wav');
          await fs.writeFile(input, bytes);
          const duration = Number(execFileSync('ffprobe', ['-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',input]));
          if (!Number.isFinite(duration) || duration <= 0) throw Error('Invalid duration: ' + source);
          const end = Math.min(duration, bank.length);
          const pcm = execFileSync('ffmpeg', ['-v','error','-i',input,'-t',String(end),'-ac','1','-ar','44100','-f','f32le','-']);
          let peak = 0;
          for (let offset = 0; offset < pcm.length; offset += 4) peak = Math.max(peak, Math.abs(pcm.readFloatLE(offset)));
          if (!peak) throw Error('Silent source: ' + source);
          const gain = Math.min(30, bank.peak - 20 * Math.log10(peak));
          let first = 0;
          while (first < pcm.length && Math.abs(pcm.readFloatLE(first)) < peak * 0.05) first += 4;
          const trim = Math.max(0, Math.min(0.22, first / (44100 * 4) - 0.035));
          const length = end - trim;
          const fade = Math.min(0.18, length / 3);
          execFileSync('ffmpeg', ['-v','error','-y','-ss',trim.toFixed(4),'-i',input,'-t',length.toFixed(4),'-ac','1','-ar','44100',
            '-af', 'volume=' + gain.toFixed(3) + 'dB,afade=t=out:st=' + (length - fade).toFixed(4) + ':d=' + fade.toFixed(4),
            '-map_metadata','-1','-codec:a','libmp3lame','-b:a','96k',path.join(output, id + '-' + key + '.mp3')]);
          await fs.unlink(input);
          console.log(id, key, '<-', source);
        }));
        const failure = results.find(result => result.status === 'rejected');
        if (failure) throw failure.reason;
      }
    }
  } finally {
    // The path was created by mkdtemp immediately above. Remove only its files and directory.
    for (const name of await fs.readdir(temp)) await fs.unlink(path.join(temp, name));
    await fs.rmdir(temp);
  }
}
prepare().catch(error => { console.error(error); process.exitCode = 1; });
