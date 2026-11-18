# savepong/skills

Agent skills for making short vertical Thai explainer videos as code (code-motion + Remotion).
Works with any agent that reads `SKILL.md` folders: Claude Code, Codex, Cursor, OpenCode, and
anything driven through T3 Code.

## Install

```sh
npx skills add savepong/skills                           # pick skills and agents interactively
npx skills add savepong/skills --skill create-short-video --skill create-video
npx skills add savepong/skills --list                    # see what is in the repo
```

Thai prose polish (used by `create-short-video` at the script step) comes from its upstream:

```sh
npx skills add chakrit/kien-thai --skill kien-thai --skill kode-thai
```

## Skills

| Skill | What it does |
| --- | --- |
| `create-short-video` | Runbook for a 9:16 Thai explainer (news, tool review/demo, concept, how-to): research, script, self-recorded voice, storyboard with pixel-measured framing inside the TikTok/Reels safe box, render, captions. Bundles a ready Remotion template (Ballpoint + Whiteboard kits, Itim/Sriracha/Mali Thai fonts) and the voice/measure scripts. |
| `create-video` | The build side: timing table, beat-relative drawing ops, camera, score from the op table, porting a new Futurepedia Style Atlas style, Thai text in Latin-only styles, render checks. |

## Requirements

`bun`, `ffmpeg`/`ffprobe`, `python3`; `uv` (or Pillow + numpy) for `measure_ink.py`.
First project: `scripts/new_short.sh <slug>` runs `bun install` by itself (Remotion pulls a headless
Chrome on first render).

Quick start after installing (needs your kits folder, see Licences):

```sh
bash ~/.claude/skills/create-short-video/scripts/new_short.sh my-first-short
# -> ~/Videos/shorts/my-first-short/{proj,voice}
```

(Path depends on where your agent installs skills; `npx skills` prints it.)

## Licences

- Skills and scripts: MIT (see `LICENSE`).
- **Not included:** the Futurepedia AI Style Atlas material — the `H` helper library, the `SOUND` kit,
  style prompts and the drawing kits ported from their reference code (`src/lib`, `src/style`,
  `prompts`). They belong to Futurepedia. Keep your own copy in `~/Videos/shorts/_kits/` (or
  `$CODE_MOTION_KITS`) and `new_short.sh` copies it into each project; without it, save a Style Atlas
  prompt and run `bun run extract-kit prompts/<style>.md`, then port the style (see `create-video`).
- Workflow ideas build on [savepong/code-motion-skill](https://github.com/savepong/code-motion-skill) (MIT).
- Fonts in `template/proj/public/fonts` are SIL Open Font License 1.1; each licence file sits next to
  the fonts (Itim, Kalam, Permanent Marker, Sriracha, Mali).
