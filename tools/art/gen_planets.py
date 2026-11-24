#!/usr/bin/env python3
"""
Gera a arte e os dados dos mapas da campanha a partir de
campaigns/wh40k/data/sector.json:

  Para cada corpo com províncias (planeta, lua, estação, asteroide):
    art/textures/ui/campaigns/wh40k/planets/<id>/map.png     mapa (terreno, bordas)
    art/textures/ui/campaigns/wh40k/planets/<id>/p_<prov>.png máscara da província
                                                  (alfa; pintada pela GUI com a cor do dono
                                                  e usada como área de clique)
    art/textures/ui/campaigns/wh40k/planets/<id>/globe.png   globo para a vista do sistema
    campaigns/wh40k/data/planets/<id>.json        retângulo de cada máscara, posição do
                                                  rótulo, vizinhos, área
  Sistema:
    art/textures/ui/campaigns/wh40k/system/{background,star,orbit}.png
  Ícones e campo de batalha:
    art/textures/ui/campaigns/wh40k/icons/*.png, battle/*.png, banner.png
    art/textures/ui/wh40k/emblems/*.png

As províncias são células de Voronoi com distorção por ruído (bordas
irregulares), a partir dos centros (x, y) do sector.json. "sea" vira mar;
estações e asteroides têm o vazio do espaço em volta.

Uso (na pasta do mod):  python3 tools/art/gen_planets.py [id ...]
"""
import json
import math
import os
import sys

import numpy as np
import terrain_tex as TT
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UI = os.path.join(ROOT, "art", "textures", "ui")
OUT = os.path.join(UI, "campaigns", "wh40k")
DATA = os.path.join(ROOT, "campaigns", "wh40k", "data")

TERRAIN_COLORS = {
    "hive": (92, 86, 84),
    "industrial": (98, 78, 58),
    "ash": (128, 120, 108),
    "jungle": (42, 74, 38),
    "mire": (58, 68, 44),
    "mountains": (96, 86, 76),
    "plains": (118, 106, 62),
    "ice": (186, 196, 206),
    "rok": (104, 88, 72),
    "station": (74, 80, 92),
    "biomass": (110, 50, 95),
    "warp": (90, 30, 30),
    "tomb": (70, 74, 68),
    "sea": (22, 38, 54),
    "void": (6, 6, 12),
}
PALETTE_TINT = {
    "hive": (1.0, 0.97, 0.92),
    "volcanic": (1.08, 0.88, 0.78),
    "ice": (0.95, 1.0, 1.06),
    "agri": (1.0, 1.04, 0.92),
    "rok": (1.05, 0.95, 0.85),
    "station": (0.95, 0.98, 1.05),
    "bio": (1.06, 0.9, 1.06),
    "warp": (1.12, 0.84, 0.9),
    "tomb": (0.9, 1.02, 0.94),
    "fortress": (0.96, 0.98, 1.02),
    "tau": (1.06, 1.0, 0.9),
    "khorne": (1.2, 0.8, 0.72),
    "nurgle": (0.98, 1.06, 0.78),
    "tzeentch": (0.82, 0.92, 1.2),
    "slaanesh": (1.14, 0.82, 1.12),
    "forge": (1.14, 0.86, 0.74),
    "dark": (0.84, 0.92, 1.02),
}
ATMOSPHERE = {
    "hive": (200, 150, 90), "volcanic": (230, 110, 50), "ice": (160, 200, 240),
    "agri": (150, 200, 120), "rok": (0, 0, 0), "station": (0, 0, 0),
    "bio": (200, 90, 200), "warp": (240, 60, 120), "tomb": (90, 230, 130), "fortress": (180, 190, 210), "tau": (230, 190, 120),
    "khorne": (240, 50, 30), "nurgle": (170, 200, 70), "tzeentch": (80, 140, 255), "slaanesh": (230, 90, 220),
    "forge": (220, 90, 50), "dark": (120, 70, 180),
}


def pow2(n, cap=1024):
    p = 16
    while p < n and p < cap:
        p *= 2
    return p


