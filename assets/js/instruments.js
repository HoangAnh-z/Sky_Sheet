'use strict';
  window.SKY_INSTRUMENTS = {
    harp:   { n: 'Đàn hạc', parts: [[1, 1, 'triangle'], [2, 0.18, 'sine']], a: 0.004, len: 1.8 },
    piano:  { n: 'Piano', parts: [[1, 1, 'sine'], [2, 0.45, 'sine'], [3, 0.15, 'triangle']], a: 0.006, len: 1.5 },
    guitar: { n: 'Guitar', parts: [[1, 1, 'triangle'], [2, 0.5, 'sine'], [3, 0.22, 'sine'], [4, 0.1, 'sine']], a: 0.003, len: 1.2 },
    zheng:  { n: 'Đàn tranh', parts: [[1, 1, 'triangle'], [2, 0.55, 'sine'], [3, 0.35, 'sine'], [5, 0.15, 'sine']], a: 0.002, len: 2.1 },
    bell:   { n: 'Chuông', parts: [[1, 1, 'sine'], [2.76, 0.28, 'sine'], [5.4, 0.1, 'sine']], a: 0.003, len: 2.4 },
    flute:  { n: 'Sáo', sus: 1, parts: [[1, 1, 'sine'], [2, 0.12, 'sine']], a: 0.07, br: 0.03, vib: [5, 5] },
    dizi:   { n: 'Sáo dizi', sus: 1, buzz: 1, scoop: 1, parts: [[1, 1, 'sine'], [2, 0.5, 'sine'], [3, 0.32, 'sine'], [4, 0.18, 'sine'], [5, 0.09, 'sine']], a: 0.03, br: 0.06, vib: [5.8, 9] },
    xiao:   { n: 'Tiêu', sus: 1, lp: 1800, parts: [[1, 1, 'sine'], [2, 0.06, 'sine']], a: 0.1, br: 0.1, vib: [4.5, 6] },
    erhu:   { n: 'Nhị hồ', sus: 1, scoop: 1, lp: 2600, parts: [[1, 0.5, 'sawtooth'], [1.004, 0.4, 'sawtooth']], a: 0.08, vib: [6, 14] },
    organ:  { n: 'Đàn organ', sus: 1, parts: [[1, 1, 'sine'], [2, 0.6, 'sine'], [3, 0.4, 'sine'], [4, 0.25, 'sine']], a: 0.02 },
    strings: { n: 'Dàn dây', sus: 1, lp: 3200, parts: [[1, 0.5, 'sawtooth'], [1.006, 0.4, 'sawtooth'], [0.994, 0.3, 'sawtooth']], a: 0.15, vib: [5.2, 6] },
    bass:   { n: 'Bass', parts: [[1, 1, 'sine'], [2, 0.35, 'triangle'], [3, 0.1, 'sine']], a: 0.005, len: 0.9 },
    drums:  { n: 'Bộ trống' }
  };
