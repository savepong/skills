# Voice options (when the owner does not self-record)

Default is the owner's own recording (see SKILL.md). Use these only when he asks.

## Spelling for any TTS
- Write every English word in Thai-accent spelling without การันต์ (ไมโครซอฟ, เว็บไซต์, เอ้าลุก, ทีม, โคไพล็อต, เซิฟเวอร์, อัพเกรด, โนชั่น, ไฟเวิร์ก, เอไอ); English stays on screen only. Self-recordings need none of this.
- Name a company at most ~3 times, else "บริษัท/คู่ค้า": a repeated foreign word is read differently each time.
- When a word keeps failing, do not re-render the whole clip hoping: run a reference-only A/B of 4 spellings per word in one carrier sentence, concat each set with 0.8 s silence, let the owner pick codes like `A1 B4`. Include a synonym option (เรียบร้อย for เสร็จ) since plain Thai words fail too.

## VoxCPM2 clone (local, offline, only with the speaker's consent)
- `scripts/build_voice_voxcpm.py`, run with a python that has `voxcpm`; set `VOXCPM_REF` (reference wav) and `VOXCPM_MODEL` (model dir). CPU INT8, seed 17, ~70 s per beat, clips cached by content hash, so an unchanged beat is NOT regenerated — say so when asking for a re-listen.
- Anchor beats 2+ to beat 1 (`prompt_wav` + `prompt_text`) or each beat drifts to a different voice; without the anchor, tones drifted to a Lao-sounding accent. Anchoring also propagates beat 1's mispronunciations.
- Weak at Thai tones with a 12 s reference. Stop after 2 failed drafts and offer self-recording; a longer (30-60 s) reference might help but is unproven.
- No direction tags. It writes provenance.json; captions must say the voice is synthesised (e.g. "เสียงสังเคราะห์จากเสียงของผมเอง").

## Paxa via tokenme
- `scripts/build_voice.py`: `paxa/paxa-tts-flash-v2` at `https://api.tokenme.limited/api/v1/audio/speech`, OpenAI-compatible; key from `TOKENME_API_KEY` or the .env named by `TOKENME_ENV_FILE`; calls curl (python.org urllib lacks a CA bundle) with the key passed on stdin, not argv.
- News voice the owner chose: `thongek` + `[อ่านข่าวแบบผู้ประกาศ น้ำเสียงหนักแน่น จริงจัง น่าเชื่อถือ]`. Non-news candidates (unheard): `chuchi`, `espresso`, `foithong`, `massaman` — audition 3-4.
- HTTP 403 `subscription_required` = plan lapsed, only the owner can fix; do not retry.
- The owner dislikes Edge TTS Niwat (unnatural pacing, English mispronounced).