def noise(shape, scale, rng):
    """Ruído suave em [0, 1] (campo aleatório borrado)."""
    h, w = shape
    sh, sw = max(2, int(h / scale)) + 2, max(2, int(w / scale)) + 2
    small = rng.random((sh, sw)).astype(np.float32)
    big = np.asarray(Image.fromarray((small * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)).astype(np.float32) / 255
    return big


def fbm(shape, rng, base=64, octaves=4):
    total = np.zeros(shape, np.float32)
    amp, norm = 1.0, 0.0
    scale = base
    for _ in range(octaves):
        total += noise(shape, scale, rng) * amp
        norm += amp
        amp *= 0.5
        scale = max(2, scale / 2)
    return total / norm


def assign_provinces(body, w, h, rng):
    provs = body["provinces"]
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    warp = min(w, h) * 0.07
    wx = xx + (fbm((h, w), rng, base=w / 6) - 0.5) * 2 * warp
    wy = yy + (fbm((h, w), rng, base=w / 6) - 0.5) * 2 * warp
    best = np.full((h, w), np.inf, np.float32)
    ids = np.zeros((h, w), np.int16)
    for i, p in enumerate(provs):
        px, py = p["x"] * w, p["y"] * h
        # mares um pouco "maiores" (peso), para formar costas largas
        weight = 0.85 if p["terrain"] == "sea" else 1.0
        d = ((wx - px) ** 2 + (wy - py) ** 2) * weight
        mask = d < best
        best[mask] = d[mask]
        ids[mask] = i
    void = np.zeros((h, w), bool)
    if body["palette"] in ("station", "rok"):
        # Corpo pequeno no vazio: elipse com borda irregular.
        cx, cy = w / 2, h / 2
        r = np.sqrt(((xx - cx) / (w * 0.46)) ** 2 + ((yy - cy) / (h * 0.44)) ** 2)
        edge = 0.82 + (fbm((h, w), rng, base=w / 8) - 0.5) * 0.35
        void = r > edge
    return ids, void


def render_map(body, ids, void, w, h, rng):
    """Mapa do corpo: texturas de terreno (terrain_tex.py) com transição
    suave entre províncias de terreno diferente, relevo sombreado, mar com
    profundidade e espuma, brilho das colmeias e bordas em relevo."""
    provs = body["provinces"]
    terrain_of = [p["terrain"] for p in provs]
    k = w / 2048
    trng = np.random.default_rng(body.get("seed", 1) * 7919 + 13)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    land = np.array([t != "sea" for t in terrain_of])[ids] & ~void
    tid = np.array(terrain_of)[ids]

    # Terra: camadas por terreno misturadas por máscaras borradas.
    img = np.zeros((h, w, 3), np.float32)
    micro = np.zeros((h, w), np.float32)
    total = np.zeros((h, w), np.float32)
    jitter = TT.fbm((h, w), trng, base=max(3, 10 * k), octaves=3)
    for t in sorted(set(terrain_of) - {"sea"}):
        m = (tid == t) & land
        if not m.any():
            continue
        wgt = ndimage.gaussian_filter(m.astype(np.float32), max(1.0, 5 * k)) * (0.6 + 0.8 * jitter)
        wgt = np.where(land, wgt, 0) + m * 1e-3
        layer, mic = TT.terrain_layer(t, h, w, trng, k)
        img += layer * wgt[..., None]
        micro += mic * wgt
        total += wgt
    total = np.maximum(total, 1e-6)
    img /= total[..., None]
    micro /= total

    # Relevo geral (montanhas e rocha mais altas) e sombreamento.
    height = TT.fbm((h, w), trng, base=w / 8, octaves=6) * 0.7 + micro * 0.55
    mount = np.isin(ids, [i for i, t in enumerate(terrain_of) if t in ("mountains", "rok")])
    height += ndimage.gaussian_filter(mount.astype(np.float32), 8 * k) * 0.6
    img *= TT.hillshade(height, k)[..., None]

    # Praia: a terra junto ao mar clareia.
    if (~land & ~void).any():
        dist_land = ndimage.distance_transform_edt(~(~land & ~void))
        beach = land & (dist_land < 4 * k)
        img[beach] = img[beach] * 0.55 + np.array((158, 146, 112), np.float32) * 0.45
        sea = TT.sea_layer(h, w, land | void, trng, k)
        img[~land & ~void] = sea[~land & ~void]

    # Colmeias: sombra e brilho leve em volta (a cidade é desenhada depois, draw_cities).
    for i, p in enumerate(provs):
        if p.get("hive"):
            px, py = p["x"] * w, p["y"] * h
            r = np.sqrt((xx - px) ** 2 + (yy - py) ** 2) / (min(w, h) * (0.12 if p["hive"] == 2 else 0.075))
            glow = np.clip(1 - r, 0, 1) ** 1.5 * (ids == i)
            img = img * (1 - glow[..., None] * 0.35) + np.array((255, 160, 80), np.float32) * glow[..., None] * 0.12
    img *= np.array(PALETTE_TINT.get(body["palette"], (1, 1, 1)), np.float32)

    # Vazio do espaço com estrelas (corpos pequenos).
    if void.any():
        stars = trng.random((h, w))
        img[void] = TERRAIN_COLORS["void"]
        img[void & (stars > 0.997)] = (200, 200, 220)
        rim = ndimage.distance_transform_edt(~void)
        edge = (~void) & (rim < 5 * max(k, 0.6))
        img[edge] *= 0.55

    # Bordas entre províncias em relevo: linha escura e filete claro.
    border = np.zeros((h, w), bool)
    border[:, 1:] |= ids[:, 1:] != ids[:, :-1]
    border[1:, :] |= ids[1:, :] != ids[:-1, :]
    border &= land
    border = ndimage.binary_dilation(border, iterations=max(1, int(round(1.2 * k))))
    light = np.roll(np.roll(border, 1, 0), 1, 1) & ~border & land
    img[light] = img[light] * 0.7 + np.array((215, 190, 130), np.float32) * 0.3
    img[border] = img[border] * 0.3 + np.array((22, 16, 10), np.float32) * 0.7

    # Vinheta gótica leve.
    cx, cy = w / 2, h / 2
    r = np.sqrt(((xx - cx) / cx) ** 2 + ((yy - cy) / cy) ** 2)
    img *= np.clip(1.12 - 0.28 * r, 0.6, 1.0)[..., None]
    return np.clip(img, 0, 255).astype(np.uint8), land


def province_data(body, ids, land, w, h, out_dir):
    provs = body["provinces"]
    data = {}
    adj = set()
    # vizinhos: pixels de terra lado a lado com províncias diferentes
    for a, b in ((ids[:, 1:], ids[:, :-1]), (ids[1:, :], ids[:-1, :])):
        diff = a != b
        pairs = np.stack([a[diff], b[diff]], axis=1)
        for x, y in np.unique(pairs, axis=0):
            adj.add((int(min(x, y)), int(max(x, y))))
    for i, p in enumerate(provs):
        if p["terrain"] == "sea":
            continue
        m = (ids == i) & land
        if not m.any():
            print("  aviso: província sem área:", p["id"])
            continue
        ys, xs = np.nonzero(m)
        x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        crop = m[y0:y1, x0:x1].astype(np.uint8) * 255
        mw, mh = pow2(x1 - x0, 512), pow2(y1 - y0, 512)
        alpha = Image.fromarray(crop).resize((mw, mh), Image.LANCZOS)
        rgba = Image.merge("RGBA", [Image.new("L", (mw, mh), 255)] * 3 + [alpha])
        rgba.save(os.path.join(out_dir, "p_%s.png" % p["id"]))
        # rótulo: ponto mais "interno" da província
        dist = ndimage.distance_transform_edt(m)
        ly, lx = np.unravel_index(np.argmax(dist), dist.shape)
        neighbors = []
        for a, b in adj:
            if i in (a, b):
                other = b if a == i else a
                if provs[other]["terrain"] != "sea":
                    neighbors.append(provs[other]["id"])
        data[p["id"]] = {
            "rect": [round(x0 / w, 5), round(y0 / h, 5), round(x1 / w, 5), round(y1 / h, 5)],
            "label": [round(lx / w, 4), round(ly / h, 4)],
            "area": int(m.sum()),
            "neighbors": sorted(neighbors),
            "coastal": bool(any(provs[o]["terrain"] == "sea" for a, b in adj if i in (a, b) for o in (a, b) if o != i))
        }
    return data


def render_globe(body, map_img, rng, void, size=256):
    """Globo ortográfico com luz lateral e atmosfera."""
    src = np.asarray(map_img).astype(np.float32)
    h, w = src.shape[:2]
    yy, xx = np.mgrid[0:size, 0:size].astype(np.float32)
    r = size * 0.42
    nx, ny = (xx - size / 2) / r, (yy - size / 2) / r
    if body["palette"] == "rok":
        ang = np.arctan2(ny, nx)
        bump = 1 + 0.12 * np.sin(ang * 3 + 1) + 0.08 * np.sin(ang * 5 + 2)
        nx, ny = nx / bump, ny / bump
    rr = nx ** 2 + ny ** 2
    inside = rr <= 1
    nz = np.sqrt(np.clip(1 - rr, 0, 1))
    lat = np.arcsin(np.clip(ny, -1, 1))
    lon = np.arctan2(nx, nz) + 0.6
    u = ((lon / (2 * math.pi)) % 1) * (w - 1)
    v = (lat / math.pi + 0.5) * (h - 1)
    small_body = body["palette"] in ("station", "rok")
    if small_body:
        # corpo pequeno: o mapa já é o "disco" visto de cima
        u = (0.5 + nx * 0.47) * (w - 1)
        v = (0.5 + ny * 0.45) * (h - 1)
    ui, vi = u.astype(int).clip(0, w - 1), v.astype(int).clip(0, h - 1)
    col = src[vi, ui]
    if small_body:
        inside = inside & ~void[vi, ui]
        nz = np.where(inside, nz, 0)
    light = np.clip(nx * -0.55 + ny * -0.35 + nz * 0.75, 0, 1) * 1.15 + 0.08
    rgb = col * light[..., None]
    alpha = np.zeros((size, size), np.float32)
    alpha[inside] = 255
    atm = ATMOSPHERE.get(body["palette"], (0, 0, 0))
    if sum(atm):
        dist = np.sqrt(rr)
        halo = np.clip(1 - np.abs(dist - 1.0) / 0.09, 0, 1) * np.clip(light + 0.3, 0, 1)
        rgb = rgb * (1 - halo[..., None] * 0.5) + np.array(atm, np.float32) * halo[..., None] * 0.9
        alpha = np.maximum(alpha, halo * 220)
    out = np.dstack([np.clip(rgb, 0, 255), alpha]).astype(np.uint8)
    img = Image.fromarray(out, "RGBA")
    if body["kind"] == "station":
        d = ImageDraw.Draw(img)
        for k in range(3):
            d.ellipse((size * 0.06 + k, size * 0.40 + k, size * 0.94 - k, size * 0.60 - k), outline=(200, 170, 110, 200))
    return img


CITIES = os.path.join(UI, "campaigns", "wh40k", "cities")


def draw_cities(body, map_img, ids):
    """Cidades-colmeia vistas de cima (tools/art/slice_space.py) no centro das províncias com cidade."""
    if not os.path.isdir(CITIES):
        return map_img
    w, h = map_img.size
    tint = np.array(PALETTE_TINT.get(body["palette"], (1, 1, 1)), np.float32)
    out = map_img.convert("RGBA")
    for i, p in enumerate(body["provinces"]):
        if not p.get("hive") or p["terrain"] == "sea":
            continue
        n = sum(ord(ch) for ch in p["id"]) % 12
        city = Image.open(os.path.join(CITIES, "city_%d.png" % n)).convert("RGBA")
        size = int(min(w, h) * (0.24 if p["hive"] == 2 else 0.14) * (0.75 if body["palette"] in ("station", "rok") else 1))
        city = city.resize((size, size), Image.LANCZOS)
        arr = np.asarray(city).astype(np.float32)
        arr[..., :3] = np.clip(arr[..., :3] * tint, 0, 255)
        city = Image.fromarray(arr.astype(np.uint8), "RGBA")
        # Sombra escura em volta: a cidade se destaca do terreno.
        alpha = city.getchannel("A").filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(max(2, size // 40)))
        shadow = Image.new("RGBA", city.size, (8, 6, 4, 0))
        shadow.putalpha(alpha.point(lambda v: int(v * 0.85)))
        x, y = int(p["x"] * w - size / 2), int(p["y"] * h - size / 2)
        out.alpha_composite(shadow, (x + max(2, size // 50), y + max(2, size // 50)))
        out.alpha_composite(city, (x, y))
    return out.convert("RGB")


def gen_body(body):
    w, h = body["mapSize"]
    rng = np.random.default_rng(body.get("seed", 1))
    out_dir = os.path.join(OUT, "planets", body["id"])
    os.makedirs(out_dir, exist_ok=True)
    for f in os.listdir(out_dir):
        if f.startswith("p_"):
            os.remove(os.path.join(out_dir, f))
    ids, void = assign_provinces(body, w, h, rng)
    img, land = render_map(body, ids, void, w, h, rng)
    map_img = draw_cities(body, Image.fromarray(img, "RGB"), ids)
    # A textura precisa de lados em potência de 2: salva esticada (a tela
    # desenha o mapa na proporção de mapSize).
    map_img.resize((pow2(w, 4096), pow2(h, 4096) if pow2(h, 4096) <= h else pow2(h, 4096) // 2), Image.LANCZOS).save(os.path.join(out_dir, "map.png"))
    provinces = province_data(body, ids, land, w, h, out_dir)
    render_globe(body, map_img, rng, void).save(os.path.join(out_dir, "globe.png"))
    os.makedirs(os.path.join(DATA, "planets"), exist_ok=True)
    with open(os.path.join(DATA, "planets", body["id"] + ".json"), "w") as f:
        json.dump({"id": body["id"], "mapSize": [w, h], "provinces": provinces}, f, indent="\t", ensure_ascii=False)
    print(body["id"], "ok:", len(provinces), "províncias;", sum(len(p["neighbors"]) for p in provinces.values()) // 2, "fronteiras")


# ---------------------------------------------------------------- sistema e ícones

def gen_system():
    rng = np.random.default_rng(1999)
    d = os.path.join(OUT, "system")
    os.makedirs(d, exist_ok=True)
    w, h = 2048, 1024
    neb = fbm((h, w), rng, base=300, octaves=5)
    neb2 = fbm((h, w), rng, base=200, octaves=5)
    img = np.zeros((h, w, 3), np.float32)
    img += np.array((8, 6, 14), np.float32)
    img += (np.clip(neb - 0.45, 0, 1) ** 1.5 * 260)[..., None] * np.array((0.55, 0.18, 0.35), np.float32)
    img += (np.clip(neb2 - 0.5, 0, 1) ** 1.5 * 220)[..., None] * np.array((0.15, 0.3, 0.5), np.float32)
    stars = rng.random((h, w))
    img[stars > 0.9985] = (230, 225, 210)
    img[(stars > 0.997) & (stars <= 0.9985)] = (120, 120, 140)
    Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.4)).save(os.path.join(d, "background.png"))
    # estrela
    s = 512
    yy, xx = np.mgrid[0:s, 0:s].astype(np.float32)
    r = np.sqrt((xx - s / 2) ** 2 + (yy - s / 2) ** 2) / (s / 2)
    core = np.clip(1 - r / 0.28, 0, 1)
    glow = np.clip(1 - r, 0, 1) ** 2.5
    a = np.clip(core * 255 + glow * 200, 0, 255)
    col = np.dstack([np.full_like(r, 255), 200 + 55 * core, 130 + 125 * core, a])
    Image.fromarray(col.astype(np.uint8), "RGBA").save(os.path.join(d, "star.png"))
    # anel da órbita (contorno fino)
    s = 1024
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    dr = ImageDraw.Draw(img)
    dr.ellipse((3, 3, s - 4, s - 4), outline=(255, 255, 255, 255), width=3)
    img.save(os.path.join(d, "orbit.png"))
    # seleção (halo)
    s = 256
    yy, xx = np.mgrid[0:s, 0:s].astype(np.float32)
    r = np.sqrt((xx - s / 2) ** 2 + (yy - s / 2) ** 2) / (s / 2)
    a = np.clip(1 - np.abs(r - 0.86) / 0.1, 0, 1) * 255
    Image.fromarray(np.dstack([np.full_like(r, 255)] * 3 + [a]).astype(np.uint8), "RGBA").save(os.path.join(d, "halo.png"))


def mask_icon(path, size, draw_fn):
    img = Image.new("L", (size[0] * 4, size[1] * 4), 0)
    draw_fn(ImageDraw.Draw(img), size[0] * 4, size[1] * 4)
    img = img.resize(size, Image.LANCZOS)
    Image.merge("RGBA", [Image.new("L", size, 255)] * 3 + [img]).save(path)


def gen_icons():
    d = os.path.join(OUT, "icons")
    os.makedirs(d, exist_ok=True)

    def ship(dr, w, h):
        # cruzador gótico: proa em ponta, castelo alto atrás
        dr.polygon([(w * 0.02, h * 0.5), (w * 0.3, h * 0.3), (w * 0.75, h * 0.3), (w * 0.8, h * 0.1), (w * 0.92, h * 0.1),
                    (w * 0.95, h * 0.35), (w * 0.98, h * 0.5), (w * 0.95, h * 0.65), (w * 0.92, h * 0.9), (w * 0.8, h * 0.9),
                    (w * 0.75, h * 0.7), (w * 0.3, h * 0.7)], fill=255)
    mask_icon(os.path.join(d, "fleet.png"), (128, 64), ship)

    def spire(dr, w, h):
        for cx, top, bw in ((0.5, 0.02, 0.16), (0.3, 0.25, 0.12), (0.7, 0.2, 0.12), (0.15, 0.5, 0.1), (0.85, 0.45, 0.1)):
            dr.polygon([(w * (cx - bw), h), (w * (cx - bw * 0.6), h * (top + 0.15)), (w * cx, h * top),
                        (w * (cx + bw * 0.6), h * (top + 0.15)), (w * (cx + bw), h)], fill=255)
    mask_icon(os.path.join(d, "hive.png"), (64, 64), spire)

    def fort(dr, w, h):
        dr.rectangle((w * 0.1, h * 0.35, w * 0.9, h * 0.95), fill=255)
        for i in range(5):
            x = w * (0.1 + i * 0.18)
            dr.rectangle((x, h * 0.15, x + w * 0.1, h * 0.35), fill=255)
        dr.rectangle((w * 0.42, h * 0.6, w * 0.58, h * 0.95), fill=0)
    mask_icon(os.path.join(d, "fort.png"), (64, 64), fort)

    def anchor(dr, w, h):
        dr.ellipse((w * 0.38, h * 0.02, w * 0.62, h * 0.26), outline=255, width=int(w * 0.06))
        dr.rectangle((w * 0.46, h * 0.24, w * 0.54, h * 0.9), fill=255)
        dr.rectangle((w * 0.25, h * 0.36, w * 0.75, h * 0.43), fill=255)
        dr.arc((w * 0.1, h * 0.4, w * 0.9, h * 0.98), 20, 160, fill=255, width=int(w * 0.08))
    mask_icon(os.path.join(d, "shipyard.png"), (64, 64), anchor)

    def ring(dr, w, h):
        dr.ellipse((w * 0.04, h * 0.04, w * 0.96, h * 0.96), outline=255, width=int(w * 0.07))
    mask_icon(os.path.join(d, "ring.png"), (128, 128), ring)

    def disc(dr, w, h):
        dr.ellipse((0, 0, w - 1, h - 1), fill=255)
    mask_icon(os.path.join(d, "disc.png"), (128, 128), disc)

    def shield(dr, w, h):
        dr.polygon([(w * 0.1, h * 0.05), (w * 0.9, h * 0.05), (w * 0.9, h * 0.5), (w * 0.5, h * 0.97), (w * 0.1, h * 0.5)], fill=255)
    mask_icon(os.path.join(d, "shield.png"), (64, 64), shield)

    def arrow(dr, w, h):
        dr.polygon([(0, h * 0.35), (w * 0.6, h * 0.35), (w * 0.6, h * 0.1), (w, h * 0.5), (w * 0.6, h * 0.9), (w * 0.6, h * 0.65), (0, h * 0.65)], fill=255)
    mask_icon(os.path.join(d, "arrow.png"), (64, 64), arrow)

    def swords(dr, w, h):
        lw = int(w * 0.1)
        dr.line((w * 0.1, h * 0.1, w * 0.9, h * 0.9), fill=255, width=lw)
        dr.line((w * 0.9, h * 0.1, w * 0.1, h * 0.9), fill=255, width=lw)
        dr.line((w * 0.15, h * 0.55, w * 0.45, h * 0.85), fill=255, width=lw)
        dr.line((w * 0.85, h * 0.55, w * 0.55, h * 0.85), fill=255, width=lw)
    mask_icon(os.path.join(d, "battle.png"), (64, 64), swords)

    # cor sólida para barras e marcadores
    Image.new("RGBA", (16, 16), (255, 255, 255, 255)).save(os.path.join(d, "white.png"))
    # moldura gótica (borda dourada) para painéis: 9 partes evitadas, imagem esticada
    s = 256
    fr = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    dr = ImageDraw.Draw(fr)
    dr.rectangle((0, 0, s - 1, s - 1), outline=(150, 120, 60, 255), width=3)
    dr.rectangle((6, 6, s - 7, s - 7), outline=(90, 70, 35, 255), width=1)
    fr.save(os.path.join(d, "frame.png"))


def gen_battle_art():
    """Fundos do mapa de desdobramento por terreno e sprites das feições."""
    d = os.path.join(OUT, "battle")
    os.makedirs(d, exist_ok=True)
    rng = np.random.default_rng(77)
    s = 512
    # Fundos do campo (retangular, 1024x512) com a mesma textura dos mapas.
    for i, t in enumerate(TERRAIN_COLORS):
        if t == "void":
            continue
        img = TT.ground(t, 1024, 512, 500 + i, k=1.3)
        Image.fromarray(img).save(os.path.join(d, "ground_%s.png" % t))

    def blob(name, color, kind):
        s = 128
        yy, xx = np.mgrid[0:s, 0:s].astype(np.float32)
        r = np.sqrt((xx - s / 2) ** 2 + (yy - s / 2) ** 2) / (s / 2)
        n = fbm((s, s), rng, base=14, octaves=3)
        edge = 0.8 + (n - 0.5) * 0.4
        a = np.clip((edge - r) / 0.08, 0, 1)
        rgb = np.array(color, np.float32)[None, None, :] * (0.6 + 0.6 * n)[..., None]
        if kind == "hill":
            rgb *= np.clip(1.25 - r * 0.6, 0.6, 1.3)[..., None]
            rings = (np.abs(((r * 6) % 1) - 0.5) < 0.05) & (r < edge)
            rgb[rings] *= 0.6
        elif kind == "forest":
            dots = fbm((s, s), rng, base=5, octaves=2) > 0.55
            rgb[dots] *= 0.55
        elif kind == "ruins":
            a = np.zeros((s, s), np.float32)
            for _ in range(9):
                x0, y0 = rng.integers(10, 90, 2)
                bw, bh = rng.integers(10, 32, 2)
                a[y0:y0 + bh, x0:x0 + bw] = 1
            rgb[(xx % 6 < 1)] *= 0.7
        elif kind == "crater":
            ring = np.clip(1 - np.abs(r - 0.6) / 0.15, 0, 1)
            rgb *= (0.5 + 0.8 * ring)[..., None]
        out = np.dstack([np.clip(rgb, 0, 255), a * 255]).astype(np.uint8)
        Image.fromarray(out, "RGBA").save(os.path.join(d, name + ".png"))
    blob("hill", (130, 115, 90), "hill")
    blob("forest", (40, 80, 35), "forest")
    blob("ruins", (110, 105, 100), "ruins")
    blob("crater", (90, 75, 60), "crater")
    blob("water", (30, 60, 90), "water")
    blob("rocks", (100, 95, 90), "hill")
    gen_wall(d, rng)
    gen_trench(d, rng)


def gen_trench(d, rng):
    """Trincheira vista de cima (Krieg): terra revolvida, vala em ziguezague e sacos de areia."""
    s = 128
    yy, xx = np.mgrid[0:s, 0:s].astype(np.float32)
    r = np.sqrt((xx - s / 2) ** 2 + (yy - s / 2) ** 2) / (s / 2)
    n = fbm((s, s), rng, base=12, octaves=3)
    edge = 0.86 + (n - 0.5) * 0.3
    a = np.clip((edge - r) / 0.1, 0, 1) * 0.95
    earth = np.array((92, 72, 50), np.float32)[None, None, :] * (0.65 + 0.6 * n)[..., None]
    # Linha em ziguezague no meio (a vala), com pontas arredondadas.
    zig = s / 2 + 14 * (2 * np.abs(((xx - 8) / 30) % 1 - 0.5) * 2 - 1) * 0.6
    dist = np.abs(yy - zig)
    inside = (xx > 14) & (xx < s - 14)
    ditch = (dist < 7) & inside
    rim = (dist >= 7) & (dist < 12) & inside
    earth[ditch] = np.array((34, 26, 20), np.float32) * (0.8 + 0.4 * n[ditch])[..., None]
    # Sacos de areia na borda de cima (do lado do inimigo) e na de baixo.
    bags = rim & (((xx // 6) + (yy // 4)) % 2 == 0)
    earth[rim] = np.array((150, 132, 96), np.float32) * (0.75 + 0.4 * n[rim])[..., None]
    earth[bags] *= 0.78
    # Pranchas no fundo da vala.
    planks = ditch & (xx % 9 < 2)
    earth[planks] = (70, 52, 34)
    a[ditch | rim] = 1
    out = np.dstack([np.clip(earth, 0, 255), a * 255]).astype(np.uint8)
    Image.fromarray(out, "RGBA").save(os.path.join(d, "trench.png"))


def gen_wall(d, rng):
    """Bastião visto de cima (muralha do defensor com fortificações; vira ruína ao cair)."""
    s = 128
    yy, xx = np.mgrid[0:s, 0:s].astype(np.float32)
    r = np.sqrt((xx - s / 2) ** 2 + (yy - s / 2) ** 2) / (s / 2)
    ang = np.arctan2(yy - s / 2, xx - s / 2)
    n = fbm((s, s), rng, base=10, octaves=3)
    merlons = (np.cos(ang * 16) > 0.2)
    outer = np.where(merlons, 0.92, 0.84)
    a = (r < outer).astype(np.float32)
    stone = np.array((120, 115, 108), np.float32)[None, None, :] * (0.7 + 0.5 * n)[..., None]
    ring = (r > 0.62) & (r < outer)
    stone[ring] *= 1.15
    stone[(r > 0.55) & (r <= 0.62)] *= 0.45
    stone[r <= 0.55] *= 0.8
    blocks = ((xx // 9 + yy // 9) % 2 == 0) & (r <= 0.55)
    stone[blocks] *= 0.9
    stone *= np.clip(1.15 - (yy / s) * 0.4, 0.7, 1.2)[..., None]
    out = np.dstack([np.clip(stone, 0, 255), a * 255]).astype(np.uint8)
    Image.fromarray(out, "RGBA").save(os.path.join(d, "wall.png"))


def gen_emblems_and_banner():
    d = os.path.join(UI, "wh40k", "emblems")
    os.makedirs(d, exist_ok=True)
    port = os.path.join(UI, "wh40k", "portraits")

    def circle(src, dst, ring_color):
        img = Image.open(src).convert("RGBA").resize((256, 256), Image.LANCZOS)
        m = Image.new("L", (1024, 1024), 0)
        ImageDraw.Draw(m).ellipse((16, 16, 1008, 1008), fill=255)
        img.putalpha(m.resize((256, 256), Image.LANCZOS))
        dr = ImageDraw.Draw(img)
        dr.ellipse((4, 4, 251, 251), outline=ring_color + (255,), width=8)
        img.save(dst)
    # Um emblema por facção, do retrato em factions.json: emblemSource.
    with open(os.path.join(DATA, "factions.json")) as f:
        factions = json.load(f)["factions"]
    for fid, fac in factions.items():
        src = fac.get("emblemSource")
        if src and os.path.exists(os.path.join(port, src)):
            circle(os.path.join(port, src), os.path.join(d, fid + ".png"), tuple(fac["color"]))
    # banner da campanha: retratos dos dois lados sobre o fundo do sistema
    bg = Image.open(os.path.join(OUT, "system", "background.png")).convert("RGB").crop((0, 0, 1024, 512))
    a = Image.open(os.path.join(port, "imperial", "r0c6.png")).resize((400, 400), Image.LANCZOS)
    b = Image.open(os.path.join(port, "orks", "r0c5.png")).resize((400, 400), Image.LANCZOS)
    bg.paste(a, (40, 56))
    bg.paste(b, (584, 56))
    dr = ImageDraw.Draw(bg)
    dr.rectangle((2, 2, 1021, 509), outline=(170, 140, 60), width=4)
    bg.save(os.path.join(OUT, "banner.png"))


def main():
    # Todos os setores das campanhas (scenarios.json).
    with open(os.path.join(DATA, "scenarios.json")) as f:
        sectors = [sc["sector"] for sc in json.load(f)["scenarios"]]
    bodies = []
    for name in dict.fromkeys(sectors):
        with open(os.path.join(DATA, name)) as f:
            bodies += json.load(f)["bodies"]
    only = set(sys.argv[1:])
    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, "textures.xml"), "w") as f:
        f.write('<?xml version="1.0" encoding="utf-8"?>\n<Textures>\n  <File pattern="*" format="rgba" mipmap="false"/>\n</Textures>\n')
    for body in bodies:
        if body.get("provinces") and (not only or body["id"] in only):
            gen_body(body)
    if not only:
        gen_system()
        gen_icons()
        gen_battle_art()
        gen_emblems_and_banner()
        print("sistema, ícones, campo de batalha, emblemas e banner ok")


if __name__ == "__main__":
    main()
