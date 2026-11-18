---
name: create-short-video
description: Use when making a short vertical (9:16) Thai explainer clip for Reels, Shorts or TikTok — news, tool review or demo, concept, how-to. Hand-drawn style, voice recorded by the owner, rendered with Remotion.
---

# Explainer short (9:16, ~60-90 s, Thai voice, any topic)

Runbook for a vertical explainer: news, a tool or repo review, a concept, a how-to, or a demo of something the owner built. Build mechanics and style porting live in the `create-video` skill; load it before step 4. Voice engines and their quirks: `references/voice-options.md`.

Requires: `bun`, `ffmpeg`/`ffprobe`, `python3`, and for `measure_ink.py` Pillow + numpy (`uv run --with pillow --with numpy ...`). Thai prose polish uses the `kien-thai` and `kode-thai` skills (`npx skills add chakrit/kien-thai`).

## Defaults (no need to re-ask)
- 9:16, 1080x1920, 8-10 beats, about 60 s (Shorts allow up to 3 min; a self-read script usually lands at 80-90 s)
- Style: the last Atlas style the owner approved. Kits in the template: Ballpoint (`src/style/ballpoint.js`, window.BP) and Whiteboard (`src/style/whiteboard.js`, window.WB). A new style needs the pasted Futurepedia AI Style Atlas prompt.
- Visuals drawn in code. Real logos only for the subject and as source credits. No news photos. Exception: when the subject is a live web demo, mix real browser screenshots you capture yourself for the "see it work" beats with drawn beats for the mechanism.
- **Voice: the owner records it himself.** Hand over `read-script.md`, he drops a recording, `scripts/split_recording.py` or `scripts/assemble_takes.py` cuts it into beats. Synthetic voices only if he asks (`references/voice-options.md`).
- No emoji, no API keys, cite sources.

## Pick the story shape first
Shapes and beat templates: `templates/story-shapes.md`.

| Shape | Use for | Live re-check |
|---|---|---|
| News | Something happened, may still be happening | Yes, before render |
| Tool review / demo | A repo, app or product: what it does and the catch | Run it yourself |
| Concept | How something works | No |
| How-to | Steps to do something | No, but test the steps |

## Steps and approval gates
0. **Topic pick.** Prefer stories with a mechanism to draw over who-did-what news; skip scandal/gossip and fresh lawsuits with nothing yet to explain. Give 3-4 ranked picks with why, and say they come from headlines not yet verified. Check `date` first.
   - **Freshness:** a news clip that cannot ship within ~1-2 days of the event is stale; say so before investing. Offer instead: wait for the primary follow-up (e.g. a post-incident report), or recast as an evergreen Concept clip using the incident as an example.
1. **Research.** Read the primary source (repo, docs, status page, official post) plus outlets. Keep three labels apart: verified by me / claimed by the source / my read.
   - **Handoff issues/briefs:** verify every "current state" claim against live state (is the PR merged, is the URL up, is the file where it says). Read files from GitHub (`gh api repos/O/R/contents/PATH -H 'Accept: application/vnd.github.raw'`) rather than pulling or checking out the owner's local repo.
   - **Demos:** run the real thing in a browser, reproduce any stated numbers, and measure asset sizes (`curl -sIL ... content-length`) instead of trusting estimates hardcoded in source. Report mismatches in a claim/actual table.
   - **"No server" / privacy claims:** list the page's network requests (`performance.getEntriesByType('resource')`). Hosting analytics beacons (e.g. Cloudflare `/cdn-cgi/rum`) show up in a DevTools shot; filter to fetch or explain them on screen.
2. **Script** from the shape's template, numbers as words, length hit by cutting words never by speeding up. Write `read-script.md` (numbered beats, one breath each).
   - **News = inverted pyramid:** beat 1 is a complete lead (who, did what, when) that stands alone; then most to least important; attribute every claim ("X ระบุว่า", "ด้าน ... เชื่อว่า"); no opinion or moral in the voice, takeaways go in the caption.
   - Credits and URLs the brief requires go in the last beat and on screen.
   - **Polish with `kien-thai` via the `kode-thai` loop:** audit, cite rule slugs, fix, re-read, repeat until one pass finds nothing. Spoken explainers by the owner = personal-blog register, male: ผม, ครับ only at sign-off, คุณ for the viewer, เรา for the team. Recurring fixes in model drafts: เรา drifting between builder and viewer (`deixis-continuity`), ทิ้ง for "drop" (`verb-calque`), dangling "ไม่ใช่ X เป็น Y" without ต่างหาก (`f4/targhak-closure`), mixed เมกะ/เมกะไบต์ (one form per term), repeated ก็เลย/พอ across adjacent beats.
