#!/usr/bin/env python3
"""
Arte provisória dos Orks a partir dos modelos do warhr (não há modelos
Orks ainda): recolore as texturas e grava os atores com as malhas do warhr.

  Rapaz (boyz, corpo a corpo)  <- zumbi da peste, pele verde
  Rapaz atirador (shoota)      <- guarda de Krieg, pele verde, farda preta e vermelha
  Nob / Chefão (general)       <- demônio do Caos, verde e vermelho
  Trukk                        <- Chimera enferrujado e vermelho
  Vagão Saqueado               <- Leman Russ "saqueado", vermelho com manchas amarelas
  Dakkajet                     <- Valkyrie amarela e vermelha

Os atores do warhr são lidos e só o caminho da textura muda; assim as
animações, adereços e partículas continuam os mesmos.

Uso (na pasta do mod):  python3 tools/art/gen_orks.py
"""
import os
import re

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
WARHR = os.path.join(os.path.dirname(ROOT), "warhr")
SKINS_IN = os.path.join(WARHR, "art", "textures", "skins")
SKINS_OUT = os.path.join(ROOT, "art", "textures", "skins")
ACTORS_IN = os.path.join(WARHR, "art", "actors")
ACTORS_OUT = os.path.join(ROOT, "art", "actors")


def rgb_to_hsv(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx, mn = a.max(-1), a.min(-1)
    d = mx - mn + 1e-6
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) / 6
    s = np.where(mx > 0, (mx - mn) / (mx + 1e-6), 0)
    return h, s, mx


def hsv_to_rgb(h, s, v):
    i = np.floor(h * 6).astype(int) % 6
    f = h * 6 - np.floor(h * 6)
    p, q, t = v * (1 - s), v * (1 - f * s), v * (1 - (1 - f) * s)
    out = np.zeros(h.shape + (3,), np.float32)
    for k, (r, g, b) in enumerate([(v, t, p), (q, v, p), (p, v, t), (p, q, v), (t, p, v), (v, p, q)]):
        m = i == k
        out[m] = np.stack([r[m], g[m], b[m]], -1)
    return out


def load(rel):
    return np.asarray(Image.open(os.path.join(SKINS_IN, rel)).convert("RGB")).astype(np.float32) / 255


