"""Recorta tools/source/imperium_forces.png (5 faixas x 11 cartas, com o
nome embaixo) em ícones 256x256 sem o rótulo:
art/textures/ui/wh40k/portraits/imperium/<id>.png.
As bordas foram medidas na imagem (colunas escuras entre as cartas)."""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "tools/source/imperium_forces.png")
OUT = os.path.join(ROOT, "art/textures/ui/wh40k/portraits/imperium")

# (topo da imagem, topo do rótulo, bordas das colunas)
ROWS = [
    (33, 158, [3, 151, 288, 424, 562, 702, 842, 983, 1121, 1261, 1401, 1534]),
    (231, 360, [3, 151, 287, 423, 566, 703, 842, 983, 1121, 1256, 1401, 1534]),
    (433, 558, [3, 152, 288, 428, 566, 705, 844, 984, 1123, 1261, 1406, 1534]),
    (636, 742, [3, 145, 281, 415, 548, 680, 816, 954, 1099, 1256, 1407, 1534]),
    (829, 969, [3, 155, 287, 425, 560, 700, 836, 976, 1118, 1255, 1401, 1534]),
]
NAMES = [
    ["intercessor", "tactical", "assault_marine", "devastator", "terminator", "vanguard", "sm_captain", "librarian", "chaplain", "apothecary", "dreadnought"],
    ["battle_sister", "retributor", "dominion", "seraphim", "zephyrim", "celestian", "canoness", "hospitaller", "dialogus", "dogmata", "exorcist"],
    ["skitarii_vanguard", "skitarii_ranger", "sicarian_infiltrator", "sicarian_ruststalker", "enginseer", "dominus", "kataphron_breacher", "kataphron_destroyer", "onager", "skorpius_disintegrator", "skorpius_dunerider"],
    ["fire_warrior", "veteran", "storm_trooper", "command_squad", "commissar", "platoon_commander", "heavy_weapons", "field_artillery", "leman_russ", "chimera", "sentinel"],
    ["inquisitor", "acolyte", "arbites", "custodes", "eversor", "grey_knight", "deathwatch", "rogue_trader", "navigator", "servitor", "titan_crew"],
]

def main():
    os.makedirs(OUT, exist_ok=True)
    im = Image.open(SRC).convert("RGB")
    for (top, label, cols), names in zip(ROWS, NAMES):
        for i, name in enumerate(names):
            x0, x1 = cols[i] + 2, cols[i + 1] - 4
            w, h = x1 - x0, label - top
            side = min(w, h)
            cx = (x0 + x1) // 2
            box = (cx - side // 2, top, cx - side // 2 + side, top + side)
            im.crop(box).resize((256, 256), Image.LANCZOS).save(os.path.join(OUT, name + ".png"))
    print("ok", sum(len(n) for n in NAMES), "ícones")

if __name__ == "__main__":
    main()
