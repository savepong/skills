#!/usr/bin/env python3
"""Assemble a self-recorded narration from several takes into out/voice.mp3 + out/timing.json
(same layout as build_voice*.py / split_recording.py: lead_in, gap, tail from narration.json).

takes.json: [{"file": "...", "start": 0.97, "end": 12.66}, ...]  one entry per beat, in order.
Times are the voiced span (from silencedetect); a small pad is added so consonants are not clipped.
Usage: python3 assemble_takes.py [takes.json]
"""
import json, re, subprocess, sys
from pathlib import Path

HERE = Path(__file__).parent
cfg = json.loads((HERE / 'narration.json').read_text())
takes = json.loads((HERE / (sys.argv[1] if len(sys.argv) > 1 else 'takes.json')).read_text())
if len(takes) != len(cfg['beats']):
    sys.exit(f"{len(takes)} takes for {len(cfg['beats'])} beats")

out = HERE / 'out'; clips = out / 'clips-rec'; clips.mkdir(parents=True, exist_ok=True)
PAD_IN, PAD_OUT = 0.10, 0.18          # keep breath-in onset and word tails
# Mid-sentence pauses longer than MAX_PAUSE are shortened to MAX_PAUSE (speech itself is never sped up).
MAX_PAUSE = float(cfg.get('max_pause', 0.35))
BEAT_LUFS = float(cfg.get('beat_lufs', -26))


def tighten(src, a, b):
    """Return an atrim/concat filter keeping [a,b] of src with every internal pause > MAX_PAUSE cut to MAX_PAUSE
    (the cut is taken from the middle of the pause so word tails and breath onsets survive)."""
    log = subprocess.run(['ffmpeg', '-hide_banner', '-ss', f'{a}', '-to', f'{b}', '-i', src, '-af',
                          f'silencedetect=noise=-35dB:d={MAX_PAUSE}', '-f', 'null', '-'], capture_output=True, text=True).stderr
    ss = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', log)]
    ee = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', log)]
    keep, cur, L = [], 0.0, b - a
    for s0, e0 in zip(ss, ee):
        if s0 <= 0.01 or e0 >= L - 0.01 or MAX_PAUSE <= 0:
            continue                      # lead/tail silence is handled by the pads
        mid_cut_from = s0 + MAX_PAUSE / 2; mid_cut_to = e0 - MAX_PAUSE / 2
        keep.append((cur, mid_cut_from)); cur = mid_cut_to
    keep.append((cur, L))
    parts = ''.join(f'[0]atrim={x:.3f}:{y:.3f},asetpts=PTS-STARTPTS[k{n}];' for n, (x, y) in enumerate(keep))
    return parts + ''.join(f'[k{n}]' for n in range(len(keep))) + f'concat=n={len(keep)}:v=0:a=1', len(keep) - 1
t = cfg['lead_in']; beats = []; parts = []
for i, tk in enumerate(takes):
    dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', tk['file']]))
    a = max(0.0, tk['start'] - PAD_IN); b = min(dur, tk['end'] + PAD_OUT)
    c = clips / f'{i:02d}.wav'
    fc, ncut = tighten(tk['file'], a, b)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{a}', '-to', f'{b}', '-i', tk['file'], '-filter_complex',
                    fc + ',highpass=f=70,afade=t=in:d=0.03,areverse,afade=t=in:d=0.06,areverse', '-ac', '1', '-ar', '48000', str(c)], check=True)
    # Level-match every beat (takes come from different files/sessions) before they are joined.
    lu = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', subprocess.run(['ffmpeg', '-hide_banner', '-i', str(c), '-af', 'ebur128',
               '-f', 'null', '-'], capture_output=True, text=True).stderr)[-1])
    tmp = c.with_suffix('.lv.wav')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(c), '-af', f'volume={BEAT_LUFS - lu:.2f}dB', str(tmp)], check=True)
    tmp.replace(c)
    d = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(c)]))
    beats.append({'i': i + 1, 'start': round(t, 3), 'end': round(t + d, 3), 'text': cfg['beats'][i],
                  'source': Path(tk['file']).name, 'pauses_shortened': ncut, 'gain_db': round(BEAT_LUFS - lu, 2), 'src_in': round(a, 3), 'src_out': round(b, 3)})
    parts.append((c, t)); t += d + cfg['gap']
total = t - cfg['gap'] + cfg['tail']
inputs = []; flt = []
for k, (c, st) in enumerate(parts):
    inputs += ['-i', str(c)]; flt.append(f'[{k}]adelay={int(round(st * 1000))}[d{k}]')
flt.append(''.join(f'[d{k}]' for k in range(len(parts))) +
           f'amix=inputs={len(parts)}:normalize=0,apad=whole_dur={total}')
mix = out / 'mix.wav'
subprocess.run(['ffmpeg', '-v', 'error', '-y', *inputs, '-filter_complex', ';'.join(flt), '-ar', '48000', '-t', f'{total}', str(mix)], check=True)
# Speech crest is ~22 dB, so loudnorm alone stops short at the true-peak cap; a gentle compressor first gets ~-17.8 LUFS.
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(mix), '-af',
                'acompressor=threshold=-30dB:ratio=4:attack=5:release=100:makeup=6dB,loudnorm=I=-16:TP=-1.5:LRA=7',
                '-ar', '48000', '-b:a', '192k', str(out / 'voice.mp3')], check=True)
(out / 'timing.json').write_text(json.dumps({'duration': round(total, 3), 'beats': beats}, ensure_ascii=False, indent=2))
for bt in beats:
    print(f"  beat {bt['i']}: {bt['start']:6.2f} -> {bt['end']:6.2f}  ({bt['end'] - bt['start']:.2f}s)  {bt['source']} {bt['src_in']}-{bt['src_out']}")
print(f'total {total:.2f}s -> {out / "voice.mp3"}')
