#!/usr/bin/env python3
"""Split a self-recorded narration into beats by silence, then build out/voice.mp3 + out/timing.json
with the same layout as build_voice*.py (lead_in, gap, tail from narration.json).
Usage: python3 split_recording.py <recording> [--db -35] [--min-sil 0.6]
Prints detected segments; if the count != number of beats it stops so a human can pick takes."""
import json, re, subprocess, sys
from pathlib import Path

HERE = Path(__file__).parent
args = sys.argv[1:]
src = Path(args[0]); db = -35.0; min_sil = 0.6
if '--db' in args: db = float(args[args.index('--db') + 1])
if '--min-sil' in args: min_sil = float(args[args.index('--min-sil') + 1])
cfg = json.loads((HERE / 'narration.json').read_text())
n = len(cfg['beats'])

dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(src)]))
log = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(src), '-af', f'silencedetect=noise={db}dB:d={min_sil}', '-f', 'null', '-'],
                     capture_output=True, text=True).stderr
starts = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', log)]
ends = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', log)]
segs = []
cur = 0.0
for s, e in zip(starts, ends + [dur]):
    if s - cur > 0.3: segs.append((cur, s))
    cur = e
if dur - cur > 0.3: segs.append((cur, dur))
for i, (a, b) in enumerate(segs): print(f'seg {i + 1}: {a:6.2f} -> {b:6.2f} ({b - a:.2f}s)')
if len(segs) != n:
    sys.exit(f'found {len(segs)} segments, need {n}: adjust --db/--min-sil or pick takes by hand')

out = HERE / 'out'; clips = out / 'clips-rec'; clips.mkdir(parents=True, exist_ok=True)
pad = 0.08
t = cfg['lead_in']; beats = []; parts = []
for i, (a, b) in enumerate(segs):
    a = max(0, a - pad); b = min(dur, b + pad)
    c = clips / f'{i:02d}.wav'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(src), '-ss', f'{a}', '-to', f'{b}', '-ac', '1', '-ar', '48000',
                    '-af', 'highpass=f=70,afade=t=in:d=0.02,areverse,afade=t=in:d=0.04,areverse', str(c)], check=True)
    d = b - a
    beats.append({'i': i + 1, 'start': round(t, 3), 'end': round(t + d, 3), 'text': cfg['beats'][i]})
    parts.append((c, t)); t += d + cfg['gap']
total = t - cfg['gap'] + cfg['tail']
inputs = []; flt = []
for k, (c, st) in enumerate(parts):
    inputs += ['-i', str(c)]; flt.append(f'[{k}]adelay={int(st * 1000)}[d{k}]')
flt.append(''.join(f'[d{k}]' for k in range(len(parts))) + f'amix=inputs={len(parts)}:normalize=0,apad=whole_dur={total},loudnorm=I=-16:TP=-1.5:LRA=11')
subprocess.run(['ffmpeg', '-v', 'error', '-y', *inputs, '-filter_complex', ';'.join(flt), '-ar', '48000', '-b:a', '192k', str(out / 'voice.mp3')], check=True)
(out / 'timing.json').write_text(json.dumps({'duration': round(total, 3), 'beats': beats}, ensure_ascii=False, indent=2))
for b in beats: print(f"  beat {b['i']}: {b['start']:6.2f} -> {b['end']:6.2f}")
print(f'total {total:.2f}s -> {out / "voice.mp3"}')
