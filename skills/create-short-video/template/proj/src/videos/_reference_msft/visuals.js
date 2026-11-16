// Microsoft 365 outage — 60-second news explainer. Ballpoint Notebook, 9:16 (1080×1920), Thai voiceover.
// One tall college-ruled page; the camera only travels DOWN.
// Every frame is a pure function of t: randomness only from H.rng / H.makeNoise inside the draw.
//
// TIMING: window.MSFT_TIMING (generated from the voice build) gives each beat's start/end. Every op
// below is written RELATIVE to its beat start, so re-voicing a beat moves its drawing with it.
// The op table is also published as window.MSFT_OPS so score.js sonifies exactly what is drawn.
;(function () {
  const B = window.BP, INK = B.INK, RED = B.RED, GREEN = [20, 120, 60]
  const VW = 1080, VH = 1920, CX = 600
  const TM = window.MSFT_TIMING
  const DURATION = TM.duration
  const BEAT = TM.beats.map((b) => [b.start, b.end])
  const NB = BEAT.length
  const YC = (i) => 960 + i * 1800 // camera centre of beat i on the page

  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v))
  const win = (t, a, b) => clamp((t - a) / (b - a))
  const eio = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
  // B.label / B.bubbleText return a WIDTH. These wrappers draw and return the pen tip instead.
  const tipOf = (w, x, y, size, opt) => {
    const q = opt && opt.p != null ? opt.p : 1
    const x0 = opt && opt.align === 'center' ? x - w / 2 : opt && opt.align === 'right' ? x - w : x
    return [x0 + w * q, y - size * 0.3]
  }
  const labT = (c, s, x, y, size, opt) => tipOf(B.label(c, s, x, y, size, opt), x, y, size, opt)
  const btT = (c, s, x, y, size, opt) => tipOf(B.bubbleText(c, VW, VH, s, x, y, size, opt), x, y, size, opt)
  const down = (x0, y0, x1, y1) => B.cubic([x0, y0], [x0, y0 + (y1 - y0) * 0.45], [x1, y1 - (y1 - y0) * 0.45], [x1, y1])
  const along = (pts, p) => pts[Math.min(pts.length - 1, Math.floor(p * pts.length))]

  // ---------------------------------------------------------------- doodles
  function boxOp(ctx, vp, x, y, w, h, r, lw, rgb, p, hp, holes) {
    const pts = B.rrect(x, y, w, h, r)
    if (hp > 0) { B.hatchShadow(ctx, vp, pts, 9, 9, hp); B.hatchFill(ctx, vp, pts, holes, hp, rgb) }
    return B.stroke(ctx, pts, lw, rgb, p, 0.9)
  }
  function server(ctx, vp, x, y, w, h, p, seed) {
    const tip = B.stroke(ctx, B.rrect(x, y, w, h, 10), 4.5, INK, clamp(p / 0.6), 0.7)
    const q = clamp((p - 0.6) / 0.4)
    for (let i = 0; i < 3 && q > 0; i++) {
      const yy = y + 28 + i * (h - 50) / 3
      B.stroke(ctx, [[x + 16, yy], [x + w - 40, yy]], 3.2, INK, clamp(q * 3 - i), 0.4)
      if (q * 3 - i > 0.9) B.dot(ctx, x + w - 22, yy, 6)
    }
    return tip
  }
  function padlock(ctx, x, y, s, p, rgb) {
    const body = B.rrect(x - 50 * s, y, 100 * s, 78 * s, 10 * s)
    const arc = []
    for (let i = 0; i <= 24; i++) { const a = Math.PI + (i / 24) * Math.PI; arc.push([x + Math.cos(a) * 32 * s, y + Math.sin(a) * 40 * s]) }
    const tip = B.stroke(ctx, [[x - 32 * s, y], ...arc, [x + 32 * s, y]], 5, rgb || INK, clamp(p * 2), 0.6)
    if (p > 0.5) B.stroke(ctx, body, 5, rgb || INK, clamp((p - 0.5) * 2), 0.7)
    if (p > 0.95) B.dot(ctx, x, y + 38 * s, 8 * s, rgb || INK)
    return p > 0.5 ? [x + 50 * s, y + 78 * s * clamp((p - 0.5) * 2)] : tip
  }
  function globe(ctx, x, y, r, p) {
    const tip = B.stroke(ctx, B.circ(x, y, r, r), 5.5, INK, clamp(p / 0.45), 0.8)
    const q = clamp((p - 0.45) / 0.55)
    if (q > 0) {
      B.stroke(ctx, B.circ(x, y, r * 0.42, r), 3.4, INK, clamp(q * 3), 0.6)
      B.stroke(ctx, [[x - r, y], [x + r, y]], 3.4, INK, clamp(q * 3 - 1), 0.5)
      B.stroke(ctx, [[x - r * 0.86, y - r * 0.5], [x + r * 0.86, y - r * 0.5]], 3, INK, clamp(q * 3 - 1.5), 0.5)
      B.stroke(ctx, [[x - r * 0.86, y + r * 0.5], [x + r * 0.86, y + r * 0.5]], 3, INK, clamp(q * 3 - 2), 0.5)
    }
    return tip
  }
  // A real logo, pasted into the notebook as a taped paper clipping. Drawn source-over (not multiply)
  // so the logo keeps its own colours, then taped down. Logos are only ever used as source credits.
  function clipping(ctx, name, x, y, w, rot, p, seed) {
    const img = window.LOGOS && window.LOGOS[name]
    if (!img || p <= 0) return null
    const r = H.rng(seed), h = w * img.naturalHeight / img.naturalWidth
    const s = 0.92 + 0.08 * eio(clamp(p / 0.6)), a = clamp(p / 0.35)
    ctx.save()
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = a
    ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s)
    const pw = w + 44, ph = h + 40
    ctx.shadowColor = 'rgba(40,30,20,0.28)'; ctx.shadowBlur = 14; ctx.shadowOffsetX = 5; ctx.shadowOffsetY = 7
    ctx.fillStyle = '#fbfaf5'; ctx.fillRect(-pw / 2, -ph / 2, pw, ph)
    ctx.shadowColor = 'transparent'
    ctx.drawImage(img, -w / 2, -h / 2, w, h)
    if (p > 0.55) {
      ctx.globalAlpha = a * 0.62 * clamp((p - 0.55) / 0.2); ctx.fillStyle = '#e9dca6'
      for (const sx of [-1, 1]) {
        ctx.save(); ctx.translate(sx * (pw / 2 - 16), -ph / 2 + 4); ctx.rotate(sx * (0.62 + r.range(-0.1, 0.1)))
        ctx.fillRect(-46, -15, 92, 30); ctx.restore()
      }
    }
    ctx.restore()
    return null
  }
  function counterNum(ctx, x, y, size, to, p, rgb) {
    const u = eio(clamp(Math.floor(p * 24) / 24))
    const v = Math.round(to * u / 1000) * 1000
    B.bubbleText(ctx, VW, VH, '~' + v.toLocaleString('en-US'), x, y, size, { align: 'center', rgb })
  }

  // ---------------------------------------------------------------- the page, beat by beat
  // op: { a, b, fn(ctx, vp, p, t) -> pen tip | null, kind, red, s }  (a, b in absolute seconds)
  // kind tells score.js what it sounds like: write | title | line | box | hatch | x | paste | count
  function opsFor(bi) {
    const o = [], s0 = BEAT[bi][0], Y = YC(bi)
    const push = (a, b, kind, fn, extra) => o.push({ a: s0 + a, b: s0 + b, kind, fn, ...(extra || {}) })

    if (bi === 0) { // Microsoft 365 ล่มทั่วโลก · ยังไม่กลับมาปกติ
      push(-0.4, 0.5, 'paste', (c, vp, p) => clipping(c, 'microsoft', CX, Y - 560, 470, -0.025, p, 11))
      push(0.5, 1.6, 'title', (c, vp, p) => btT(c, 'Microsoft 365', CX, Y - 330, 96, { align: 'center', rot: -0.012, p }), { s: 'Microsoft 365' })
      push(1.7, 3.0, 'title', (c, vp, p) => btT(c, 'ล่มทั่วโลก', CX, Y - 160, 150, { align: 'center', rot: -0.01, rgb: RED, p }), { red: true, s: 'ล่มทั่วโลก' })
      push(3.0, 3.25, 'line', (c, vp, p) => B.stroke(c, [[CX - 330, Y - 110], [CX + 330, Y - 120]], 8, INK, p, 0.8))
      push(3.3, 4.7, 'line', (c, vp, p) => globe(c, CX, Y + 130, 170, p))
      push(4.7, 5.5, 'x', (c, vp, p) => {
        const r = H.rng(5), n = Math.floor(14 * p); let last = null
        for (let i = 0; i < 14; i++) {
          const a = r.range(0, 6.283), d = Math.sqrt(r()) * 150
          const x = CX + Math.cos(a) * d, y = Y + 130 + Math.sin(a) * d
          if (i < n) { B.dot(c, x, y, 10, RED); last = [x, y] }
        }
        return last
      }, { red: true })
      push(5.6, 6.4, 'write', (c, vp, p) => labT(c, '12 พ.ย. 2026 · เริ่ม 16:17 UTC', CX, Y + 400, 38, { align: 'center', p }), { s: '12 พ.ย. 2026 · เริ่ม 16:17 UTC' })
      push(6.5, 7.6, 'write', (c, vp, p) => labT(c, 'จนถึงตอนนี้ ยังไม่กลับมาปกติ', CX, Y + 480, 48, { align: 'center', rgb: RED, p }), { red: true, s: 'จนถึงตอนนี้ ยังไม่กลับมาปกติ' })
    }

    if (bi === 1) { // Exchange Online พังก่อน แล้วลาม
      push(0.0, 0.5, 'write', (c, vp, p) => labT(c, 'จุดแรกที่พัง', CX, Y - 430, 44, { align: 'center', rgb: RED, p }), { red: true, s: 'จุดแรกที่พัง' })
      push(0.5, 1.2, 'box', (c, vp, p) => boxOp(c, vp, CX - 310, Y - 370, 620, 230, 18, 5.5, INK, p, 0))
      push(1.2, 1.55, 'hatch', (c, vp, p) => { B.hatchShadow(c, vp, B.rrect(CX - 310, Y - 370, 620, 230, 18), 9, 9, p); return null })
      push(1.3, 2.3, 'title', (c, vp, p) => btT(c, 'Exchange Online', CX, Y - 252, 62, { align: 'center', p }), { s: 'Exchange Online' })
      push(2.3, 2.7, 'write', (c, vp, p) => labT(c, 'ระบบอีเมล', CX, Y - 185, 40, { align: 'center', p }), { s: 'ระบบอีเมล' })
      push(2.8, 3.5, 'x', (c, vp, p) => { B.ring(c, CX, Y - 255, 335, 128, p); return [CX + 335, Y - 255] }, { red: true })
      const kids = [['Outlook', CX - 215], ['Teams', CX], ['Copilot', CX + 215]]
      kids.forEach(([nm, x], i) => {
        const a0 = 3.7 + i * 0.75
        push(a0, a0 + 0.3, 'line', (c, vp, p) => { const a = down(CX + (x - CX) * 0.35, Y - 100, x, Y + 80); B.arrow(c, a, 5, INK, p); return along(a, p) })
        push(a0 + 0.3, a0 + 0.65, 'box', (c, vp, p) => boxOp(c, vp, x - 95, Y + 90, 190, 120, 14, 4.5, INK, p, 0))
        push(a0 + 0.45, a0 + 0.75, 'write', (c, vp, p) => labT(c, nm, x, Y + 162, 38, { align: 'center', p }), { s: nm })
      })
      kids.forEach(([nm, x], i) => {
        push(5.5 + i * 0.25, 5.8 + i * 0.25, 'x', (c, vp, p) => { B.crossOut(c, x - 85, Y + 100, 170, 100, p); return [x + 85, Y + 200] }, { red: true })
      })
      push(7.0, 7.4, 'write', (c, vp, p) => labT(c, 'Teams แชต · ประชุม ส่วนใหญ่ยังใช้ได้', CX, Y + 430, 32, { align: 'center', p }), { s: 'Teams แชต · ประชุม ส่วนใหญ่ยังใช้ได้' })
      push(7.4, 7.8, 'write', (c, vp, p) => labT(c, 'แต่ปฏิทิน · นัดประชุม พัง', CX, Y + 480, 32, { align: 'center', p }), { s: 'แต่ปฏิทิน · นัดประชุม พัง' })
      push(6.3, 6.95, 'write', (c, vp, p) => labT(c, 'ลามไปทั้งชุด Microsoft 365', CX, Y + 330, 44, { align: 'center', rgb: RED, p }), { red: true, s: 'ลามไปทั้งชุด Microsoft 365' })
    }

    if (bi === 2) { // Downdetector ~130,000 reports
      push(0.0, 0.6, 'title', (c, vp, p) => btT(c, 'Downdetector', CX, Y - 540, 76, { align: 'center', p }), { s: 'Downdetector' })
      push(0.6, 1.0, 'write', (c, vp, p) => labT(c, 'รายงานปัญหา Outlook', CX, Y - 470, 36, { align: 'center', p }), { s: 'รายงานปัญหา Outlook' })
      push(1.0, 1.4, 'line', (c, vp, p) => B.stroke(c, [[CX - 320, Y - 420], [CX - 320, Y + 20], [CX + 320, Y + 20]], 5, INK, p, 0.6))
      const pts = []
      for (let i = 0; i <= 64; i++) {
        const u = i / 64, x = CX - 310 + u * 620
        const k = u < 0.32 ? 0.02 : u < 0.42 ? 0.02 + (u - 0.32) / 0.1 * 0.98 : Math.exp(-(u - 0.42) * 4.2)
        pts.push([x, Y + 10 - k * 400])
      }
      push(1.4, 3.0, 'line', (c, vp, p) => B.stroke(c, B.seg(pts, 4), 5.5, RED, p, 0.5), { red: true })
      push(2.9, 3.3, 'x', (c, vp, p) => { B.ring(c, CX - 50, Y - 392, 46, 40, p); return [CX - 4, Y - 392] }, { red: true })
      push(2.4, 3.8, 'count', (c, vp, p) => { counterNum(c, CX, Y + 220, 128, 130000, p, RED); return [CX + 260, Y + 160] }, { red: true })
      push(3.8, 4.1, 'write', (c, vp, p) => labT(c, 'รายงาน ช่วงพีค', CX, Y + 296, 40, { align: 'center', p }), { s: 'รายงาน ช่วงพีค' })
      push(4.1, 4.7, 'write', (c, vp, p) => labT(c, 'เป็นรายงานจากผู้ใช้ ไม่ใช่จำนวนผู้ได้รับผลกระทบ', CX, Y + 352, 29, { align: 'center', p }), { s: 'เป็นรายงานจากผู้ใช้ ไม่ใช่จำนวนผู้ได้รับผลกระทบ' })
      const hit = [['ศาล', CX - 235, 150], ['ธนาคาร', CX - 50, 200], ['หน่วยงานรัฐ', CX + 190, 250]]
      hit.forEach(([nm, x, w], i) => {
        const a0 = 4.9 + i * 0.55
        push(a0, a0 + 0.35, 'box', (c, vp, p) => boxOp(c, vp, x - w / 2, Y + 420, w, 92, 12, 4.5, INK, p, 0))
        push(a0 + 0.25, a0 + 0.55, 'write', (c, vp, p) => labT(c, nm, x, Y + 480, 38, { align: 'center', p }), { s: nm })
      })
      push(6.6, 6.95, 'write', (c, vp, p) => labT(c, 'รูปกราฟเป็นภาพประกอบ', CX + 320, Y + 70, 28, { align: 'right', p }), { s: 'รูปกราฟเป็นภาพประกอบ' })
    }

    if (bi === 3) { // ไม่ใช่การโจมตีทางไซเบอร์
      push(0.0, 0.9, 'line', (c, vp, p) => padlock(c, CX, Y - 470, 1.5, p))
      push(0.9, 1.9, 'title', (c, vp, p) => btT(c, 'การโจมตี', CX, Y - 150, 104, { align: 'center', rot: -0.01, p }), { s: 'การโจมตี' })
      push(1.9, 2.8, 'title', (c, vp, p) => btT(c, 'ทางไซเบอร์', CX, Y + 0, 104, { align: 'center', rot: -0.006, p }), { s: 'ทางไซเบอร์' })
      push(2.85, 3.35, 'x', (c, vp, p) => { B.crossOut(c, CX - 285, Y - 260, 570, 285, p); return [CX + 285, Y + 25] }, { red: true })
      push(3.4, 4.3, 'title', (c, vp, p) => btT(c, 'ไม่ใช่', CX, Y + 270, 160, { align: 'center', rot: -0.02, rgb: RED, p }), { red: true, s: 'ไม่ใช่' })
      push(4.3, 4.95, 'write', (c, vp, p) => labT(c, 'Microsoft ยืนยัน', CX, Y + 380, 44, { align: 'center', p }), { s: 'Microsoft ยืนยัน' })
    }

    if (bi === 4) { // health check ไม่ผ่าน → ถอดออก → โหลดไปกองที่เหลือ
      push(0.0, 0.7, 'write', (c, vp, p) => labT(c, 'ตรวจสุขภาพอัตโนมัติ', CX, Y - 640, 46, { align: 'center', p }), { s: 'ตรวจสุขภาพอัตโนมัติ' })
      const SV = []
      for (let r = 0; r < 2; r++) for (let j = 0; j < 4; j++) SV.push([CX - 300 + j * 160, Y - 520 + r * 220])
      const keep = [5, 6]
      SV.forEach(([x, y], i) => push(0.7 + i * 0.16, 1.1 + i * 0.16, 'box', (c, vp, p) => server(c, vp, x, y, 120, 180, p, i)))
      let d = 0
      SV.forEach(([x, y], i) => {
        if (keep.includes(i)) return
        const a0 = 2.3 + d++ * 0.24
        push(a0, a0 + 0.26, 'x', (c, vp, p) => { B.crossOut(c, x + 4, y + 4, 112, 172, p); return [x + 116, y + 176] }, { red: true })
      })
      push(3.9, 4.4, 'write', (c, vp, p) => labT(c, 'ไม่ผ่าน · ถูกถอดออก', CX, Y - 570, 40, { align: 'center', rgb: RED, p }), { red: true, s: 'ไม่ผ่าน · ถูกถอดออก' })
      push(4.5, 4.8, 'write', (c, vp, p) => labT(c, 'ทราฟฟิกทั้งหมด', CX, Y + 400, 40, { align: 'center', p }), { s: 'ทราฟฟิกทั้งหมด' })
      const src = [CX - 200, CX - 70, CX + 70, CX + 200]
      src.forEach((x0, i) => {
        const [tx, ty] = SV[keep[i % 2]]
        push(4.85 + i * 0.25, 5.2 + i * 0.25, 'line', (c, vp, p) => { const a = down(x0, Y + 330, tx + 60, ty + 192); B.arrow(c, a, 4.5, RED, p); return along(a, p) }, { red: true })
      })
      keep.forEach((i, n) => push(5.95 + n * 0.25, 6.3 + n * 0.25, 'hatch', (c, vp, p) => {
        const [x, y] = SV[i]; B.hatchFill(c, vp, B.rrect(x, y, 120, 180, 10), null, p, RED); return null
      }, { red: true }))
      push(6.3, 6.95, 'write', (c, vp, p) => labT(c, 'ไปกองที่เครื่องที่เหลือ', CX, Y + 500, 44, { align: 'center', rgb: RED, p }), { red: true, s: 'ไปกองที่เครื่องที่เหลือ' })
    }

    if (bi === 5) { // รับไม่ไหว → หยุดตอบสนอง; เปิดกลับมา → ทราฟฟิกเข้า → ล่มซ้ำ
      push(0.0, 0.6, 'box', (c, vp, p) => server(c, vp, CX - 310, Y - 560, 170, 250, p, 9))
      push(0.6, 1.2, 'line', (c, vp, p) => padlock(c, CX + 105, Y - 650, 0.62, p))
      const mx = CX - 90, my = Y - 520, mw = 390, mh = 64
      push(1.2, 1.5, 'box', (c, vp, p) => B.stroke(c, B.rrect(mx, my, mw, mh, mh / 2), 5, INK, p, 0.7))
      push(1.5, 2.4, 'hatch', (c, vp, p) => {
        const inner = B.rrect(mx + 5, my + 5, (mw - 10) * p, mh - 10, (mh - 10) / 2)
        B.hatchFill(c, vp, inner, null, 1, RED); B.stroke(c, inner, 3.2, RED, 1, 0.5); return [mx + mw * p, my + mh / 2]
      }, { red: true })
      push(2.4, 2.6, 'x', (c, vp, p) => {
        for (let i = 0; i < 6; i++) { const a = -0.8 + i * 0.32, L = (30 + (i % 3) * 14) * p
          B.stroke(c, [[mx + mw + 8, my + mh / 2], [mx + mw + 8 + Math.cos(a) * L, my + mh / 2 + Math.sin(a) * L]], 4.5, RED, 1, 0.9) }
        return null
      }, { red: true })
      push(2.6, 3.1, 'write', (c, vp, p) => labT(c, 'ส่วนสร้างการเชื่อมต่อปลอดภัย', mx + mw / 2, my + 112, 30, { align: 'center', p }), { s: 'ส่วนสร้างการเชื่อมต่อปลอดภัย' })
      push(3.1, 3.5, 'write', (c, vp, p) => labT(c, 'รับไม่ไหว', mx + mw / 2, my + 168, 40, { align: 'center', rgb: RED, p }), { red: true, s: 'รับไม่ไหว' })
      push(3.5, 3.9, 'x', (c, vp, p) => { B.crossOut(c, CX - 302, Y - 552, 154, 234, p); return [CX - 148, Y - 318] }, { red: true })
      push(3.9, 4.3, 'write', (c, vp, p) => labT(c, 'หยุดตอบสนอง', CX - 225, Y - 250, 36, { align: 'center', rgb: RED, p }), { red: true, s: 'หยุดตอบสนอง' })
      // the loop: เปิดกลับมา → ทราฟฟิกไหลเข้า → ล่มซ้ำ → back
      const LC = [CX, Y + 220], LR = 230
      const node = (deg) => [LC[0] + Math.cos(deg * Math.PI / 180) * LR, LC[1] + Math.sin(deg * Math.PI / 180) * LR]
      const NODES = [['เปิดกลับมา', -90, false], ['ทราฟฟิกไหลเข้า', 30, false], ['ล่มซ้ำ', 150, true]]
      NODES.forEach(([nm, deg, red], i) => {
        const [x, y] = node(deg), a0 = 4.4 + i * 0.95
        push(a0, a0 + 0.45, 'write', (c, vp, p) => labT(c, nm, x, y + 14, red ? 52 : 40, { align: 'center', rgb: red ? RED : INK, p }), { red, s: nm })
        const arc = []
        for (let k = 0; k <= 30; k++) { const d = (deg + 26 + k / 30 * 68) * Math.PI / 180; arc.push([LC[0] + Math.cos(d) * LR, LC[1] + Math.sin(d) * LR]) }
        push(a0 + 0.5, a0 + 0.9, 'line', (c, vp, p) => { B.arrow(c, arc, 5, red ? RED : INK, p); return along(arc, p) }, { red })
      })
      push(7.25, 7.6, 'write', (c, vp, p) => labT(c, 'วนซ้ำ', LC[0], LC[1] + 14, 40, { align: 'center', p }), { s: 'วนซ้ำ' })
    }

    if (bi === 6) { // ลองแก้ ไม่ได้ผล → แพตช์ → เริ่มนิ่ง
      push(0.0, 0.5, 'write', (c, vp, p) => labT(c, 'ลองแก้แล้ว', CX, Y - 570, 46, { align: 'center', p }), { s: 'ลองแก้แล้ว' })
      const tried = [['รีสตาร์ทเครื่อง', CX - 160], ['ย้ายทราฟฟิก', CX + 160]]
      tried.forEach(([nm, x], i) => {
        push(0.5 + i * 0.7, 0.9 + i * 0.7, 'box', (c, vp, p) => boxOp(c, vp, x - 140, Y - 530, 280, 100, 14, 4.5, INK, p, 0))
        push(0.8 + i * 0.7, 1.2 + i * 0.7, 'write', (c, vp, p) => labT(c, nm, x, Y - 466, 38, { align: 'center', p }), { s: nm })
        push(2.3 + i * 0.35, 2.6 + i * 0.35, 'x', (c, vp, p) => { B.strikeThrough(c, x - 130, Y - 480, 260, p); return [x - 130 + 260 * p, Y - 480] }, { red: true })
      })
      push(3.05, 3.5, 'write', (c, vp, p) => labT(c, 'ยังไม่ได้ผล', CX, Y - 360, 44, { align: 'center', rgb: RED, p }), { red: true, s: 'ยังไม่ได้ผล' })
      push(3.6, 3.9, 'line', (c, vp, p) => { const a = down(CX, Y - 320, CX, Y - 230); B.arrow(c, a, 5.5, INK, p); return along(a, p) })
      push(3.9, 4.6, 'box', (c, vp, p) => boxOp(c, vp, CX - 300, Y - 220, 600, 200, 18, 5.5, INK, p, 0))
      push(4.6, 4.95, 'hatch', (c, vp, p) => { B.hatchShadow(c, vp, B.rrect(CX - 300, Y - 220, 600, 200, 18), 9, 9, p); return null })
      push(4.5, 5.3, 'title', (c, vp, p) => btT(c, 'แพตช์ล่าสุด', CX, Y - 120, 78, { align: 'center', p }), { s: 'แพตช์ล่าสุด' })
      push(5.3, 5.9, 'write', (c, vp, p) => labT(c, 'authentication / routing', CX, Y - 56, 36, { align: 'center', rgb: [70, 90, 180], p }), { s: 'authentication / routing' })
      // stability trace: wild, then settling
      const g = []
      for (let i = 0; i <= 90; i++) { const u = i / 90, amp = u < 0.45 ? 90 : 90 * Math.exp(-(u - 0.45) * 7)
        g.push([CX - 300 + u * 600, Y + 200 + Math.sin(u * 46) * amp * (0.6 + 0.4 * Math.sin(u * 13))]) }
      push(6.0, 7.5, 'line', (c, vp, p) => B.stroke(c, B.seg(g, 4), 5, INK, p, 0.4))
      push(7.5, 8.2, 'write', (c, vp, p) => labT(c, 'เครื่องเริ่มนิ่งขึ้น', CX, Y + 400, 48, { align: 'center', rgb: GREEN, p }), { s: 'เครื่องเริ่มนิ่งขึ้น' })
    }

    if (bi === 7) { // ยังกู้อยู่ · รอรายงาน · เครดิต
      push(0.0, 1.3, 'title', (c, vp, p) => btT(c, 'ยังกู้ระบบอยู่', CX, Y - 470, 108, { align: 'center', rot: -0.012, p }), { s: 'ยังกู้ระบบอยู่' })
      push(1.5, 2.2, 'write', (c, vp, p) => labT(c, 'รอรายงานสาเหตุฉบับเต็ม', CX, Y - 350, 42, { align: 'center', p }), { s: 'รอรายงานสาเหตุฉบับเต็ม' })
      push(2.2, 2.6, 'write', (c, vp, p) => labT(c, 'Post-Incident Report', CX, Y - 296, 32, { align: 'center', rgb: [70, 90, 180], p }), { s: 'Post-Incident Report' })
      push(2.7, 3.0, 'line', (c, vp, p) => B.stroke(c, [[CX - 340, Y - 240], [CX + 340, Y - 248]], 6, INK, p, 0.7))
      push(3.0, 3.3, 'write', (c, vp, p) => labT(c, 'ที่มา', CX, Y - 160, 42, { align: 'center', p }), { s: 'ที่มา' })
      push(3.3, 3.8, 'paste', (c, vp, p) => clipping(c, 'cnn', CX - 240, Y - 10, 160, -0.04, p, 21))
      push(3.7, 4.2, 'paste', (c, vp, p) => clipping(c, 'bbc', CX - 15, Y - 10, 180, 0.02, p, 22))
      push(4.1, 4.6, 'paste', (c, vp, p) => clipping(c, 'guardian', CX + 210, Y + 0, 180, -0.015, p, 23))
      push(4.7, 5.3, 'write', (c, vp, p) => labT(c, '+ Microsoft 365 Service Health', CX, Y + 170, 36, { align: 'center', p }), { s: '+ Microsoft 365 Service Health' })
      push(5.3, 5.8, 'write', (c, vp, p) => labT(c, 'สถานะ ณ 13 พ.ย. 2026 · 17:26 น.', CX, Y + 236, 32, { align: 'center', p }), { s: 'สถานะ ณ 13 พ.ย. 2026 · 17:26 น.' })
      push(6.0, 6.8, 'line', (c, vp, p) => { B.star(c, CX, Y + 360, 30, 902, Math.max(1, Math.ceil(p * 5))); return [CX, Y + 360] })
    }
    // Fit the beat into its slot: drawing must finish >= 0.95 s before the next beat's voice starts,
    // so the camera always gets a real scroll (>= 0.6 s) instead of a jump cut. Times are scaled
    // around the beat start, so the order and rhythm of the strokes are kept.
    const next = bi < NB - 1 ? BEAT[bi + 1][0] : DURATION + 0.45
    const lastB = Math.max(...o.map((x) => x.b)), room = next - 0.95
    if (lastB > room) {
      const k = (room - s0) / (lastB - s0)
      o.forEach((x) => { x.a = s0 + (x.a - s0) * k; x.b = s0 + (x.b - s0) * k })
    }
    return o
  }

  const OPS = Array.from({ length: NB }, (_, i) => opsFor(i))
  // the beat's own in/out: first mark down -> last mark finished
  const IO = OPS.map((ops) => [Math.min(...ops.map((o) => o.a)), Math.max(...ops.map((o) => o.b))])
  window.MSFT_OPS = OPS.flat().map(({ a, b, kind, red, s }) => ({ a, b, kind, red: !!red, s: s || '' }))
  window.MSFT_IO = IO

  // camera: hold on a beat from its first mark until its LAST mark is down, then scroll to the next
  const Z = 1.2, CAMX = 546
  const CAMKEYS = []
  const CAMDY = [-70, -20, -25, -60, -70, -55, -85, -60] // content-centre offset per beat (measured)
  IO.forEach(([tin, tout], i) => {
    CAMKEYS.push([Math.max(0, tin - 0.2), CAMX, YC(i) + CAMDY[i], Z])
    CAMKEYS.push([tout + 0.15, CAMX, YC(i) + CAMDY[i] + 18, Z * 1.004])
  })
  const camAt = (t) => {
    if (t <= CAMKEYS[0][0]) return CAMKEYS[0].slice(1)
    for (let i = 0; i < CAMKEYS.length - 1; i++) {
      const a = CAMKEYS[i], b = CAMKEYS[i + 1]
      if (t <= b[0]) {
        const u = eio((t - a[0]) / Math.max(1e-6, b[0] - a[0]))
        return [a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u, a[3] + (b[3] - a[3]) * u]
      }
    }
    return CAMKEYS[CAMKEYS.length - 1].slice(1)
  }

  // ---------------------------------------------------------------- draw
  function explainer(ctx, W, H_, t) {
    const [cx, cy, z] = camAt(t)
    const vx0 = cx - W / 2 / z, vx1 = cx + W / 2 / z, vy0 = cy - H_ / 2 / z, vy1 = cy + H_ / 2 / z
    const vp = [vx0, vy0, vx1, vy1]
    const apply = (c) => { c.translate(W / 2, H_ / 2); c.scale(z, z); c.translate(-cx, -cy) }
    const toS = ([x, y]) => [(x - cx) * z + W / 2, (y - cy) * z + H_ / 2]

    ctx.save(); apply(ctx)
    B.pageBg(ctx, vx0, vy0, vx1, vy1)
    B.holePunches(ctx, vy0, vy1)
    ctx.restore()
    B.light(ctx, W, H_)

    ctx.save(); apply(ctx)
    ctx.globalCompositeOperation = 'multiply'; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    let tip = null, tipRed = false
    OPS.forEach((ops, bi) => {
      if (Math.abs(YC(bi) - cy) > 2400) return
      ops.forEach((op) => {
        const p = win(t, op.a, op.b)
        if (p <= 0) return
        const r = op.fn(ctx, vp, p, t)
        if (p < 1 && Array.isArray(r) && r.length === 2 && isFinite(r[0]) && isFinite(r[1])) { tip = r; tipRed = !!op.red }
      })
    })
    ctx.restore()

    if (tip) { const [px, py] = toS(tip); B.pen(ctx, px, py, tipRed ? RED : INK) }
    B.finish(ctx, W, H_, t)
  }

  window.VIDEOS = window.VIDEOS || {}
  window.VIDEOS.msft = { ...window.VIDEOS.msft, draw: explainer, duration: DURATION, width: VW, height: VH, voice: 'msft-voice.mp3' }
})()
