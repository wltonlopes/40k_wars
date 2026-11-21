"""Texturas procedurais de terreno (mapas dos planetas e fundo do campo de
batalha). Cada terreno devolve (cor HxWx3, micro-relevo HxW); o relevo vira
sombreamento (luz do noroeste) no final.

k = escala dos detalhes (1 = mapa de 2048 px de largura).
"""
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage


def noise(shape, scale, rng):
    h, w = shape
    sh, sw = max(2, int(h / scale)) + 2, max(2, int(w / scale)) + 2
    small = rng.random((sh, sw)).astype(np.float32)
    return np.asarray(Image.fromarray(small, "F").resize((w, h), Image.BICUBIC)).astype(np.float32)


def fbm(shape, rng, base=64, octaves=4):
    total = np.zeros(shape, np.float32)
    amp, norm, scale = 1.0, 0.0, base
    for _ in range(octaves):
        total += noise(shape, scale, rng) * amp
        norm += amp
        amp *= 0.5
        scale = max(2, scale / 2)
    return np.clip(total / norm, 0, 1)


def ridged(n):
    return 1 - np.abs(2 * n - 1)


def C(*c):
    return np.array(c, np.float32)


def lerp(c0, c1, t):
    return c0 + (c1 - c0) * np.clip(t, 0, 1)[..., None]


def cells(h, w, spacing, rng):
    """Células de Voronoi: (id da célula, borda entre células)."""
    n = max(4, int(h * w / (spacing * spacing)))
    seeds = np.ones((h, w), bool)
    ys = rng.integers(0, h, n)
    xs = rng.integers(0, w, n)
    seeds[ys, xs] = False
    _, (iy, ix) = ndimage.distance_transform_edt(seeds, return_indices=True)
    cid = (iy * w + ix).astype(np.int64)
    _, cid = np.unique(cid, return_inverse=True)
    cid = cid.reshape(h, w)
    border = np.zeros((h, w), bool)
    border[:, 1:] |= cid[:, 1:] != cid[:, :-1]
    border[1:, :] |= cid[1:, :] != cid[:-1, :]
    return cid, border


def dilate(m, it):
    return ndimage.binary_dilation(m, iterations=max(1, int(it))) if it >= 1 else m