3. **Voice -> GATE 1 (owner listens).** Recording instructions (QuickTime > File > New Audio Recording, Quality Maximum, not AirPods; or iPhone Voice Memos + AirDrop): pause **~2 s** between beats, clearly longer than a breath (self-recorded gaps came out 0.6-0.9 s, the same as mid-sentence breaths, so no threshold split them into exactly N); re-read a fluffed beat immediately; read English names naturally. Offer to check a 10 s test of beat 1 first.
   - **Find the recording:** he may drop several files (takes) into a subfolder and say only "done". Search the project folder recursively plus `find ~ -mmin -30 -iname '*.m4a'`, then per file report duration, `volumedetect` mean/max and silence map before cutting. Quote paths in loops (Voice Memos names contain spaces).
   - **One file:** `python3 split_recording.py <file>`; it stops unless it finds exactly N beats. If no threshold gives the right count, do not force a cut: ask for rough beat start times and snap each cut to the nearest silence.
   - **Several files / retakes:** ask which file is which beat, then `assemble_takes.py` with a `takes.json` of {file, start, end} per beat. Split a multi-beat file at its longest silences and sanity-check each cut against the speaking rate of the single-beat files (~11 Thai chars/s); flag beats whose voiced time is >20% short (possible skipped words). It level-matches every beat (`beat_lufs`), shortens mid-sentence pauses to `max_pause` by cutting the middle of each pause (ffmpeg `silenceremove` barely does this), then compresses before loudnorm (speech crest ~22 dB; lands near -18 LUFS at TP -1.5).
4. **Storyboard -> GATE 2 (owner approves).** Stills at each beat's finish time as one contact sheet plus full-res PNGs. List anything assumed or illustrative.
   - **Measure framing from pixels, never by eye** (eyeballing once missed a uniform right shift). `scripts/measure_ink.py --z .. --camx .. --camdy .. stills...` fits each beat's ink inside the **TikTok/Reels safe box x 140-940, y 230-1500** (content spilled under the app UI otherwise) and prints corrected CAMXS/CAMDY/ZS; one re-measure pass leaves >= 8 px margin. Ship a `storyboard-sheet-safezone.png` with the unsafe bands tinted (ffmpeg `drawbox`).
   - Take each still right after that beat's LAST mark (its IO end), not at next-beat-start minus a constant: a beat that finishes early is already scrolling away and measures wildly off.
   - **Showing OCR / text-recognition errors:** loopless Thai faces (Sriracha, Mali, most UI fonts) draw น like Latin u and บ/ป like U, so a wrong read such as `Qนotation` LOOKS correct on screen and to vision checks. Verify strings via JS text, not screenshots; draw wrong reads in **Itim** (looped, OFL, bundled in the template) and ring the flipped glyph using measureText. `WB.mText` takes a hex colour: pass `B.hexOf(RED)`, not the RGB array.
5. **Render and verify.** `bun run render <slug>`. Frames == duration x 30; voice LUFS in the mp4 == voice file (narration muxed); score ~20+ dB under the voice; mid-draw stills (not beat ends) to check the pen sits on the ink and nothing leaves the safe box. For News, re-read the primary source first and update the on-screen time stamp.
6. **Deliver** to `~/Downloads/<slug>-video/`: full mp4, `-small.mp4` (CRF 24), score wav, captions from `templates/captions.md`. Give absolute paths.
7. **Publishing.** Never publish publicly for the owner. If uploading for him, set Private and tick YouTube's "Altered or synthetic content" only when the voice is synthetic; he presses Publish. Otherwise give a copy-paste kit: file path, title, description, settings to tick.

## Scaffold
`scripts/new_short.sh <slug> [--out dir] [--from template] [--kits dir] [--no-install]` copies the bundled `template/` (Itim + Thai fonts, safe-box camera, render/stills scripts, reference videos) to `~/Videos/shorts/<slug>/` (or `$SHORT_VIDEOS_DIR`), keeps earlier videos as `_reference_*` to adapt, and copies the voice tools into `<slug>/voice/`. Dependencies install automatically (`--no-install` skips). Pass `--from <a finished project>` to start from your latest approved clip instead.

The Futurepedia Style Atlas material (H library, SOUND kit, prompts and the Ballpoint/Whiteboard kits ported from their reference code) is NOT in this skill — it belongs to Futurepedia. `new_short.sh` copies it from `$CODE_MOTION_KITS` (default `~/Videos/shorts/_kits/{src/lib,src/style,prompts}`). Without it: save the Atlas prompt to `proj/prompts/`, `bun run extract-kit prompts/<style>.md`, then port the style (`create-video`). Never commit those files.
