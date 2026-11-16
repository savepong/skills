// Thai OCR in the browser, no server — concept/demo explainer. Whiteboard Explainer, 9:16 (1080×1920),
// the owner's recorded voice. One tall whiteboard; the camera travels DOWN it, one beat per board slot.
// Every frame is a pure function of t: randomness only from H.rng / H.makeNoise inside the draw.
//
// TIMING: window.OCR_TIMING (generated from voice/out/timing.json) gives each beat's start/end. Every op
// is written RELATIVE to its beat start, so re-cutting the voice moves the drawing with it.
// The op table is published as window.OCR_OPS so score.js sonifies exactly what is drawn.
//
// Facts on screen (all checked on the live demo, 16 Nov 2026): det.onnx 1.78 MB, rec.onnx 2.39 MB,
// ort-wasm-simd-threaded.wasm 14.85 MB (content-length); limit 1280, rec height 48, dropBelow 0.8 (ocr.html);
// sample quotation -> 10 lines, 3 wrong characters (Qนotation, อUรม, " for ·).
;(function () {
  const B = window.WB, INK = B.INK, RED = B.RED, GREEN = B.GREEN, BLUE = B.BLUE
  const VW = 1080, VH = 1920, CX = 600
  const TM = window.OCR_TIMING
  const DURATION = TM.duration
  const BEAT = TM.beats.map((b) => [b.start, b.end])
  const NB = BEAT.length
  const YC = (i) => 960 + i * 1800 // camera centre of beat i on the board

  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v))
  const win = (t, a, b) => clamp((t - a) / (b - a))
  const eio = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
  const tipOf = (w, x, y, size, opt) => {
    const q = opt && opt.p != null ? opt.p : 1
    const x0 = opt && opt.align === 'center' ? x - w / 2 : opt && opt.align === 'right' ? x - w : x
    return [x0 + w * q, y - size * 0.3]
  }
  const labT = (c, s, x, y, size, opt) => tipOf(B.label(c, s, x, y, size, opt), x, y, size, opt)
  const btT = (c, s, x, y, size, opt) => tipOf(B.bubbleText(c, VW, VH, s, x, y, size, opt), x, y, size, opt)
  const down = (x0, y0, x1, y1) => B.cubic([x0, y0], [x0, y0 + (y1 - y0) * 0.45], [x1, y1 - (y1 - y0) * 0.45], [x1, y1])
  const along = (pts, p) => pts[Math.min(pts.length - 1, Math.floor(p * pts.length))]
  const arrowDown = (c, x0, y0, x1, y1, p, col) => { const a = down(x0, y0, x1, y1); B.arrow(c, a, 5.5, col || INK, p); return along(a, p) }
  const box = (c, x, y, w, h, p, col, lw) => B.stroke(c, B.rrect(x, y, w, h, 16), lw || 5.5, col || INK, p, 0.8)
  // a document sheet: outline, then text rows
  const doc = (c, x, y, w, h, p, rows, col) => {
    B.stroke(c, B.rrect(x, y, w, h, 10), 5, col || INK, clamp(p / 0.45), 0.8)
    const q = clamp((p - 0.45) / 0.55), n = rows.length
    rows.forEach((r, i) => { if (q * n > i) B.stroke(c, [[x + 34, y + 54 + i * (h - 90) / Math.max(1, n - 1)], [x + 34 + (w - 68) * r, y + 54 + i * (h - 90) / Math.max(1, n - 1)]], i === 0 ? 7 : 4, col || INK, clamp(q * n - i), 0.5) })
    return null
  }
  function server(ctx, x, y, w, h, p) {
    const tip = B.stroke(ctx, B.rrect(x, y, w, h, 10), 4.5, INK, clamp(p / 0.6), 0.7)
    const q = clamp((p - 0.6) / 0.4)
    for (let i = 0; i < 3 && q > 0; i++) {
      const yy = y + 34 + i * (h - 56) / 3
      B.stroke(ctx, [[x + 18, yy], [x + w - 46, yy]], 3.2, INK, clamp(q * 3 - i), 0.4)
      if (q * 3 - i > 0.9) B.dot(ctx, x + w - 24, yy, 6)
    }
    return tip
  }
  function padlock(ctx, x, y, s, p, rgb) {
    const body = B.rrect(x - 50 * s, y, 100 * s, 78 * s, 10 * s)
    const arc = []
    for (let i = 0; i <= 24; i++) { const a = Math.PI + (i / 24) * Math.PI; arc.push([x + Math.cos(a) * 32 * s, y + Math.sin(a) * 40 * s]) }
    B.stroke(ctx, [[x - 32 * s, y], ...arc, [x + 32 * s, y]], 5, rgb || INK, clamp(p * 2), 0.6)
    if (p > 0.5) B.stroke(ctx, body, 5, rgb || INK, clamp((p - 0.5) * 2), 0.7)
    if (p > 0.95) B.dot(ctx, x, y + 38 * s, 8 * s, rgb || INK)
    return null
  }
  // A real screenshot taped onto the board (source-over keeps its colours).
  function clipping(ctx, name, x, y, w, rot, p, seed) {
    const img = window.LOGOS && window.LOGOS[name]
    if (!img || p <= 0) return null
    const r = H.rng(seed), h = w * img.naturalHeight / img.naturalWidth
    const s = 0.92 + 0.08 * eio(clamp(p / 0.6)), a = clamp(p / 0.35)
    ctx.save()
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = a
    ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s)
    const pw = w + 30, ph = h + 30
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

  // ---------------------------------------------------------------- the page, beat by beat
  // op: { a, b, fn(ctx, vp, p, t), kind, red, s }  (a, b in absolute seconds)
  // kind tells score.js what it sounds like: write | title | line | box | hatch | x | paste
  function opsFor(bi) {
    const o = [], s0 = BEAT[bi][0], Y = YC(bi)
    const push = (a, b, kind, fn, extra) => o.push({ a: s0 + a, b: s0 + b, kind, fn, ...(extra || {}) })

    if (bi === 0) { // ปกติต้องส่งรูปขึ้นเซิร์ฟเวอร์ แต่เว็บนี้ไม่ต้อง รูปไม่ออกจากเครื่อง
      push(0.0, 0.7, 'write', (c, vp, p) => labT(c, 'ปกติ', CX, Y - 600, 46, { align: 'center', rgb: BLUE, p }), { s: 'ปกติ' })
      push(0.7, 1.8, 'box', (c, vp, p) => doc(c, CX - 330, Y - 470, 250, 300, p, [0.7, 0.85, 0.6, 0.8, 0.5]))
      push(1.8, 2.6, 'write', (c, vp, p) => labT(c, 'รูปของคุณ', CX - 205, Y - 110, 40, { align: 'center', p }), { s: 'รูปของคุณ' })
      push(3.2, 4.3, 'box', (c, vp, p) => server(c, CX + 90, Y - 470, 240, 230, p))
      push(4.3, 5.0, 'write', (c, vp, p) => labT(c, 'เซิร์ฟเวอร์', CX + 210, Y - 180, 40, { align: 'center', p }), { s: 'เซิร์ฟเวอร์' })
      push(5.0, 5.8, 'line', (c, vp, p) => { const a = [[CX - 60, Y - 330], [CX + 10, Y - 345], [CX + 70, Y - 350]]; B.arrow(c, a, 6, INK, p); return along(a, p) })
      push(6.0, 6.6, 'x', (c, vp, p) => { B.crossOut(c, CX + 80, Y - 480, 260, 250, p); return null }, { red: true })
      push(6.6, 8.0, 'title', (c, vp, p) => btT(c, 'ไม่ต้องมีเซิร์ฟเวอร์', CX, Y + 50, 92, { align: 'center', rot: -0.012, rgb: RED, p }), { red: true, s: 'ไม่ต้องมีเซิร์ฟเวอร์' })
      push(8.3, 9.0, 'box', (c, vp, p) => padlock(c, CX - 250, Y + 190, 1.0, p, GREEN))
      push(9.0, 10.2, 'write', (c, vp, p) => labT(c, 'รูปไม่ออกจากเครื่องคุณ', CX + 60, Y + 255, 48, { align: 'center', p }), { s: 'รูปไม่ออกจากเครื่องคุณ' })
    }

    if (bi === 1) { // ยกโมเดลมาไว้ในเบราว์เซอร์: OpenThai OCR (iApp) ~4 MB, ONNX Runtime Web + WebAssembly
      push(0.3, 1.6, 'box', (c, vp, p) => {
        const tip = box(c, CX - 340, Y - 560, 680, 760, p)
        if (p > 0.6) { B.stroke(c, [[CX - 340, Y - 490], [CX + 340, Y - 490]], 4, INK, clamp((p - 0.6) / 0.4), 0.5); [0, 1, 2].forEach((k) => B.dot(c, CX - 305 + k * 28, Y - 525, 8, k === 0 ? RED : INK)) }
        return tip
      })
      push(1.6, 2.6, 'write', (c, vp, p) => labT(c, 'เบราว์เซอร์', CX - 180, Y - 510, 36, { p }), { s: 'เบราว์เซอร์' })
      push(2.8, 3.8, 'box', (c, vp, p) => box(c, CX - 260, Y - 440, 520, 190, p, INK))
      push(4.3, 5.6, 'title', (c, vp, p) => btT(c, 'OpenThai OCR', CX, Y - 350, 66, { align: 'center', rot: -0.01, p }), { s: 'OpenThai OCR' })
      push(5.6, 6.6, 'write', (c, vp, p) => labT(c, 'โมเดลจาก iApp Technology', CX, Y - 285, 34, { align: 'center', rgb: BLUE, p }), { s: 'โมเดลจาก iApp Technology' })
      push(7.0, 8.4, 'title', (c, vp, p) => btT(c, '~4 MB', CX, Y - 150, 84, { align: 'center', rgb: RED, p }), { red: true, s: '~4 MB' })
      push(8.8, 9.6, 'box', (c, vp, p) => box(c, CX - 260, Y - 90, 520, 180, p, INK))
      push(9.6, 10.9, 'write', (c, vp, p) => labT(c, 'ONNX Runtime Web', CX, Y - 15, 50, { align: 'center', p }), { s: 'ONNX Runtime Web' })
      push(11.0, 12.2, 'write', (c, vp, p) => labT(c, 'ผ่าน WebAssembly', CX, Y + 50, 38, { align: 'center', rgb: BLUE, p }), { s: 'ผ่าน WebAssembly' })
      push(12.2, 12.8, 'line', (c, vp, p) => { const a = [[CX + 300, Y - 10], [CX + 320, Y - 120], [CX + 280, Y - 230]]; B.arrow(c, a, 5, INK, p); return along(a, p) })
    }

    if (bi === 2) { // ดาวน์โหลดราว 20 MB ส่วนใหญ่เป็น runtime; ค้างในหน่วยความจำ รูปถัดไปเร็วขึ้น
      push(0.0, 1.0, 'write', (c, vp, p) => labT(c, 'ใส่รูปแรก', CX, Y - 610, 44, { align: 'center', rgb: BLUE, p }), { s: 'ใส่รูปแรก' })
      push(1.0, 1.4, 'line', (c, vp, p) => arrowDown(c, CX, Y - 590, CX, Y - 530, p))
      push(1.5, 3.2, 'title', (c, vp, p) => btT(c, 'ดาวน์โหลด ~20 MB', CX, Y - 440, 84, { align: 'center', rot: -0.01, p }), { s: 'ดาวน์โหลด ~20 MB' })
      // stacked bar, widths from the measured sizes: wasm 14.85, rec 2.39, det 1.78 MB
      const X0 = CX - 340, BW = 680, tot = 14.85 + 2.39 + 1.78, wR = BW * 14.85 / tot, wRec = BW * 2.39 / tot
      push(3.3, 4.0, 'box', (c, vp, p) => box(c, X0, Y - 380, BW, 110, p))
      push(4.0, 5.0, 'hatch', (c, vp, p) => { B.hatchFill(c, vp, B.rrect(X0 + 6, Y - 374, wR - 12, 98, 10), [], p, RED); return null }, { red: true })
      push(5.0, 5.4, 'line', (c, vp, p) => { B.stroke(c, [[X0 + wR, Y - 380], [X0 + wR, Y - 270]], 4, INK, p, 0.4); B.stroke(c, [[X0 + wR + wRec, Y - 380], [X0 + wR + wRec, Y - 270]], 4, INK, clamp(p * 2 - 1), 0.4); return null })
      push(5.4, 6.4, 'write', (c, vp, p) => labT(c, 'runtime (WASM) ~15 MB', X0 + wR / 2, Y - 210, 38, { align: 'center', rgb: RED, p }), { red: true, s: 'runtime (WASM) ~15 MB' })
      push(6.4, 7.1, 'write', (c, vp, p) => labT(c, 'โมเดล ~4 MB', X0 + BW - 10, Y - 150, 34, { align: 'right', p }), { s: 'โมเดล ~4 MB' })
      push(7.4, 8.4, 'box', (c, vp, p) => box(c, CX - 300, Y - 70, 600, 170, p, INK))
      push(8.4, 9.9, 'write', (c, vp, p) => labT(c, 'ค้างในหน่วยความจำ', CX, Y + 30, 50, { align: 'center', p }), { s: 'ค้างในหน่วยความจำ' })
      push(10.0, 10.4, 'line', (c, vp, p) => arrowDown(c, CX, Y + 110, CX, Y + 200, p, GREEN))
      push(10.5, 12.0, 'title', (c, vp, p) => btT(c, 'รูปถัดไปเร็วขึ้น', CX, Y + 320, 80, { align: 'center', rot: -0.01, rgb: GREEN, p }), { s: 'รูปถัดไปเร็วขึ้น' })
    }

    if (bi === 3) { // ขั้น 1: ย่อรูป <= 1280 px -> det.onnx หาตำแหน่ง -> กรอบทีละบรรทัด (ภาพจริงจากเดโม)
      push(0.0, 1.0, 'title', (c, vp, p) => btT(c, '1  หาตำแหน่งข้อความ', CX, Y - 640, 76, { align: 'center', rot: -0.01, p }), { s: '1 หาตำแหน่งข้อความ' })
      push(1.1, 2.4, 'box', (c, vp, p) => doc(c, CX - 300, Y - 520, 600, 330, p, [0.6, 0.8, 0.5, 0.85, 0.7, 0.4]))
      push(2.6, 3.4, 'line', (c, vp, p) => { const a = [[CX - 300, Y - 548], [CX + 300, Y - 548]]; B.arrow(c, a, 4, BLUE, p); B.arrow(c, [[CX + 300, Y - 548], [CX - 300, Y - 548]], 4, BLUE, clamp(p * 2 - 1)); return along(a, p) })
      push(3.4, 4.8, 'write', (c, vp, p) => labT(c, 'ด้านยาว ≤ 1280 px', CX, Y - 568, 36, { align: 'center', rgb: BLUE, p }), { s: 'ด้านยาว ≤ 1280 px' })
      push(5.0, 5.5, 'line', (c, vp, p) => arrowDown(c, CX, Y - 175, CX, Y - 115, p))
      push(5.5, 6.3, 'box', (c, vp, p) => box(c, CX - 140, Y - 105, 280, 90, p, INK))
      push(6.3, 7.2, 'write', (c, vp, p) => labT(c, 'det.onnx', CX, Y - 45, 44, { align: 'center', p }), { s: 'det.onnx' })
      push(7.3, 7.8, 'line', (c, vp, p) => arrowDown(c, CX, Y - 5, CX, Y + 50, p))
      push(8.0, 9.0, 'paste', (c, vp, p) => clipping(c, 'quote', CX, Y + 240, 600, -0.012, p, 21))
      push(9.2, 10.2, 'write', (c, vp, p) => labT(c, 'ได้กรอบทีละบรรทัด (ภาพจริงจากเดโม)', CX, Y + 470, 34, { align: 'center', rgb: BLUE, p }), { s: 'ได้กรอบทีละบรรทัด (ภาพจริงจากเดโม)' })
    }

    if (bi === 4) { // ขั้น 2: ตัดแต่ละกรอบ สูง 48 px -> rec.onnx -> ตัวอักษร
      push(0.0, 0.9, 'title', (c, vp, p) => btT(c, '2  อ่านทีละบรรทัด', CX, Y - 600, 76, { align: 'center', rot: -0.01, p }), { s: '2 อ่านทีละบรรทัด' })
      push(1.0, 1.7, 'box', (c, vp, p) => box(c, CX - 300, Y - 500, 600, 96, p, RED, 5))
      push(1.7, 2.6, 'write', (c, vp, p) => labT(c, 'ใบเสนอราคา', CX - 270, Y - 436, 46, { p }), { s: 'ใบเสนอราคา' })
      push(2.8, 3.4, 'line', (c, vp, p) => { B.arrow(c, [[CX + 330, Y - 452], [CX + 330, Y - 500]], 4, BLUE, p); B.arrow(c, [[CX + 330, Y - 452], [CX + 330, Y - 404]], 4, BLUE, p); return null })
      push(3.4, 4.6, 'write', (c, vp, p) => labT(c, 'สูง 48 px', CX + 300, Y - 350, 38, { align: 'right', rgb: BLUE, p }), { s: 'สูง 48 px' })
      push(4.8, 5.3, 'line', (c, vp, p) => arrowDown(c, CX, Y - 320, CX, Y - 250, p))
      push(5.3, 6.0, 'box', (c, vp, p) => box(c, CX - 140, Y - 240, 280, 90, p, INK))
      push(6.0, 6.8, 'write', (c, vp, p) => labT(c, 'rec.onnx', CX, Y - 180, 44, { align: 'center', p }), { s: 'rec.onnx' })
      push(6.9, 7.3, 'line', (c, vp, p) => arrowDown(c, CX, Y - 140, CX, Y - 70, p))
      push(7.3, 8.0, 'title', (c, vp, p) => btT(c, 'ใบเสนอราคา', CX, Y + 40, 84, { align: 'center', rgb: GREEN, p }), { s: 'ใบเสนอราคา' })
    }

    if (bi === 5) { // ขั้น 3: จัดสระ/วรรณยุกต์, เรียงลำดับ, ตัดบรรทัดมั่นใจ < 80%
      push(0.0, 1.0, 'title', (c, vp, p) => btT(c, '3  จัดเรียงและคัดออก', CX, Y - 600, 76, { align: 'center', rot: -0.01, p }), { s: '3 จัดเรียงและคัดออก' })
      const items = [['จัดสระ + วรรณยุกต์ให้ถูกรูป', 1.1], ['เรียงบรรทัดตามลำดับการอ่าน', 4.0], ['ตัดบรรทัดที่มั่นใจ < 80%', 6.8]]
      items.forEach(([t, a0], i) => {
        const y = Y - 420 + i * 180
        push(a0, a0 + 0.4, 'box', (c, vp, p) => B.stroke(c, B.rrect(CX - 330, y - 50, 70, 70, 10), 5, INK, p, 0.6))
        push(a0 + 0.4, a0 + 1.6, 'write', (c, vp, p) => labT(c, t, CX - 230, y + 4, 46, { p, rgb: i === 2 ? RED : INK }), { s: t, red: i === 2 })
        push(a0 + 1.7, a0 + 2.1, 'line', (c, vp, p) => { B.check(c, CX - 318, y - 18, 0.9, p); return null })
      })
    }

    if (bi === 6) { // ผลทดสอบ 1 รูป: 10/10 บรรทัด ผิด 3 ตัวอักษร; ยังไม่หมุนรูปเอียง
      push(0.0, 1.2, 'title', (c, vp, p) => btT(c, 'ทดสอบ 1 รูป', CX, Y - 620, 80, { align: 'center', rot: -0.01, p }), { s: 'ทดสอบ 1 รูป' })
      push(1.6, 3.0, 'title', (c, vp, p) => btT(c, 'เจอ 10/10 บรรทัด', CX, Y - 480, 70, { align: 'center', rgb: GREEN, p }), { s: 'เจอ 10/10 บรรทัด' })
      const errs = [['Quotation', 'Qนotation'], ['อบรม', 'อUรม'], ['·', '"']]
      errs.forEach(([ok, bad], i) => {
        const y = Y - 370 + i * 84, a0 = 3.2 + i * 0.5
        push(a0, a0 + 0.4, 'write', (c, vp, p) => labT(c, ok + '  →', CX - 30, y, 44, { align: 'right', p }), { s: ok })
        // Wrong reads use Itim (looped Thai): in loopless faces (Sriracha, the demo's UI font) น looks like u,
        // so 'Qนotation' would read as 'Quotation' to viewers — the same confusion the model made.
        push(a0 + 0.4, a0 + 0.8, 'write', (c, vp, p) => { B.mText(c, bad, CX + 10, y, '400 50px "Itim"', B.hexOf(RED), 31 + i, p); return null }, { red: true, s: bad })
        // ring the one wrong character (index 1 in both words), measured, so viewers see exactly which glyph flipped
        if (i < 2) push(a0 + 0.85, a0 + 1.15, 'x', (c, vp, p) => {
          c.save(); c.font = '400 50px "Itim"'
          const w1 = c.measureText(bad.slice(0, 1)).width, w2 = c.measureText(bad.slice(0, 2)).width
          c.restore()
          B.ring(c, CX + 10 + (w1 + w2) / 2, y - 17, (w2 - w1) / 2 + 10, 28, p)
          return null
        }, { red: true })
      })
      push(4.8, 5.4, 'line', (c, vp, p) => B.stroke(c, [[CX - 320, Y - 140], [CX + 320, Y - 147]], 5, INK, p, 0.7))
      push(5.4, 7.0, 'write', (c, vp, p) => labT(c, 'ผลจากรูปเดียว ยังไม่ใช่ความแม่นยำ', CX, Y - 75, 42, { align: 'center', rgb: BLUE, p }), { s: 'ผลจากรูปเดียว ยังไม่ใช่ความแม่นยำ' })
      push(7.6, 8.6, 'box', (c, vp, p) => {
        const r = 0.22, cx0 = CX - 150, cy0 = Y + 130, w = 200, h = 240
        const pts = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2], [-w / 2, -h / 2]].map(([x, y]) => [cx0 + x * Math.cos(r) - y * Math.sin(r), cy0 + x * Math.sin(r) + y * Math.cos(r)])
        const tip = B.stroke(c, pts, 5, INK, clamp(p / 0.6), 0.7)
        ;[0, 1, 2, 3].forEach((k) => { if (p > 0.6 + k * 0.1) { const yy = -h / 2 + 50 + k * 45, x0 = -w / 2 + 25, x1 = w / 2 - 25; B.stroke(c, [[cx0 + x0 * Math.cos(r) - yy * Math.sin(r), cy0 + x0 * Math.sin(r) + yy * Math.cos(r)], [cx0 + x1 * Math.cos(r) - yy * Math.sin(r), cy0 + x1 * Math.sin(r) + yy * Math.cos(r)]], 3.5, INK, 1, 0.4) } })
        return tip
      })
      push(8.6, 9.0, 'title', (c, vp, p) => btT(c, '?', CX + 40, Y + 170, 150, { align: 'center', rgb: RED, p }), { red: true, s: '?' })
      push(9.0, 10.4, 'write', (c, vp, p) => labT(c, 'ยังไม่หมุนรูปเอียงให้ตรง', CX + 150, Y + 330, 42, { align: 'center', rgb: RED, p }), { red: true, s: 'ยังไม่หมุนรูปเอียงให้ตรง' })
    }

    if (bi === 7) { // เครดิต + URL
      push(0.0, 1.2, 'write', (c, vp, p) => labT(c, 'โมเดล: iApp Technology', CX, Y - 560, 46, { align: 'center', p }), { s: 'โมเดล: iApp Technology' })
      push(1.2, 1.9, 'write', (c, vp, p) => labT(c, 'OpenThai2.0-OCR-Text · Apache-2.0', CX, Y - 500, 32, { align: 'center', rgb: BLUE, p }), { s: 'OpenThai2.0-OCR-Text · Apache-2.0' })
      push(2.0, 3.4, 'write', (c, vp, p) => labT(c, 'ต้นแบบ: dt.in.th/OpenThaiOCRWebDemo', CX, Y - 410, 38, { align: 'center', p }), { s: 'ต้นแบบ: dt.in.th/OpenThaiOCRWebDemo' })
      push(3.6, 4.0, 'line', (c, vp, p) => B.stroke(c, [[CX - 330, Y - 340], [CX + 330, Y - 346]], 5, INK, p, 0.7))
      push(4.1, 4.7, 'write', (c, vp, p) => labT(c, 'ลองเล่นได้ที่', CX, Y - 250, 44, { align: 'center', p }), { s: 'ลองเล่นได้ที่' })
      push(4.7, 6.2, 'title', (c, vp, p) => btT(c, 'artifact.c9n.co/ocr', CX, Y - 130, 76, { align: 'center', rot: -0.01, rgb: RED, p }), { red: true, s: 'artifact.c9n.co/ocr' })
      push(6.2, 6.6, 'line', (c, vp, p) => B.stroke(c, [[CX - 330, Y - 85], [CX + 330, Y - 92]], 6, RED, p, 0.7), { red: true })
    }
    // Fit the beat into its slot: drawing must finish >= 0.95 s before the next beat's voice starts,
    // so the camera always gets a real scroll instead of a jump cut.
    const next = bi < NB - 1 ? BEAT[bi + 1][0] : DURATION + 0.45
    const lastB = Math.max(...o.map((x) => x.b)), room = next - 0.95
    if (lastB > room) {
      const k = (room - s0) / (lastB - s0)
      o.forEach((x) => { x.a = s0 + (x.a - s0) * k; x.b = s0 + (x.b - s0) * k })
    }
    return o
  }

  const OPS = Array.from({ length: NB }, (_, i) => opsFor(i))
  const IO = OPS.map((ops) => [Math.min(...ops.map((o) => o.a)), Math.max(...ops.map((o) => o.b))])
  window.OCR_OPS = OPS.flat().map(({ a, b, kind, red, s }) => ({ a, b, kind, red: !!red, s: s || '' }))
  window.OCR_IO = IO

  // camera: hold on a beat from its first mark until its last mark is down, then scroll to the next.
  // CAMXS / CAMDY / ZS are MEASURED from beat-end stills (ink bbox) and fit the TikTok/Reels safe box
  // x 140-940, y 230-1500 (scripts/measure_ink.py), not guessed.
  const CAMXS = window.OCR_CAMXS || [605, 600, 600, 600, 619, 597, 613, 600]
  const CAMDY = window.OCR_CAMDY || [-113, -109, -76, -41, -250, -285, -100, -268]
  const ZS = window.OCR_ZS || [1.151, 1.135, 1.072, 1.047, 1.211, 1.159, 1.17, 1.11]
  const CAMKEYS = []
  IO.forEach(([tin, tout], i) => {
    CAMKEYS.push([Math.max(0, tin - 0.2), CAMXS[i], YC(i) + CAMDY[i], ZS[i]])
    CAMKEYS.push([tout + 0.15, CAMXS[i], YC(i) + CAMDY[i] + 12, ZS[i] * 1.004])
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

  // ---------------------------------------------------------------- the board itself
  const COLH = YC(NB - 1) + 1200
  const ghostNotes = (gc, wl) => {
    const T = (f, s, x, y) => { gc.font = f; gc.fillText(s, x, y) }
    T('400 52px "Permanent Marker"', 'SPRINT 14', 640, 1810); T('700 34px "Kalam"', '- fix login bug', 660, 1872)
    wl([[630, 1830], [840, 1826], [980, 1822]], 1)
    gc.beginPath(); gc.arc(250, 3620, 66, 0, 7); gc.stroke()
    wl([[640, 3660], [700, 3600], [760, 3630], [860, 3540]], 2); T('700 30px "Kalam"', 'latency / ms', 650, 3700)
    T('400 40px "Permanent Marker"', 'Q4 OKRs', 680, 7240); wl([[670, 7262], [860, 7258]], 3, 1.4)
    gc.beginPath(); gc.rect(220, 9080, 150, 80); gc.stroke(); T('700 30px "Kalam"', 'step 2', 250, 9130)
    T('400 44px "Permanent Marker"', 'standup 9:30', 560, 10890); wl([[540, 10910], [900, 10904]], 5, 1)
    T('700 34px "Kalam"', '- demo Fri', 240, 12680); T('700 34px "Kalam"', '- retro', 240, 12724)
  }

  // ---------------------------------------------------------------- draw
  function explainer(ctx, W, H_, t) {
    const [cx, cy, z] = camAt(t)
    const vx0 = cx - W / 2 / z, vx1 = cx + W / 2 / z, vy0 = cy - H_ / 2 / z, vy1 = cy + H_ / 2 / z
    const vp = [vx0, vy0, vx1, vy1]
    const apply = (c) => { c.translate(W / 2, H_ / 2); c.scale(z, z); c.translate(-cx, -cy) }
    const toS = ([x, y]) => [(x - cx) * z + W / 2, (y - cy) * z + H_ / 2]

    B.boardBg(ctx, W, H_)
    ctx.save(); apply(ctx)
    B.residue(ctx, vy0, vy1, COLH)
    if (!window.OCR_NO_GHOST) B.ghost(ctx, COLH, ghostNotes)
    ctx.restore()

    B.TIP = null
    let tip = null, tipCol = null
    const run = (c, ops) => ops.forEach((op) => {
      const p = win(t, op.a, op.b)
      if (p <= 0) return
      B.TIP = null
      op.fn(c, vp, p, t)
      if (p < 1 && B.TIP && isFinite(B.TIP[0]) && isFinite(B.TIP[1])) { tip = [B.TIP[0], B.TIP[1]]; tipCol = B.TIP[2] }
    })
    const near = (bi) => Math.abs(YC(bi) - cy) < 2400
    ctx.save(); apply(ctx)
    OPS.forEach((ops, bi) => { if (near(bi)) run(ctx, ops) })
    ctx.restore()

    B.gloss(ctx, W, H_, cy)
    if (tip && !window.OCR_NO_PEN) { const [px, py] = toS(tip); B.markerInHand(ctx, px, py, tipCol) }
    B.finish(ctx, W, H_, t)
  }

  window.VIDEOS = window.VIDEOS || {}
  window.VIDEOS['thai-ocr'] = { ...window.VIDEOS['thai-ocr'], draw: explainer, duration: DURATION, width: VW, height: VH, voice: 'thai-ocr-voice.mp3' }
})()
