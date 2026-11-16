#!/usr/bin/env python3
"""Measure the ink bounding box in beat-end stills and solve per-beat camera x / y / zoom.

Ink = dark (lum < 150) or saturated (sat > 70) pixels; faint ghost notes and the board are excluded.
Prints the screen-space bbox, centre offset and fill, then the world-space correction to apply:
  world_dx = (bbox_cx - 540) / z      -> new CAMX = CAMX + world_dx
  world_dy = (bbox_cy - 960) / z      -> new CAMDY = CAMDY + world_dy
  new zoom = min(0.70*1920/(h/z), 0.90*1080/(w/z), ZMAX)
Usage: measure_ink.py --z 1.2,1.2,... --camx 600,... --camdy -200,... still1.png still2.png ...
Needs Pillow + numpy: `uv run --with pillow --with numpy measure_ink.py ...`.
"""
import sys
import numpy as np
from PIL import Image

args = sys.argv[1:]
def opt(name):
    i = args.index(name); v = [float(x) for x in args[i + 1].split(',')]; del args[i:i + 2]; return v
Z, CX, DY = opt('--z'), opt('--camx'), opt('--camdy')
# Safe box (screen px) the ink must fit in: x0,x1,y0,y1. Default keeps clear of TikTok/Reels overlays:
# 140 px each side, 230 px top, 420 px bottom (caption + account name). Override with --safe.
SAFE = opt('--safe') if '--safe' in args else [140, 940, 230, 1500]
zmax = 1.45
res = []
for k, f in enumerate(args):
    im = np.asarray(Image.open(f).convert('RGB')).astype(np.int16)
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    sat = im.max(-1) - im.min(-1)
    m = (lum < 150) | (sat > 70)
    # drop the marker-in-hand: ignore isolated huge dark blobs? keep simple: mask rows/cols with >= 6 ink px
    ys = np.where(m.sum(1) >= 6)[0]; xs = np.where(m.sum(0) >= 6)[0]
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    w, h = x1 - x0, y1 - y0
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    z = Z[k]
    sx0, sx1, sy0, sy1 = SAFE
    nz = min(0.98 * (sy1 - sy0) / (h / z), 0.98 * (sx1 - sx0) / (w / z), zmax)
    # world centre of the ink, then place it at the safe box centre at the new zoom
    wcx = CX[k] + (cx - 540) / z; wcy = DY[k] + (cy - 960) / z
    ncx = wcx - ((sx0 + sx1) / 2 - 540) / nz
    ndy = wcy - ((sy0 + sy1) / 2 - 960) / nz
    edge = min(x0 - sx0, sx1 - x1, y0 - sy0, sy1 - y1)
    print(f'{f}: bbox x {x0}-{x1} y {y0}-{y1} | off x {cx - 540:+.0f} y {cy - 960:+.0f} | fill h {h / 1920:.0%} w {w / 1080:.0%} | margin to safe box {edge:.0f}px'
          f' -> camx {ncx:.0f} camdy {ndy:.0f} z {nz:.3f}')
    res.append((round(ncx), round(ndy), round(nz, 3)))
print('CAMXS', [r[0] for r in res]); print('CAMDY', [r[1] for r in res]); print('ZS', [float(r[2]) for r in res])
