#!/usr/bin/env python3
"""Per-beat narration in Save's own cloned voice (local VoxCPM2, offline), stitched like build_voice.py.

Run with a python that has `voxcpm` installed (e.g. the OmniVoice VoxCPM2 venv). Set VOXCPM_REF to the
consenting speaker's reference wav and VOXCPM_MODEL to the model folder. CPU, INT8 dynamic quant on
base/residual LM, seed 17, cfg 2.0, 20 steps. Clips are cached by content hash; only changed beats are re-synthesised.
Writes out/voice.mp3, out/timing.json and out/provenance.json (synthetic-voice sidecar).
"""
import os
os.environ['HF_HUB_OFFLINE'] = '1'; os.environ['TRANSFORMERS_OFFLINE'] = '1'
import hashlib, json, random, subprocess, sys, time
from pathlib import Path
import numpy as np

HERE = Path(__file__).parent
OUT = HERE / 'out'; CLIPS = OUT / 'clips-voxcpm'; CLIPS.mkdir(parents=True, exist_ok=True)
if not os.environ.get('VOXCPM_REF') or not os.environ.get('VOXCPM_MODEL'):
    sys.exit('set VOXCPM_REF (reference wav of the consenting speaker) and VOXCPM_MODEL (model dir)')
REF = Path(os.path.expanduser(os.environ['VOXCPM_REF']))
MODEL = Path(os.path.expanduser(os.environ['VOXCPM_MODEL']))
SEED, CFG, STEPS = 17, 2.0, 20


def dur(p):
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(p)]).strip())


def main():
    cfg = json.loads((HERE / 'narration.json').read_text())
    refsha = hashlib.sha256(REF.read_bytes()).hexdigest()
    # Beat 1 is cloned from the reference alone; beats 2+ also continue from beat 1's audio
    # (prompt_wav + prompt_text), so timbre, pace and tone stay one voice across the whole read.
    todo = []
    for i, text in enumerate(cfg['beats']):
        anchor = '' if i == 0 else cfg['beats'][0]
        h = hashlib.sha1(f'voxcpm2|{refsha}|{SEED}|{CFG}|{STEPS}|{anchor}|{text}'.encode()).hexdigest()[:10]
        clip = CLIPS / f'{i:02d}-{h}.wav'
        todo.append((i, text, clip))
    missing = [x for x in todo if not x[2].exists()]
    timings = {}
    if missing:
        import torch, soundfile as sf
        from voxcpm import VoxCPM
        torch.set_num_threads(4); torch.set_num_interop_threads(1)
        t0 = time.monotonic()
        model = VoxCPM(voxcpm_model_path=str(MODEL), zipenhancer_model_path=None, enable_denoiser=False, optimize=False, device='cpu')
        torch.backends.quantized.engine = 'qnnpack'
        for part in [model.tts_model.base_lm, model.tts_model.residual_lm]:
            torch.ao.quantization.quantize_dynamic(part, {torch.nn.Linear}, dtype=torch.qint8, inplace=True)
        print(f'model loaded in {time.monotonic() - t0:.0f}s', flush=True)
        for i, text, clip in missing:
            random.seed(SEED); np.random.seed(SEED); torch.manual_seed(SEED)
            t1 = time.monotonic()
            anc = None if i == 0 else todo[0][2]
            if anc is not None and not anc.exists():
                raise SystemExit('beat 1 clip missing; it must be generated first')
            audio = np.asarray(model.generate(text=text, reference_wav_path=str(REF),
                                              prompt_wav_path=str(anc) if anc else None, prompt_text=cfg['beats'][0] if anc else None,
                                              cfg_value=CFG, inference_timesteps=STEPS, max_len=1200, retry_badcase=True), dtype=np.float32).squeeze()
            assert audio.ndim == 1 and audio.size > 0 and np.isfinite(audio).all() and np.sqrt(np.mean(audio ** 2)) > 1e-4
            sf.write(clip, audio, 48000, subtype='PCM_16')
            timings[i] = time.monotonic() - t1
            print(f'  beat {i + 1}: {audio.size / 48000:.2f}s audio in {timings[i]:.0f}s', flush=True)

    t = cfg['lead_in']; beats = []
    for i, text, clip in todo:
        d = dur(clip)
        beats.append({'i': i + 1, 'start': round(t, 3), 'end': round(t + d, 3), 'dur': round(d, 3), 'clip': str(clip), 'text': text})
        t += d + cfg['gap']
    total = round(beats[-1]['end'] + cfg['tail'], 3)
    inputs, chains = [], []
    for k, b in enumerate(beats):
        inputs += ['-i', b['clip']]; ms = int(round(b['start'] * 1000))
        chains.append(f'[{k}:a]aresample=48000,adelay={ms}|{ms}[a{k}]')
    mix = ''.join(f'[a{k}]' for k in range(len(beats)))
    fc = ';'.join(chains) + f';{mix}amix=inputs={len(beats)}:normalize=0,apad,atrim=0:{total},loudnorm=I=-18:TP=-2:LRA=11[out]'
    subprocess.run(['ffmpeg', '-y', '-v', 'error', *inputs, '-filter_complex', fc, '-map', '[out]', '-ac', '2', '-ar', '48000', '-b:a', '192k', str(OUT / 'voice.mp3')], check=True)
    (OUT / 'timing.json').write_text(json.dumps({'duration': total, 'beats': beats}, ensure_ascii=False, indent=2))
    (OUT / 'provenance.json').write_text(json.dumps({
        'engine': 'VoxCPM2 (local, offline)', 'model': str(MODEL), 'reference': str(REF), 'referenceSha256': refsha,
        'speaker': os.environ.get('VOXCPM_SPEAKER', 'owner of the reference voice (consent required)'), 'anchor': 'beats 2+ continue from beat 1 audio', 'synthetic': True,
        'seed': SEED, 'guidance': CFG, 'inferenceSteps': STEPS, 'device': 'cpu (INT8 dynamic quant on LM linears)',
        'watermark': 'Not applied; synthetic provenance recorded in this sidecar'}, ensure_ascii=False, indent=2))
    for b in beats:
        print(f"  beat {b['i']}: {b['start']:6.2f} -> {b['end']:6.2f}  ({b['dur']:.2f}s)")
    print(f'total {total:.2f}s -> {OUT / "voice.mp3"}')


if __name__ == '__main__':
    main()
