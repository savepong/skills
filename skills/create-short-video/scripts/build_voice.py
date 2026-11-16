#!/usr/bin/env python3
"""Per-beat Paxa TTS via tokenme -> stitched voice.mp3 + timing.json (cached by content hash). Run in the dir holding narration.json."""
import hashlib, json, re, subprocess, sys
from pathlib import Path

HERE = Path.cwd(); OUT = HERE / "out"; CLIPS = OUT / "clips"
CLIPS.mkdir(parents=True, exist_ok=True)
API = "https://api.tokenme.limited/api/v1/audio/speech"

def load_key():
    # TOKENME_API_KEY from the environment, else from the .env file named by TOKENME_ENV_FILE (default ./.env)
    import os
    if os.environ.get("TOKENME_API_KEY"): return os.environ["TOKENME_API_KEY"].strip()
    env = Path(os.path.expanduser(os.environ.get("TOKENME_ENV_FILE", ".env")))
    if not env.exists(): sys.exit("TOKENME_API_KEY not set (export it or point TOKENME_ENV_FILE at a .env)")
    for line in env.read_text().splitlines():
        m = re.match(r"\s*(?:export\s+)?TOKENME_API_KEY=(.*)", line)
        if m: return m.group(1).strip().strip("'\"")
    sys.exit("TOKENME_API_KEY not found")

def dur(p):
    return float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",str(p)]).strip())

def synth(key, cfg, text, path):
    body = json.dumps({"model": cfg["model"], "voice": cfg["voice"], "response_format": "mp3",
                       "input": f'{cfg.get("direction","")} {text}'.strip()})
    tmp = path.with_suffix(".part")
    r = subprocess.run(["curl","-s","-m","120","-o",str(tmp),"-w","%{http_code}",API,"-H","@-",
                        "-H","Content-Type: application/json","--data-binary",body],
                       input=f"Authorization: Bearer {key}\n", capture_output=True, text=True)
    if r.stdout.strip() != "200":
        msg = tmp.read_bytes()[:300].decode(errors="replace") if tmp.exists() else r.stderr
        tmp.unlink(missing_ok=True); sys.exit(f"HTTP {r.stdout.strip()}: {msg}")
    tmp.rename(path)

def main():
    cfg = json.loads((HERE / "narration.json").read_text()); key = load_key()
    t = cfg.get("lead_in", 0.5); beats = []
    for i, text in enumerate(cfg["beats"]):
        h = hashlib.sha1(f'{cfg["model"]}|{cfg["voice"]}|{cfg.get("direction","")}|{text}'.encode()).hexdigest()[:10]
        clip = CLIPS / f"{i:02d}-{h}.mp3"
        if not clip.exists(): synth(key, cfg, text, clip); print(f"  synth beat {i+1}")
        d = dur(clip)
        beats.append({"i": i+1, "start": round(t,3), "end": round(t+d,3), "dur": round(d,3), "clip": str(clip), "text": text})
        t += d + cfg.get("gap", 0.35)
    total = round(beats[-1]["end"] + cfg.get("tail", 1.2), 3)
    inputs, chains = [], []
    for k, b in enumerate(beats):
        inputs += ["-i", b["clip"]]; ms = int(round(b["start"]*1000))
        chains.append(f"[{k}:a]aresample=48000,adelay={ms}|{ms}[a{k}]")
    fc = ";".join(chains) + ";" + "".join(f"[a{k}]" for k in range(len(beats))) + \
         f"amix=inputs={len(beats)}:normalize=0,apad,atrim=0:{total}[out]"
    subprocess.run(["ffmpeg","-y","-v","error",*inputs,"-filter_complex",fc,"-map","[out]","-ac","2","-ar","48000","-b:a","192k",str(OUT/"voice.mp3")], check=True)
    (OUT/"timing.json").write_text(json.dumps({"duration": total, "beats": beats}, ensure_ascii=False, indent=2))
    for b in beats: print(f'  beat {b["i"]}: {b["start"]:6.2f} -> {b["end"]:6.2f}')
    print(f"total {total:.2f}s")

if __name__ == "__main__": main()
