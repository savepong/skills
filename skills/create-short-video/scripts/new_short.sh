#!/usr/bin/env bash
# Scaffold a new vertical explainer project from the bundled template (or another project).
# Usage: new_short.sh <slug> [--out <dir>] [--from <template dir containing proj/>] [--no-install]
#   --out      parent folder for projects (default: $SHORT_VIDEOS_DIR or ~/Videos/shorts)
#   --from     template to copy (default: ../template next to this script)
#   --no-install  skip dependencies. By default node_modules is symlinked when the template has one,
#              otherwise `bun install` runs (a project without it fails at the first `bun run stills`)
#   --kits     folder holding src/lib (Futurepedia H + SOUND) and src/style (ported kits) and prompts/;
#              default $CODE_MOTION_KITS or ~/Videos/shorts/_kits. These are third-party and never ship
#              with the skill; without them you are told how to extract and port them from a Style Atlas prompt.
set -euo pipefail
SLUG="${1:?usage: new_short.sh <slug> [--out dir] [--from dir] [--install]}"; shift
HERE="$(cd "$(dirname "$0")" && pwd)"
TPL="$HERE/../template"; OUT="${SHORT_VIDEOS_DIR:-$HOME/Videos/shorts}"; INSTALL=0
KITS="${CODE_MOTION_KITS:-$HOME/Videos/shorts/_kits}"
while [ $# -gt 0 ]; do case "$1" in
  --out) OUT="$2"; shift 2;; --from) TPL="$2"; shift 2;; --install) INSTALL=1; shift;; --no-install) INSTALL=-1; shift;; --kits) KITS="$2"; shift 2;;
  *) echo "unknown option $1" >&2; exit 2;; esac; done
DST="$OUT/$SLUG"
[ -e "$DST" ] && { echo "exists: $DST" >&2; exit 1; }
[ -d "$TPL/proj" ] || { echo "template project not found: $TPL/proj" >&2; exit 1; }
mkdir -p "$DST/proj" "$DST/voice"

# project shell: kits, fonts, scripts, Root/VideoCanvas; no old story, renders, audio or logos
rsync -a --exclude node_modules --exclude out --exclude 'src/videos/*/' \
  --exclude 'public/*.wav' --exclude 'public/*.mp3' --exclude 'public/logos/*' --exclude 'public/shots' "$TPL/proj/" "$DST/proj/"
mkdir -p "$DST/proj/src/videos/$SLUG" "$DST/proj/public/logos" "$DST/proj/out"
# third-party drawing/sound kits: from a template that has them, else from the local kits folder
NEED_KITS=""
for k in src/lib src/style prompts; do
  if [ -d "$TPL/proj/$k" ]; then :          # already copied by rsync
  elif [ -d "$KITS/$k" ]; then mkdir -p "$DST/proj/$k" && cp -R "$KITS/$k/." "$DST/proj/$k/"
  else NEED_KITS=1; fi
done
# previous videos become _reference_* folders to adapt (drawing recipes, camera, score)
for d in "$TPL"/proj/src/videos/*/; do n=$(basename "$d"); case "$n" in _reference_*) cp -R "$d" "$DST/proj/src/videos/$n";; *) cp -R "$d" "$DST/proj/src/videos/_reference_$n";; esac; done

# voice tools: self-recording (default) plus the optional TTS builders
cp "$HERE/split_recording.py" "$HERE/assemble_takes.py" "$HERE/build_voice.py" "$HERE/build_voice_voxcpm.py" "$DST/voice/"
python3 - "$DST/voice/narration.json" <<'PY'
import json,sys
json.dump({"model":"self-recorded","voice":"","direction":"","gap":0.3,"lead_in":0.5,"tail":1.2,
           "max_pause":0.3,"beat_lufs":-26,"beats":[]},open(sys.argv[1],"w"),ensure_ascii=False,indent=2)
PY

cat > "$DST/proj/src/videos/index.ts" <<EOF
// Plain browser scripts that publish window globals. Order matters: lib, kits, timing, then the video.
import "../lib/harness.js"
import "../lib/sound.js"
import "../style/ballpoint.js"
import "../style/whiteboard.js"
import "./$SLUG/timing.js"
import "./$SLUG/visuals.js"
import "./$SLUG/score.js"

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void
type OfflineResult = { inter: Float32Array; peak: number; sr: number }

declare global {
  interface Window {
    VIDEOS: Record<string, { draw: Draw; duration: number; score: unknown; width?: number; height?: number; fps?: number; voice?: string }>
    SOUND: { renderOffline: (score: unknown, duration: number, sampleRate: number, opts: object) => Promise<OfflineResult> }
    LOGO: HTMLImageElement | null
    LOGOS: Record<string, HTMLImageElement>
  }
}

export const VIDEOS = window.VIDEOS
EOF
python3 - "$DST/proj/src/config.ts" <<'PY'
import re,sys
p=sys.argv[1]; s=open(p).read()
s=re.sub(r'export const LOGOS: Record<string, string> = \{.*?\}', 'export const LOGOS: Record<string, string> = {}', s, flags=re.S)
open(p,'w').write(s)
PY

if [ "$INSTALL" = 1 ]; then (cd "$DST/proj" && bun install)
elif [ -d "$TPL/proj/node_modules" ] && [ "$INSTALL" != -1 ]; then ln -sfn "$(cd "$TPL/proj/node_modules" && pwd -P)" "$DST/proj/node_modules"
elif [ "$INSTALL" != -1 ] && command -v bun >/dev/null; then (cd "$DST/proj" && bun install) || echo "bun install failed; run it yourself (step 0 below)" >&2
fi
NEED_INSTALL=""
[ -n "$NEED_KITS" ] && NEED_INSTALL="  0a. kits missing (src/lib, src/style): save a Style Atlas prompt as proj/prompts/<style>.md,
      cd $DST/proj && bun run extract-kit prompts/<style>.md, then port the style into src/style/
      (create-video skill). Keep them in \$CODE_MOTION_KITS for next time.
"
[ -e "$DST/proj/node_modules" ] || NEED_INSTALL="${NEED_INSTALL}  0. cd $DST/proj && bun install   (Remotion + headless Chrome, first time only)
"

cat <<EOF
scaffolded: $DST
next:
${NEED_INSTALL}  1. write the script as $DST/read-script.md; fill voice/narration.json "beats"
  2. self-recorded voice: cd $DST/voice && python3 split_recording.py <recording>
     (several takes: write takes.json, then python3 assemble_takes.py)
  3. cp voice/out/voice.mp3 proj/public/$SLUG-voice.mp3; write proj/src/videos/$SLUG/timing.js from voice/out/timing.json
  4. write proj/src/videos/$SLUG/{visuals,score}.js (adapt a _reference_* folder); set window.VIDEOS['$SLUG']
  5. cd $DST/proj && bun run stills $SLUG <beat end times>; uv run --with pillow --with numpy $HERE/measure_ink.py ...; then bun run render $SLUG
EOF