def save(arr, rel):
    path = os.path.join(SKINS_OUT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    Image.fromarray((np.clip(arr, 0, 1) * 255).astype(np.uint8)).save(path)


def green_skin(a, others=None, skin_range=(0.0, 0.14), min_sat=0.12):
    """Tons de pele (laranja/rosado) viram verde Ork; o resto vai para 'others'."""
    h, s, v = rgb_to_hsv(a)
    skin = ((h >= skin_range[0]) & (h <= skin_range[1]) | (h > 0.95)) & (s > min_sat) & (v > 0.12)
    h2 = np.where(skin, 0.27 + (h % 1) * 0.15, h)
    s2 = np.where(skin, np.clip(s * 1.3 + 0.15, 0, 0.85), s)
    v2 = np.where(skin, v * 0.85, v)
    out = hsv_to_rgb(h2 % 1, s2, v2)
    if others is not None:
        out[~skin] = others(a[~skin])
    return out


def tint(rgb, mul, add=(0, 0, 0)):
    return np.clip(rgb * np.array(mul, np.float32) + np.array(add, np.float32), 0, 1)


def splotches(a, color, rng, scale=48, amount=0.12):
    h, w = a.shape[:2]
    small = rng.random((h // scale + 2, w // scale + 2))
    big = np.asarray(Image.fromarray((small * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)) / 255
    m = big > (1 - amount)
    a = a.copy()
    a[m] = a[m] * 0.4 + np.array(color, np.float32) * 0.6
    return a


def textures():
    rng = np.random.default_rng(4)
    # Rapaz: o zumbi tem pele pálida e trapos; pele verde e trapos escuros
    z = load("skeletal/chaos/chaos_zombie.png")
    save(green_skin(z, lambda o: tint(o, (0.75, 0.62, 0.55)), skin_range=(0.0, 0.2), min_sat=0.05), "skeletal/orks/ork_boy.png")
    # Atirador: guarda de Krieg (farda verde-oliva) -> pele verde, farda preta e vermelha (Goffs)
    k = load("skeletal/imperial/krieg_guardsman.png")
    def goff(o):
        lum = o.mean(-1, keepdims=True)
        return np.clip(lum * np.array((1.25, 0.45, 0.4)) * 0.9, 0, 1)
    save(green_skin(k, goff), "skeletal/orks/ork_shoota.png")
    # Nob: demônio -> verde com placas vermelhas
    d = load("skeletal/chaos/chaos_daemon.png")
    h, s, v = rgb_to_hsv(d)
    nob = hsv_to_rgb((0.28 + h * 0.08) % 1, np.clip(s * 0.9 + 0.2, 0, 0.9), v)
    save(splotches(nob, (0.55, 0.08, 0.06), rng, 64, 0.25), "skeletal/orks/ork_nob.png")
    # Veículos
    c = load("vehicle/imperial/chimera.png")
    save(splotches(tint(c.mean(-1, keepdims=True) * np.ones(3), (1.25, 0.55, 0.42)), (0.85, 0.7, 0.15), rng, 40, 0.1), "vehicle/orks/trukk.png")
    lr = load("vehicle/imperial/leman_russ.png")
    save(splotches(tint(lr.mean(-1, keepdims=True) * np.ones(3), (1.2, 0.45, 0.35)), (0.9, 0.75, 0.1), rng, 48, 0.15), "vehicle/orks/looted_wagon.png")
    vk = load("vehicle/imperial/valkyrie.png")
    save(splotches(tint(vk.mean(-1, keepdims=True) * np.ones(3), (1.35, 1.0, 0.25)), (0.7, 0.08, 0.05), rng, 40, 0.2), "vehicle/orks/dakkajet.png")


ACTORS = {
    # novo ator: (ator do warhr, {textura antiga: nova})
    "units/orks/ork_boy.xml": ("units/chaos/chaos_zombie.xml", {"skeletal/chaos/chaos_zombie.png": "skeletal/orks/ork_boy.png"}),
    "units/orks/ork_shoota.xml": ("units/imperial/infantry_guardsman.xml", {"skeletal/imperial/krieg_guardsman.png": "skeletal/orks/ork_shoota.png"}),
    "units/orks/ork_nob.xml": ("units/chaos/chaos_daemon.xml", {"skeletal/chaos/chaos_daemon.png": "skeletal/orks/ork_nob.png"}),
    "vehicle/orks/trukk.xml": ("vehicle/imperial/chimera.xml", {"vehicle/imperial/chimera.png": "vehicle/orks/trukk.png"}),
    "vehicle/orks/trukk_turret.xml": ("vehicle/imperial/chimera_turret.xml", {"vehicle/imperial/chimera.png": "vehicle/orks/trukk.png"}),
    "vehicle/orks/looted_wagon.xml": ("vehicle/imperial/leman_russ.xml", {"vehicle/imperial/leman_russ.png": "vehicle/orks/looted_wagon.png"}),
    "vehicle/orks/looted_wagon_turret.xml": ("vehicle/imperial/leman_russ_turret.xml", {"vehicle/imperial/leman_russ.png": "vehicle/orks/looted_wagon.png"}),
    "vehicle/orks/dakkajet.xml": ("vehicle/imperial/valkyrie.xml", {"vehicle/imperial/valkyrie.png": "vehicle/orks/dakkajet.png"}),
}


def actors():
    for out, (src, swaps) in ACTORS.items():
        with open(os.path.join(ACTORS_IN, src)) as f:
            text = f.read()
        text = re.sub(r"<!--.*?-->", "", text, flags=re.S)
        for a, b in swaps.items():
            if a not in text:
                print("  aviso: textura", a, "não encontrada em", src)
            text = text.replace('"' + a + '"', '"' + b + '"')
        text = text.replace('<?xml version="1.0" encoding="utf-8"?>',
                            '<?xml version="1.0" encoding="utf-8"?>\n<!-- Gerado por tools/art/gen_orks.py a partir de warhr/art/actors/%s (arte provisória dos Orks). -->' % src, 1)
        path = os.path.join(ACTORS_OUT, out)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w") as f:
            f.write(re.sub(r"\n\s*\n", "\n", text))


if __name__ == "__main__":
    textures()
    actors()
    print("Orks: texturas e", len(ACTORS), "atores gerados")
