#!/usr/bin/env python3
"""
Recorta as colagens de retratos (tools/source/<faccao>_collage.png, grade de
7 colunas x 5 linhas) em retratos individuais de 256x256:

    art/textures/ui/wh40k/portraits/<faccao>/r<linha>c<coluna>.png

As linhas pretas entre as células não são regulares: o script procura as
faixas escuras perto da posição esperada de cada divisão e, se não achar,
usa a posição uniforme. Cada célula é cortada para um quadrado centrado
(um pouco acima do centro, onde fica o rosto) e reduzida com Lanczos.

Uso (na pasta do mod):  python3 tools/art/slice_portraits.py
"""
import os
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
COLS, ROWS, SIZE = 7, 5, 256
COLLAGES = {"imperial": "imperial_collage.png", "orks": "orks_collage.png"}


def bands(profile, threshold=28):
    """Centros das faixas escuras (sequências de valores abaixo do limiar)."""
    out, start = [], None
    for i, v in enumerate(list(profile) + [255]):
        if v < threshold and start is None:
            start = i
        elif v >= threshold and start is not None:
            out.append((start + i - 1) / 2)
            start = None
    return out


def cuts(profile, count):
    """Posições das count+1 divisões (bordas incluídas)."""
    length = len(profile)
    found = bands(profile)
    result = [0]
    for k in range(1, count):
        expected = k * length / count
        near = [b for b in found if abs(b - expected) < length / count * 0.3]
        result.append(min(near, key=lambda b: abs(b - expected)) if near else expected)
    result.append(length)
    return result


def main():
    for faction, name in COLLAGES.items():
        src = os.path.join(ROOT, "tools", "source", name)
        if not os.path.exists(src):
            print("faltando:", src, file=sys.stderr)
            continue
        img = Image.open(src).convert("RGB")
        gray = np.asarray(img.convert("L")).astype(float)
        xs = cuts(gray.mean(axis=0), COLS)
        ys = cuts(gray.mean(axis=1), ROWS)
        out_dir = os.path.join(ROOT, "art", "textures", "ui", "wh40k", "portraits", faction)
        os.makedirs(out_dir, exist_ok=True)
        for r in range(ROWS):
            for c in range(COLS):
                x0, x1 = int(xs[c]) + 4, int(xs[c + 1]) - 4
                y0, y1 = int(ys[r]) + 4, int(ys[r + 1]) - 4
                side = min(x1 - x0, y1 - y0)
                cx = (x0 + x1) // 2
                cy = y0 + side // 2 if (y1 - y0) > side else (y0 + y1) // 2
                box = (cx - side // 2, cy - side // 2, cx - side // 2 + side, cy - side // 2 + side)
                cell = img.crop(box).resize((SIZE, SIZE), Image.LANCZOS)
                cell.save(os.path.join(out_dir, "r%dc%d.png" % (r, c)))
        print(faction, "ok:", ROWS * COLS, "retratos em", os.path.relpath(out_dir, ROOT))


if __name__ == "__main__":
    main()
