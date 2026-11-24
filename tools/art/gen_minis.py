"""Miniaturas para o campo de batalha: recorta a figura de cada retrato
(art/textures/ui/wh40k/portraits/**) do fundo escuro com GrabCut (OpenCV) e
salva em art/textures/ui/campaigns/wh40k/minis/<mesmo caminho> (128x128,
com transparência) e uma cópia espelhada (<nome>_m.png, para o lado inimigo).
Recortes duvidosos (figura pequena demais ou o quadro inteiro) ficam de fora;
a lista dos que deram certo vai para campaigns/wh40k/data/minis.json. Sem
miniatura, a batalha usa o retrato redondo de antes.
"""
import json
import os

import cv2
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "art/textures/ui/wh40k/portraits")
OUT = os.path.join(ROOT, "art/textures/ui/campaigns/wh40k/minis")
DATA = os.path.join(ROOT, "campaigns/wh40k/data/minis.json")


def cutout(path):
    img = cv2.imread(path)
    if img is None:
        return None
    img = cv2.resize(img, (256, 256), interpolation=cv2.INTER_AREA)
    h, w = img.shape[:2]
    mask = np.full((h, w), cv2.GC_PR_BGD, np.uint8)
    mask[int(h * 0.1):, int(w * 0.1):int(w * 0.9)] = cv2.GC_PR_FGD
    mask[:3, :] = cv2.GC_BGD
    mask[:, :3] = cv2.GC_BGD
    mask[:, -3:] = cv2.GC_BGD
    mask[int(h * 0.4):int(h * 0.8), int(w * 0.42):int(w * 0.58)] = cv2.GC_FGD
    bgd = np.zeros((1, 65), np.float64)
    fgd = np.zeros((1, 65), np.float64)
    try:
        cv2.grabCut(img, mask, None, bgd, fgd, 5, cv2.GC_INIT_WITH_MASK)
    except cv2.error:
        return None
    m = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(m)
    if n > 1:
        big = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
        m = np.where(lab == big, 255, 0).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    frac = m.mean() / 255
    ys, xs = np.nonzero(m > 128)
    # Pedaços soltos (braço, parte do casco) ou o quadro inteiro: fica o retrato.
    if frac < 0.2 or frac > 0.88 or ys.max() - ys.min() < 0.6 * h or xs.max() - xs.min() < 0.4 * w:
        return None
    m = cv2.GaussianBlur(m, (5, 5), 0)
    # Fade na base: a figura "pousa" na peanha.
    fade = np.clip((h - np.arange(h)) / (h * 0.12), 0, 1)[:, None]
    m = (m * fade).astype(np.uint8)
    rgba = np.dstack([cv2.cvtColor(img, cv2.COLOR_BGR2RGB), m])
    return Image.fromarray(rgba, "RGBA").resize((128, 128), Image.LANCZOS)


def main():
    done = []
    total = 0
    for dirpath, _, files in os.walk(SRC):
        for f in sorted(files):
            if not f.endswith(".png"):
                continue
            total += 1
            rel = os.path.relpath(os.path.join(dirpath, f), SRC)
            im = cutout(os.path.join(dirpath, f))
            if im is None:
                continue
            out = os.path.join(OUT, rel)
            os.makedirs(os.path.dirname(out), exist_ok=True)
            im.save(out, optimize=True)
            im.transpose(Image.FLIP_LEFT_RIGHT).save(out[:-4] + "_m.png", optimize=True)
            done.append(rel)
    with open(os.path.join(OUT, "textures.xml"), "w") as f:
        f.write('<?xml version="1.0" encoding="utf-8"?>\n<Textures>\n  <File pattern="*" format="rgba" mipmap="false"/>\n</Textures>\n')
    with open(DATA, "w") as f:
        json.dump({"Description": "Retratos com miniatura recortada (tools/art/gen_minis.py).", "minis": done}, f, indent="\t")
    print(len(done), "miniaturas de", total, "retratos")


if __name__ == "__main__":
    main()
