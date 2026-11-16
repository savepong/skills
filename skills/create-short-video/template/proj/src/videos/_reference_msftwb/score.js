// Microsoft outage explainer — sound. A dry-erase marker on a glossy board, under a news read.
//
// Driven entirely by window.MSFT_OPS, the same op table visuals.js draws from: every stroke, cross,
// paste and counter gets its sound on the exact frame it appears. Re-time the drawing and the sound
// follows; nothing here holds its own times.
//
// VOICEOVER mix: the shell calls SOUND.renderOffline(score, ..., {}) without `voiceover: true`, so the
// kit does not duck for us. No bed, no music, drawing texture well down, so the anchor stays on top.
;(function () {
  function score(k) {
    const OPS = window.MSFTWB_OPS, IO = window.MSFTWB_IO, ERASE = window.MSFTWB_ERASE
    const LV = 0.3
    const rnd = (i) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x) }

    const bp = (a, b, g = 1, pan = 0, red = false) => {
      const d = Math.max(0.03, b - a); g *= LV
      k.noise(a, { dur: 0.016, filter: 'bandpass', f: red ? 1700 : 2100, q: 1.8, gain: 0.34 * g, a: 0.001, pan })
      k.tone(a, { f: red ? 170 : 210, dur: 0.03, gain: 0.05 * g, pan })
      k.play('stroke', a, { material: red ? 'sharpie' : 'marker', dur: d, gain: 1.4 * g, pan })
      k.noise(a, { dur: d + 0.03, color: 'pink', filter: 'bandpass', f: red ? 800 : 950, q: 0.9, gain: 0.06 * g, a: 0.012, hold: d * 0.6, pan })
    }
    // handwriting: one stroke per word, placed by character position like the per-letter reveal
    const write = (s, a, b, g = 0.85, pan = 0, red = false) => {
      if (!s) return bp(a, b, g, pan, red)
      const n = s.length, re = /\S+/g; let m
      while ((m = re.exec(s))) bp(a + (b - a) * m.index / n, a + (b - a) * (m.index + m[0].length) / n, g, pan, red)
    }
    const hatch = (a, b, g = 1, seed = 1, pan = 0) => {
      let i = 0
      for (let x = a; x < b; x += 0.038 + rnd(seed + i) * 0.014, i++) {
        k.noise(x, { dur: 0.028, filter: 'bandpass', f: 3300 + rnd(seed + i + 40) * 700, q: 1.3,
          gain: 0.055 * LV * g * (1 - 0.4 * (x - a) / (b - a)), a: 0.004, pan: pan + (i % 2 ? 0.06 : -0.06) })
      }
    }
    const scroll = (t) => k.play('whoosh', t, { dur: 0.55, top: 1400, gain: 0.18 })

    OPS.forEach((o, i) => {
      const pan = (rnd(i + 3) - 0.5) * 0.3, d = o.b - o.a
      switch (o.kind) {
        case 'write': write(o.s, o.a, o.b, 0.5, pan, o.red); break
        case 'title': write(o.s, o.a, o.b, 1.0, pan, o.red); hatch(o.a + 0.04, o.b, 0.7, i * 7, pan); break
        case 'line': bp(o.a, o.b, 0.95, pan, o.red); break
        case 'box': bp(o.a, o.b, 1.0, pan); break
        case 'hatch': hatch(o.a, o.b, 0.9, i * 11, pan); break
        case 'x':
          // two hard slashes per cross, plus a low knock on the first so "this failed" is felt, not just heard
          bp(o.a, o.a + d * 0.5, 1.6, pan, true); bp(o.a + d * 0.5, o.b, 1.6, pan, true)
          k.tone(o.a, { f: 120, dur: 0.09, gain: 0.05, pan }); break
        case 'paste':
          k.play('paper', o.a, { dur: 0.3, gain: 0.55, pan })
          k.noise(o.a + d * 0.6, { dur: 0.06, filter: 'bandpass', f: 2600, q: 1.1, gain: 0.05, pan }) // tape pressed down
          k.noise(o.a + d * 0.7, { dur: 0.06, filter: 'bandpass', f: 2400, q: 1.1, gain: 0.05, pan }); break
        case 'count':
          for (let f = Math.ceil(o.a * 12); f / 12 < o.b; f++) k.play('count', f / 12, { gain: 0.9, f: 2400 + (f - o.a * 12) * 70 })
          k.play('tock', o.b, { f: 520, gain: 0.4 }); break
      }
    })
    // the camera gliding down the board to the next beat (none between 4 and 5: that is the erase)
    for (let i = 1; i < IO.length; i++) if (i !== 4) scroll(IO[i - 1][1] + 0.15)
    // felt eraser: 10 passes back and forth, scrubbing in time with the wipe
    {
      const passes = 10, d = (ERASE[1] - ERASE[0]) / passes
      for (let r = 0; r < passes; r++) k.noise(ERASE[0] + r * d, { dur: d + 0.03, color: 'pink', filter: 'bandpass', f: 650 + (r % 3) * 120, q: 0.7, gain: 0.16, a: 0.01, pan: r % 2 ? -0.3 : 0.3 })
      k.play('erase', ERASE[0], { dur: ERASE[1] - ERASE[0], gain: 0.35 })
    }
  }

  window.VIDEOS.msftwb = { ...window.VIDEOS.msftwb, score }
})()
