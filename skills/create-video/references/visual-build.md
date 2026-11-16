# Building the visuals (code-motion, hand-drawn styles, 9:16)

## Project setup
- Start a new video with `create-short-video`'s `scripts/new_short.sh` (bundled template) or by copying a previous working project (rsync without node_modules/out/old public media) and symlinking its node_modules — avoids reinstall and the upstream example's missing style files.
- Generate `src/videos/<id>/timing.js` from the voice build's `out/timing.json` (`window.<ID>_TIMING`), import it before visuals.js in `src/videos/index.ts`.
- Extra images (logos): add a `LOGOS` map in config.ts and decode them in VideoCanvas `loadAssets` into `window.LOGOS` so delayRender waits for them.
- Extend `FONT_SAMPLE` with every Thai glyph (U+0E01–U+0E5B) and the English words used, or some glyphs load late/fallback.

## Writing visuals.js
- Write every op RELATIVE to its beat's voice start (`push(a, b, kind, fn, {red, s})` with a,b offsets). Re-voicing a beat then moves its drawing automatically.
- Lay beats at a fixed board pitch via a SLOT table (`YC(i) = 960 + SLOT[i]*1800`); two beats sharing a slot = same spot, used for an erase-and-rewrite transition.
- Derive camera hold from each beat's first/last op, plus a per-beat content-centre offset.
- Auto-fit each beat: scale its op times so the last mark ends >= ~0.95 s before the next beat's voice; otherwise the camera scroll collapses to a jump cut (looks fine in stills, stutters in motion). Print per-beat draw window vs voice window and scroll length with a tiny bun script that stubs `window`/`H`/the kit and imports timing.js + visuals.js — catches this without rendering.
- Publish the op table (`window.<ID>_OPS` with kind/red/text) so score.js sonifies exactly what is drawn.
- `H.rng(seed)` returns a callable (`r()`, `r.range`) — there is no `r.next()`.
- Label any illustrative shape on screen ("graph shape is illustrative") when only the headline number is sourced.

## Porting a style (new Atlas prompt)
- Copy the reference's medium functions verbatim (stroke renderer, lettering, surface, ghost/residue, gloss/sheen, tool-in-hand, grain strength) into `src/style/<style>.js`; adapt only layout (1280x720 -> tall board: e.g. ceiling lights slide vertically with camY).
- Expose the previous kit's API names so beat code ports by swapping `window.BP` for the new kit. Kit text helpers return WIDTH; wrap them to return the pen tip.
- Map style idioms: whiteboard boxes are double-traced (no hatch shadow); fills are scribbled with the marker side; red X = two sharpie slashes.
- Erase transition (whiteboard): draw the erased beat on its own offscreen layer, `destination-out` the felt wipe path over it, add grey haze, show the eraser at the wipe head; score it as N scrub passes in the same window.
- Keep each video id separate (`<id>wb`) so the previous style still renders.

## Thai text in Latin-only styles
- Atlas fonts (Permanent Marker, Kalam, Fredoka...) have no Thai. Append a Thai face of the same feel to every font stack (`"Permanent Marker", "Sriracha"`; Mali for bubble/handwriting) so Latin keeps the style font and Thai falls back. Self-host: fetch the Google CSS with a browser UA, download only latin+thai woff2, keep the licence files.
- Reference lettering reveals per UTF-16 char, which detaches Thai vowels/tone marks (dotted circles). Step by grapheme cluster with `Intl.Segmenter('th', {granularity:'grapheme'})`.
- Verify Thai on a FULL-RES still, not the contact sheet — marks are too small to judge downscaled.

## Checking
- `bun run stills <id> <t...>` at each beat's finish time (plus one mid-transition frame), stitch with ffmpeg `xstack` into a contact sheet, inspect with vision; iterate on: oversized titles crossing rings/crosses, chip boxes narrower than their text, logos near the right edge, labels sitting on arrows.
- macOS has no `timeout` command; don't prefix bun with it.
- Deliver storyboard as `~/Downloads/<project>/storyboard[-<style>]/beat-N.png` + `storyboard-sheet.png`, with a beat table (time, on-screen text, visual), transition note, planned sounds, and an explicit assumptions list.
