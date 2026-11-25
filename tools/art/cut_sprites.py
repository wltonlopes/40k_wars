"""Recorta os sprites das folhas tools/source/sprites/*.png (fundo claro com
pontilhado, ou escuro nas folhas novas) em figuras soltas com transparência.

Uso: python3 tools/art/cut_sprites.py [--sheet]   (--sheet: gera folhas de
contato numeradas em tools/source/sprites/index/ para montar sprite_map.json)

Cada figura recebe um id "<folha>/<n>", numerada em ordem de leitura (linhas de
cima para baixo, esquerda para a direita). gen_sprites.py usa cut() daqui.
"""
import os
import sys

import cv2
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "tools/source/sprites")
SHEETS = ["s1", "s2", "s3", "s5", "s7", "alguns", "cults", "kreag"]  # s6 é cópia idêntica de s5
MIN_AREA = 500
THR = 75
THR_DARK = 42
MERGE = 0.5


# Estimativa do fundo escuro por folha: "median" (fundo com vinheta e textura,
# figuras espaçadas) ou "open" (fundo liso, figuras densas).
BG_METHOD = {"cults": "median", "kreag": "median"}


def dark_diff(im, name=""):
    """Distância de cor de cada pixel ao fundo local."""
    h, w = im.shape[:2]
    if BG_METHOD.get(name, "open") == "open":
        bg = cv2.morphologyEx(im, cv2.MORPH_OPEN, np.ones((121, 121), np.uint8))
        bg = cv2.GaussianBlur(bg, (61, 61), 0).astype(np.float32)
        return np.sqrt(((im.astype(np.float32) - bg) ** 2).sum(axis=2))
    small = cv2.resize(im, (w // 4, h // 4), interpolation=cv2.INTER_AREA)
    bg = cv2.resize(cv2.medianBlur(small, 41), (w, h), interpolation=cv2.INTER_LINEAR)
    bg = cv2.GaussianBlur(bg, (31, 31), 0).astype(np.float32)
    return np.sqrt(((im.astype(np.float32) - bg) ** 2).sum(axis=2))


CACHE = os.path.join(os.path.expanduser("~"), ".cache", "wh40k_sprites")


def cut(name):
    """cut_sheet() com cache em disco (o recorte leva ~10 s por folha)."""
    import pickle
    src = os.path.join(SRC, name + ".png")
    key = "%s_%d_%d.pkl" % (name, os.path.getmtime(src), os.path.getmtime(__file__))
    path = os.path.join(CACHE, key)
    if os.path.exists(path):
        with open(path, "rb") as f:
            return pickle.load(f)
    res = cut_sheet(name)
    os.makedirs(CACHE, exist_ok=True)
    for old in os.listdir(CACHE):
        if old.startswith(name + "_"):
            os.remove(os.path.join(CACHE, old))
    with open(path, "wb") as f:
        pickle.dump(res, f)
    return res


def cut_sheet(name):
    """Lista de (id, bbox, RGBA recortado) da folha."""
    im = np.array(Image.open(os.path.join(SRC, name + ".png")).convert("RGB"))
    h, w = im.shape[:2]
    gray = cv2.cvtColor(im, cv2.COLOR_RGB2GRAY).astype(np.int16)
    hsv = cv2.cvtColor(im, cv2.COLOR_RGB2HSV)
    sat = hsv[..., 1].astype(np.int16)
    dark = gray.mean() < 110
    if dark:
        # Fundo escuro (folhas novas): mediana larga por canal estima o fundo, e a
        # distância de cor até ele separa as figuras (mais claras).
        diff = dark_diff(im, name).astype(np.int16)
        thr = THR_DARK
        fg = (diff > thr).astype(np.uint8) * 255
        sat = np.zeros_like(sat)  # o fundo escuro colorido não conta como "cor"
    else:
        # Fundo claro: fechamento em tons de cinza apaga as figuras (escuras) e
        # deixa o papel claro, mesmo nos painéis cinzentos.
        bg = cv2.morphologyEx(gray.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((171, 171), np.uint8)).astype(np.int16)
        bg = cv2.GaussianBlur(bg.astype(np.uint8), (61, 61), 0).astype(np.int16)
        diff = bg - gray
        thr = THR
        fg = ((diff > THR) | ((sat > 90) & (diff > THR // 3))).astype(np.uint8) * 255
    # Bordas dos painéis: linhas retas bem mais longas que qualquer figura.
    lines = cv2.morphologyEx(fg, cv2.MORPH_OPEN, np.ones((1, 260), np.uint8)) | \
        cv2.morphologyEx(fg, cv2.MORPH_OPEN, np.ones((260, 1), np.uint8))
    lines = cv2.dilate(lines, np.ones((3, 3), np.uint8))
    fg = cv2.subtract(fg, lines)
    fg = cv2.morphologyEx(fg, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
    # Junta as partes de uma figura (contornos escuros com miolo claro).
    joined = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(joined)
    # Partes de um mesmo veículo saem como componentes sobrepostos: une as
    # caixas que se cruzam bastante (union-find).
    boxes = {i: tuple(stats[i][:4]) for i in range(1, n) if stats[i][4] >= 60}
    groups = [([i], (x, y, x + bw, y + bh)) for i, (x, y, bw, bh) in boxes.items()]

    def overlap(p, q):
        iw = min(p[2], q[2]) - max(p[0], q[0])
        ih = min(p[3], q[3]) - max(p[1], q[1])
        area = min((p[2] - p[0]) * (p[3] - p[1]), (q[2] - q[0]) * (q[3] - q[1]))
        return iw > 0 and ih > 0 and iw * ih > MERGE * area

    changed = True
    while changed:
        changed = False
        for a in range(len(groups)):
            for b in range(a + 1, len(groups)):
                if overlap(groups[a][1], groups[b][1]):
                    p, q = groups[a][1], groups[b][1]
                    groups[a] = (groups[a][0] + groups[b][0], (min(p[0], q[0]), min(p[1], q[1]), max(p[2], q[2]), max(p[3], q[3])))
                    del groups[b]
                    changed = True
                    break
            if changed:
                break
    groups = {k: g for k, (g, _) in enumerate(groups)}
    out = []
    for g in groups.values():
        x0 = min(boxes[i][0] for i in g)
        y0 = min(boxes[i][1] for i in g)
        x1 = max(boxes[i][0] + boxes[i][2] for i in g)
        y1 = max(boxes[i][1] + boxes[i][3] for i in g)
        x, y, bw, bh = x0, y0, x1 - x0, y1 - y0
        sub = lab[y:y1, x:x1]
        m = np.isin(sub, g).astype(np.uint8) * 255
        if m.sum() / 255 < MIN_AREA or bw > w * 0.5 or bh > h * 0.5 or bw < 14 or bh < 14:
            continue
        # Preenche buracos (partes claras do interior da figura).
        m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
        ff = np.pad(m, 1)
        mask = np.zeros((bh + 4, bw + 4), np.uint8)
        cv2.floodFill(ff, mask, (0, 0), 128)
        m = np.where(ff[1:-1, 1:-1] == 128, 0, 255).astype(np.uint8)
        # Halo: pixels com cara de papel (claros, sem cor) ligados ao lado de
        # fora saem; o branco do interior (armadura eldar etc.) fica.
        paper = ((diff[y:y1, x:x1] < thr - 5) & (sat[y:y1, x:x1] < 70)) | (m == 0)
        k, plab = cv2.connectedComponents(np.pad(paper, 1, constant_values=True).astype(np.uint8), connectivity=4)
        edge = set(np.unique(np.concatenate([plab[0], plab[-1], plab[:, 0], plab[:, -1]]))) - {0}
        outside = np.isin(plab, list(edge))[1:-1, 1:-1]
        m[outside] = 0
        # Papel preso entre pernas/braços: manchas internas quase brancas e lisas.
        dc = diff[y:y1, x:x1]
        inner = (paper & ~outside & (m > 0)).astype(np.uint8)
        k, ilab, ist, _ = cv2.connectedComponentsWithStats(inner, connectivity=4)
        for j in range(1, k):
            sel = ilab == j
            if ist[j][4] >= 12 and dc[sel].mean() < (14 if dark else 32) and dc[sel].std() < (7 if dark else 14):
                m[sel] = 0
        m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
        m = cv2.GaussianBlur(m, (3, 3), 0)
        rgba = np.dstack([im[y:y1, x:x1], m])
        out.append(((x, y, bw, bh), rgba))
    # Ordem de leitura: agrupa por linha (centro vertical) com tolerância.
    out.sort(key=lambda o: (o[0][1] + o[0][3] / 2))
    rows, cur, last = [], [], None
    for o in out:
        cy = o[0][1] + o[0][3] / 2
        if last is not None and cy - last > 22:
            rows.append(cur)
            cur = []
        cur.append(o)
        last = cy
    if cur:
        rows.append(cur)
    res = []
    for r in rows:
        for o in sorted(r, key=lambda o: o[0][0]):
            res.append(("%s/%d" % (name, len(res)), o[0], o[1]))
    return res


def contact(name, items):
    """Folha original escurecida com cada recorte contornado e numerado."""
    im = Image.open(os.path.join(SRC, name + ".png")).convert("RGB")
    W, H = im.size
    im = im.resize((W * 2, H * 2), Image.LANCZOS)
    d = ImageDraw.Draw(im)
    for sid, (x, y, bw, bh), _ in items:
        n = sid.split("/")[1]
        d.rectangle([x * 2, y * 2, (x + bw) * 2, (y + bh) * 2], outline=(255, 0, 200), width=2)
        d.rectangle([x * 2, y * 2, x * 2 + 9 * len(n) + 4, y * 2 + 14], fill=(0, 0, 0))
        d.text((x * 2 + 2, y * 2 + 1), n, fill=(255, 255, 0))
    return im


if __name__ == "__main__":
    os.makedirs(os.path.join(SRC, "index"), exist_ok=True)
    for s in SHEETS:
        items = cut(s)
        print(s, len(items))
        if "--sheet" in sys.argv:
            contact(s, items).save(os.path.join(SRC, "index", s + ".png"))
