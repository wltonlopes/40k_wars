"""Recorta as artes de tools/source/space/:
  hive_cities.png  12 cidades-colmeia vistas de cima (grade 4x3, fundo
                   transparente) -> art/textures/ui/campaigns/wh40k/cities/city_<n>.png (512x512)
  ships_01.png     naves em 4 tamanhos: Imperium, Caos, Orks, Necrons
  ships_02.png     naves em 4 tamanhos: Imperium (Astartes), Caos, Eldar/Drukhari, Tiranídeos
                   -> art/textures/ui/campaigns/wh40k/ships/<estilo>_<tamanho 0..3>.png (256x256)
As cidades são desenhadas nos mapas por tools/art/gen_planets.py e no campo
de batalha; as naves, na vista do sistema e na batalha espacial.
"""
import os

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "tools/source/space")
OUT = os.path.join(ROOT, "art/textures/ui/campaigns/wh40k")
SHIP_ROWS = {
    "ships_01.png": ["imperial", "chaos", "orks", "necrons"],
    "ships_02.png": ["astartes", "chaos2", "eldar", "tyranids"],
}


def cells(im, cols, rows):
    w, h = im.size
    for r in range(rows):
        for c in range(cols):
            yield r, c, im.crop((w * c // cols, h * r // rows, w * (c + 1) // cols, h * (r + 1) // rows))


def clean(cell):
    """Tira pedaços das figuras vizinhas que invadem a célula (encostados na borda)."""
    rgba = np.asarray(cell).copy()
    lab, n = ndimage.label(ndimage.binary_dilation(rgba[..., 3] > 16, iterations=3))
    if n > 1:
        areas = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
        big = 1 + int(np.argmax(areas))
        h, w = lab.shape
        edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
        for i in range(1, n + 1):
            if i != big and (i in edge or areas[i - 1] < 0.02 * areas[big - 1]):
                rgba[lab == i, 3] = 0
    return Image.fromarray(rgba, "RGBA")


def square(cell, size, pad=0.04):
    cell = clean(cell)
    a = np.asarray(cell.getchannel("A"))
    ys, xs = np.nonzero(a > 16)
    box = cell.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    s = int(max(box.size) * (1 + 2 * pad))
    sq = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    sq.paste(box, ((s - box.size[0]) // 2, (s - box.size[1]) // 2))
    return sq.resize((size, size), Image.LANCZOS)


def main():
    os.makedirs(os.path.join(OUT, "cities"), exist_ok=True)
    os.makedirs(os.path.join(OUT, "ships"), exist_ok=True)
    im = Image.open(os.path.join(SRC, "hive_cities.png")).convert("RGBA")
    for r, c, cell in cells(im, 4, 3):
        square(cell, 512, 0.02).save(os.path.join(OUT, "cities", "city_%d.png" % (r * 4 + c)))
    for name, styles in SHIP_ROWS.items():
        im = Image.open(os.path.join(SRC, name)).convert("RGBA")
        for r, c, cell in cells(im, 4, 4):
            ship = square(cell, 256)
            base = os.path.join(OUT, "ships", "%s_%d" % (styles[r], c))
            ship.save(base + ".png")
            # A proa aponta para cima na prancha; viradas para a batalha espacial, proa contra proa.
            ship.rotate(-90).save(base + "_r.png")
            ship.rotate(90).save(base + "_l.png")
    for d in ("cities", "ships"):
        with open(os.path.join(OUT, d, "textures.xml"), "w") as f:
            f.write('<?xml version="1.0" encoding="utf-8"?>\n<Textures>\n  <File pattern="*" format="rgba" mipmap="false"/>\n</Textures>\n')
    print("12 cidades e 32 naves")


if __name__ == "__main__":
    main()