def terrain_layer(t, h, w, rng, k=1.0):
    n1 = fbm((h, w), rng, base=max(4, 40 * k), octaves=4)
    n2 = fbm((h, w), rng, base=max(2, 8 * k), octaves=3)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    micro = np.zeros((h, w), np.float32)
    if t == "hive":
        # Avenidas largas entre distritos; dentro, quarteirões em grade com torres.
        dist_id, avenues = cells(h, w, max(14, 70 * k), rng)
        ang = (rng.random(dist_id.max() + 1) * np.pi / 2).astype(np.float32)[dist_id]
        u = xx * np.cos(ang) + yy * np.sin(ang)
        v = -xx * np.sin(ang) + yy * np.cos(ang)
        bs = max(4, 9 * k)
        bu, bv = np.floor(u / bs), np.floor(v / (bs * 1.3))
        block = (np.abs(np.sin(bu * 12.9898 + bv * 78.233) * 43758.5453) % 1).astype(np.float32)
        lanes = ((u % bs) < max(1, 1.2 * k)) | ((v % (bs * 1.3)) < max(1, 1.2 * k))
        district = fbm((h, w), rng, base=max(6, 60 * k), octaves=2)
        base = lerp(C(60, 56, 54), C(126, 116, 104), block * 0.55 + district * 0.25 + n2 * 0.2)
        base[lanes] = base[lanes] * 0.6 + C(40, 34, 30) * 0.4
        av = dilate(avenues, 1.8 * k)
        base[av] = C(34, 30, 28)
        spires = (block > 0.93) & ~lanes & ~av
        base[spires] = base[spires] * 0.5 + C(170, 150, 120) * 0.5
        win = (rng.random((h, w)) > 0.97) & ~lanes & ~av & (block > 0.5)
        base[win] = C(245, 196, 112)
        micro = np.where(av | lanes, 0, 0.1 + block * 0.2 + spires * 0.4) + district * 0.3
    elif t == "industrial":
        base = lerp(C(80, 58, 42), C(130, 98, 70), n1)
        img = Image.new("L", (w, h), 0)
        dr = ImageDraw.Draw(img)
        for _ in range(int(h * w / (700 * k * k))):
            x, y = int(rng.integers(0, w)), int(rng.integers(0, h))
            bw, bh = rng.integers(int(5 * k) + 2, int(20 * k) + 4, 2)
            dr.rectangle((x, y, x + int(bw), y + int(bh)), fill=int(rng.integers(110, 255)))
        roofs = np.asarray(img).astype(np.float32) / 255
        m = roofs > 0
        base[m] = lerp(C(58, 56, 54), C(118, 108, 96), roofs)[m]
        base[m & ((xx // max(2, int(2 * k))) % 2 == 0)] *= 0.86
        pipes = (np.abs(np.sin(xx / (11 * k) + n1 * 5)) < 0.045) & ~m
        base[pipes] = C(160, 115, 60)
        stacks = (rng.random((h, w)) > 0.9993)
        stacks = dilate(stacks, 1.5 * k)
        base[stacks] = C(35, 30, 28)
        soot = np.clip(n2 - 0.55, 0, 1) / 0.45
        base *= (1 - 0.4 * soot)[..., None]
        micro = roofs * 0.3 + n1 * 0.3 + stacks * 0.5
    elif t == "ash":
        dune = np.sin((xx * 0.8 + yy * 0.5) / (5.5 * k) + n1 * 11) * 0.5 + 0.5
        base = lerp(C(105, 96, 86), C(168, 156, 136), dune * 0.45 + n2 * 0.55)
        rocks = fbm((h, w), rng, base=max(2, 3 * k), octaves=2) > 0.74
        base[rocks] = C(58, 52, 48)
        cinders = (rng.random((h, w)) > 0.997)
        base[cinders] = C(230, 110, 40)
        micro = dune * 0.2 + rocks * 0.2 + n1 * 0.3
    elif t == "jungle":
        crowns = fbm((h, w), rng, base=max(2, 3.2 * k), octaves=2)
        big = fbm((h, w), rng, base=max(4, 30 * k), octaves=3)
        base = lerp(C(12, 38, 16), C(70, 108, 38), np.clip(crowns * 0.45 + big * 0.85 - 0.25, 0, 1))
        clearing = big < 0.32
        base[clearing] = base[clearing] * 0.6 + C(96, 92, 52) * 0.4
        river = np.abs(n1 - 0.5) < 0.006
        river = dilate(river, 0.8 * k)
        base[river] = C(42, 76, 72)
        micro = crowns * 0.25 + big * 0.4 - river * 0.3
    elif t == "mire":
        base = lerp(C(52, 58, 38), C(100, 98, 62), n2)
        pools = n1 + 0.35 * n2 > 0.8
        base[pools] = lerp(C(22, 38, 36), C(52, 72, 62), n2)[pools]
        reeds = (rng.random((h, w)) > 0.9) & ~pools
        base[reeds] *= 0.68
        micro = n2 * 0.3 - pools * 0.25
    elif t == "mountains":
        r1 = ridged(fbm((h, w), rng, base=max(6, 34 * k), octaves=5))
        r2 = ridged(fbm((h, w), rng, base=max(3, 9 * k), octaves=3))
        hgt = r1 ** 2 * 0.8 + r2 * 0.2
        base = lerp(C(70, 62, 56), C(150, 138, 124), hgt)
        # cristas com sombra própria (luz do noroeste)
        gy, gx = np.gradient(ndimage.gaussian_filter(hgt, max(0.7, 1.0 * k)))
        base *= np.clip(1 + (-gx - gy) * 14 / max(0.5, k), 0.45, 1.5)[..., None]
        peaks = fbm((h, w), rng, base=max(8, 80 * k), octaves=2)
        snow = np.clip((hgt - 0.45) / 0.3, 0, 1) * np.clip((peaks - 0.45) / 0.2, 0, 1)
        base = base * (1 - snow[..., None] * 0.85) + C(236, 238, 244)[None, None, :] * snow[..., None] * 0.85
        micro = hgt * 0.8
    elif t == "plains":
        cid, bnd = cells(h, w, max(8, 24 * k), rng)
        pal = np.stack([C(152, 140, 78), C(118, 132, 58), C(98, 116, 52), C(142, 118, 66), C(86, 100, 48), C(168, 156, 98)])
        ncell = cid.max() + 1
        col = pal[rng.integers(0, len(pal), ncell)][cid]
        ang = (rng.random(ncell) * np.pi).astype(np.float32)[cid]
        rows = np.sin((xx * np.cos(ang) + yy * np.sin(ang)) / (1.4 * k)) > 0.35
        base = col * (0.85 + 0.2 * n2[..., None])
        base[rows] *= 0.88
        hedge = dilate(bnd, 0.6 * k)
        base[hedge] = C(56, 66, 34)
        road = np.abs(n1 - 0.5) < 0.004
        base[road] = C(120, 104, 82)
        micro = n1 * 0.3 + hedge * 0.08
    elif t == "ice":
        base = lerp(C(160, 180, 200), C(232, 240, 248), n1 * 0.7 + n2 * 0.3)
        crev = np.abs(fbm((h, w), rng, base=max(4, 18 * k), octaves=3) - 0.5) < 0.006
        base[crev] = C(80, 112, 146)
        sastrugi = np.sin((xx - yy * 0.3) / (2.5 * k) + n1 * 6) > 0.8
        base[sastrugi] *= 0.95
        micro = n1 * 0.4 - crev * 0.2
    elif t == "rok":
        base = lerp(C(64, 56, 50), C(124, 108, 92), n1 * 0.6 + n2 * 0.4)
        micro = n1 * 0.4 + n2 * 0.2
        ncr = int(h * w / (2200 * k * k)) + 6
        for _ in range(ncr):
            cx, cy = rng.random() * w, rng.random() * h
            r = (3 + rng.random() ** 2 * 26) * k
            x0, x1 = int(max(0, cx - 2 * r)), int(min(w, cx + 2 * r + 1))
            y0, y1 = int(max(0, cy - 2 * r)), int(min(h, cy + 2 * r + 1))
            if x1 <= x0 or y1 <= y0:
                continue
            d = np.sqrt((xx[y0:y1, x0:x1] - cx) ** 2 + (yy[y0:y1, x0:x1] - cy) ** 2) / r
            micro[y0:y1, x0:x1] += np.where(d < 1, -(1 - d ** 2) * 0.7, 0) + np.exp(-((d - 1) / 0.18) ** 2) * 0.45
        scrap = rng.random((h, w)) > 0.998
        base[scrap] = C(190, 170, 130)
    elif t == "station":
        s = max(6, int(16 * k))
        pv = rng.random((h // s + 2, w // s + 2)).astype(np.float32)[(yy // s).astype(int), (xx // s).astype(int)]
        base = lerp(C(64, 68, 76), C(134, 138, 146), pv * 0.7 + n2 * 0.3)
        seams = ((xx % s) < 1) | ((yy % s) < 1)
        base[seams] *= 0.55
        trench = ((xx % (s * 4)) < max(2, s // 4))
        base[trench] = C(30, 32, 36)
        lights = (rng.random((h, w)) > 0.996)
        base[lights] = C(255, 210, 140)
        micro = pv * 0.4 - trench * 0.6
    elif t == "biomass":
        # Mundo infestado: carne roxa, veias, poças de ácido digestivo e chaminés de esporos.
        flesh = fbm((h, w), rng, base=max(3, 6 * k), octaves=3)
        base = lerp(C(64, 26, 58), C(150, 78, 120), flesh * 0.6 + n1 * 0.4)
        veins = ridged(fbm((h, w), rng, base=max(4, 22 * k), octaves=3)) > 0.93
        base[veins] = base[veins] * 0.4 + C(150, 20, 40) * 0.6
        acid = n1 + 0.3 * n2 > 0.86
        base[acid] = lerp(C(120, 150, 40), C(190, 210, 70), n2)[acid]
        chimneys = dilate(rng.random((h, w)) > 0.9994, 1.6 * k)
        base[chimneys] = C(220, 180, 200)
        micro = flesh * 0.5 + chimneys * 0.8 - acid * 0.3
    elif t == "warp":
        # Mundo-demônio: rocha carmesim rachada, fendas que brilham com a disformidade.
        rock = fbm((h, w), rng, base=max(4, 14 * k), octaves=4)
        base = lerp(C(40, 14, 16), C(120, 44, 40), rock)
        crack = np.abs(fbm((h, w), rng, base=max(5, 26 * k), octaves=4) - 0.5) < 0.012
        glow = ndimage.gaussian_filter(crack.astype(np.float32), max(1.0, 2.5 * k))
        base = base + (C(255, 90, 200) * 0.0 + C(240, 80, 200))[None, None, :] * np.clip(glow * 2.2, 0, 0.8)[..., None] * 0.5
        base[crack] = C(255, 170, 240)
        bones = rng.random((h, w)) > 0.997
        base[bones] = C(220, 210, 190)
        micro = rock * 0.6 - crack * 0.4
    elif t == "tomb":
        # Mundo-tumba: blocos de pedra negra em grade, linhas verdes de energia e areia.
        s2 = max(8, int(28 * k))
        bx, by = (xx // s2).astype(int), (yy // s2).astype(int)
        pv = (np.abs(np.sin(bx * 12.9898 + by * 78.233) * 43758.5453) % 1).astype(np.float32)
        base = lerp(C(38, 42, 40), C(96, 100, 92), pv * 0.6 + n2 * 0.4)
        seams = ((xx % s2) < max(1, 1.2 * k)) | ((yy % s2) < max(1, 1.2 * k))
        base[seams] *= 0.5
        energy = seams & (pv > 0.72)
        base[energy] = C(90, 255, 130)
        sand = n1 > 0.7
        base[sand] = base[sand] * 0.45 + C(150, 140, 110) * 0.55
        micro = pv * 0.3 - seams * 0.2
    else:
        base = lerp(C(90, 90, 80), C(130, 130, 120), n1)
        micro = n1 * 0.3
    return base, micro


def sea_layer(h, w, land, rng, k=1.0):
    dist = ndimage.distance_transform_edt(~land) if land.any() else np.full((h, w), 999.0, np.float32)
    n1 = fbm((h, w), rng, base=max(4, 30 * k), octaves=4)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    depth = np.clip(dist / (70 * k) + (n1 - 0.5) * 0.4, 0, 1)
    base = lerp(C(52, 98, 104), C(10, 22, 40), depth)
    waves = np.sin((xx * 0.35 + yy) / (3.2 * k) + n1 * 9) > 0.86
    base[waves & (depth > 0.15)] *= 1.12
    foam = (dist < 2.5 * k) & (dist > 0)
    base[foam] = base[foam] * 0.4 + C(200, 210, 205) * 0.6
    return base


def hillshade(height, k, strength=1.0):
    gy, gx = np.gradient(ndimage.gaussian_filter(height, max(0.6, 0.9 * k)))
    return np.clip(1 + (-gx - gy) * 2.4 * strength, 0.68, 1.32)


def ground(t, w, h, seed, k=1.6):
    """Fundo do campo de batalha: um terreno só, com relevo."""
    rng = np.random.default_rng(seed)
    if t == "sea":
        land = np.zeros((h, w), bool)
        return np.clip(sea_layer(h, w, land, rng, k), 0, 255).astype(np.uint8)
    base, micro = terrain_layer(t, h, w, rng, k)
    height = fbm((h, w), rng, base=w / 6, octaves=5) * 0.6 + micro * 0.5
    img = base * hillshade(height, k, 0.8)[..., None]
    return np.clip(img, 0, 255).astype(np.uint8)
