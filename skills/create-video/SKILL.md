---
name: create-video
description: Use when building a narrated explainer video as code (code-motion + Remotion, hand-drawn canvas styles, Thai narration). Covers timing, drawing, camera, score, style porting and render checks. Voice first.
---

# Narrated explainer video as code (code-motion + Remotion)

Videos are drawn on a canvas as a pure function of time (`draw(ctx, W, H, t)`), scored with the code-motion SOUND kit, and rendered by Remotion. The starting project lives in the `create-short-video` skill (`template/`, scaffolded by `scripts/new_short.sh`); the drawing kits come from the code-motion skill (savepong/code-motion-skill). Detailed build notes: `references/visual-build.md`.

## Procedure
1. **Facts first.** Re-check the story right before writing the script — live news moves within hours. Every on-screen number needs a source; label crowd-sourced counts (Downdetector reports are reports, not affected users).
2. **Voice first, before any drawing.** Narration is independent of the visual style; get it approved before drawing. Changing a script after visuals exist means re-timing everything. Default voice is the owner's own recording (`create-short-video` step 3); TTS options are in `create-short-video/references/voice-options.md`.
3. **Hit the length by cutting words, not speeding up.** Say what was cut.
4. **One timing table.** The voice build emits `out/timing.json` (per-beat start/end); generate `src/videos/<id>/timing.js` from it; visuals.js and score.js both read it.
5. Storyboard (wait for approval) -> build -> stills at each beat's finish time -> render -> verify with ffprobe and ebur128/volumedetect.
6. **Re-check live status before the final render** and update any "as of" stamp on screen.

## Build lessons
- Write every op RELATIVE to its beat start. Publish the op table (`{a,b,kind,red,s}`) as a window global and let score.js sonify it by `kind` — no second list of times to keep in sync.
- Auto-fit each beat so its last stroke ends >= 0.95 s before the next beat's voice starts; otherwise the camera scroll collapses to a jump cut.
- Camera x / y / zoom per beat come from MEASURED ink bounding boxes (`create-short-video/scripts/measure_ink.py`), fitted to the TikTok/Reels safe box, never from eyeballing.
- `bun run render` can fail once with Remotion's Chrome closing (`_onClosed`); re-run once before debugging. `[Tab N, harness.js:72]` lines are H.grain's getImageData console noise.
- Verify: frames == duration x 30; mp4 voice loudness == voice file (narration muxed); score well under the voice.

## Switching Atlas style
- The owner picks styles from the Futurepedia AI Style Atlas and pastes the full prompt (reference code + H + SOUND). A name alone is not enough — ask for the paste.
- Reuse script, voice, timing, facts and logos; rebuild only the drawing kit and the score. Port the medium into `src/style/<style>.js` exposing the SAME call shape as the previous kit (stroke, label, bubbleText, crossOut, ring, hatchFill, finish...) so visuals.js only swaps its kit. Keep each video id separate so the previous style still renders.
- Use the medium's own scene change once where the story turns (whiteboard: felt-eraser wipe of the rumour beat, the real cause written in the same slot; draw that beat on its own layer and `destination-out` the wipe), not on every beat.
- Atlas text helpers step per UTF-16 char, so Thai vowels/tone marks render as dotted circles: step by grapheme cluster with `Intl.Segmenter('th', {granularity:'grapheme'})`.
- Latin-only Atlas fonts: append a Thai face to the stack (`"Permanent Marker", "Sriracha"`) so Thai falls back per glyph; self-host woff2 (Google CSS fetched with a browser UA) and add to fonts.css + FONT_SPECS. For Thai that must be read glyph by glyph (OCR errors, spelling), use Itim: loopless faces make น look like u.
- Pen/marker-in-hand must follow the ink itself: have the low-level stroke and text functions record the point they just laid down (`WB.TIP = [x, y, colour]` while progress < 1), reset before each op, read after. Ops that grow a drawn shape (a fill bar widening) set the tip at the leading edge themselves. Text tip height ~0.32 x font size. Check the pen with stills at MID-draw times.

## Images and logos
- Real logos: fetch PNGs from Wikimedia Commons via `https://commons.wikimedia.org/wiki/Special:FilePath/<File.svg>?width=800` with a descriptive User-Agent; draw `source-over` as a taped paper clipping so they keep their colours.
- Do not use photos from news articles even with credit (usually agency-licensed). Use outlet logos only as a source credit; draw illustrations in code; quote official statements as text.
- Screenshots of a live demo you captured yourself are fine for that demo's own clip; do not use them to show recognised text (see the Itim note).

## Delivery
- Deliverables in `~/Downloads/<project>/` with absolute paths: full mp4, `-small.mp4` (CRF 24), score wav, captions, storyboard PNGs.
- Present the script as a table (beat, time, text) and say what was verified vs. not.
