"""Recorta as pranchas 4x4 de tools/source/sheets/<nome>.png em retratos
256x256: art/textures/ui/wh40k/portraits/<nome>/r<linha>c<coluna>.png.
As linhas da grade são achadas pelas faixas escuras entre as cartas.
  astra_inf  Guarda: infantaria      astra_veh  Guarda: veículos
  orks_inf   Orks: infantaria        orks_veh   Orks: veículos e máquinas
  eldar, chaos, necrons, tau, tyranids
"""
import os
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "tools/source/sheets")
OUT = os.path.join(ROOT, "art/textures/ui/wh40k/portraits")


def cuts(profile, n):
    """Posições das n-1 divisórias: o mínimo de brilho perto de cada k/n."""
    L = len(profile)
    res = [0]
    for k in range(1, n):
        c = int(L * k / n)
        win = profile[c - L // 20:c + L // 20]
        res.append(c - L // 20 + int(np.argmin(win)))
    res.append(L)
    return res


def slice_sheet(name, n=4, inset=7):
    im = Image.open(os.path.join(SRC, name + ".png")).convert("RGB")
    g = np.asarray(im.convert("L")).astype(np.float32)
    xs = cuts(g.mean(axis=0), n)
    ys = cuts(g.mean(axis=1), n)
    out = os.path.join(OUT, name)
    os.makedirs(out, exist_ok=True)
    for r in range(n):
        for c in range(n):
            box = (xs[c] + inset, ys[r] + inset, xs[c + 1] - inset, ys[r + 1] - inset)
            w, h = box[2] - box[0], box[3] - box[1]
            s = min(w, h)
            box = (box[0] + (w - s) // 2, box[1] + (h - s) // 2, box[0] + (w - s) // 2 + s, box[1] + (h - s) // 2 + s)
            im.crop(box).resize((256, 256), Image.LANCZOS).save(os.path.join(out, "r%dc%d.png" % (r, c)))
    print(name, "colunas", xs, "linhas", ys)


if __name__ == "__main__":
    names = sys.argv[1:] or sorted(f[:-4] for f in os.listdir(SRC) if f.endswith(".png"))
    for n in names:
        slice_sheet(n)
