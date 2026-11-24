"""Cinemática de introdução da campanha (ui/Cinematic.js).

Lê tools/source/cinematic/NN.png (16:9) e grava
art/textures/ui/campaigns/wh40k/cinematic/NN.png em 2048x1024 (potência de
dois; a interface estica de volta para 16:9), com vinheta e um leve tom de
cinema (sombras frias, luzes quentes).
"""
import glob
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "tools/source/cinematic")
OUT = os.path.join(ROOT, "art/textures/ui/campaigns/wh40k/cinematic")


def grade(img):
    a = np.asarray(img.convert("RGB"), np.float32) / 255
    h, w, _ = a.shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    r = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2) / np.sqrt(2)
    vig = 1 - 0.45 * np.clip((r - 0.35) / 0.65, 0, 1) ** 1.6
    lum = a.mean(axis=2, keepdims=True)
    shadow = np.clip(1 - lum * 2, 0, 1)
    a = a + shadow * np.array([-0.015, 0.0, 0.025]) + (1 - shadow) * np.array([0.02, 0.008, -0.015])
    a = np.clip((a - 0.5) * 1.06 + 0.5, 0, 1) * vig[..., None]
    return Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))


def main():
    os.makedirs(OUT, exist_ok=True)
    files = sorted(glob.glob(os.path.join(SRC, "*.png")))
    for f in files:
        img = grade(Image.open(f)).resize((2048, 1024), Image.LANCZOS)
        img.save(os.path.join(OUT, os.path.basename(f)), optimize=True)
        print("cinemática:", os.path.basename(f))


if __name__ == "__main__":
    main()
