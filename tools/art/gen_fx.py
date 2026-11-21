"""Gera os quadros dos efeitos animados (sprites) da campanha e da batalha 2D:
art/textures/ui/campaigns/wh40k/fx/<efeito>_<NN>.png (tamanhos potência de 2).

  explosion  12 quadros 128x128  bola de fogo, onda de choque e fumaça
  impact      6 quadros  64x64   clarão de tiro / impacto pequeno
  orbital    14 quadros 128x256  feixe que desce da órbita e explode no chão
  droppod    10 quadros 128x256  cápsula em chamas caindo e a poeira do impacto
  fire        8 quadros 128x128  chamas em laço (saque, província devastada)
  smoke       8 quadros 128x128  fumaça subindo em laço
  ring       10 quadros 128x128  anel branco que se expande (tingido pela cor da facção)
  clash      10 quadros 128x128  faíscas e clarões de combate corpo a corpo
  laser      10 quadros  64x256  lança orbital pulsando
  blood       6 quadros  64x64   respingo de baixas (infantaria)
Os efeitos são procedurais (numpy), com semente fixa: rodar de novo dá o mesmo resultado.
"""
import math
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "art/textures/ui/campaigns/wh40k/fx")


def canvas(w, h):
    return np.zeros((h, w, 4), dtype=np.float32)


def over(dst, rgb, alpha):
    """Compõe uma camada (rgb HxWx3 ou cor, alpha HxW 0..1) sobre dst."""
    a = np.clip(alpha, 0, 1)[..., None]
    if not isinstance(rgb, np.ndarray) or rgb.ndim == 1:
        rgb = np.broadcast_to(np.array(rgb, dtype=np.float32) / 255.0, dst[..., :3].shape)
    da = dst[..., 3:4]
    out_a = a + da * (1 - a)
    safe = np.where(out_a > 1e-6, out_a, 1)
    dst[..., :3] = (rgb * a + dst[..., :3] * da * (1 - a)) / safe
    dst[..., 3:4] = out_a


def grid(w, h):
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    return x, y


def blob(w, h, cx, cy, r, power=1.6, sx=1.0, sy=1.0):
    x, y = grid(w, h)
    d = np.sqrt(((x - cx) / sx) ** 2 + ((y - cy) / sy) ** 2) / max(r, 0.5)
    return np.clip(1 - d, 0, 1) ** power


def ring(w, h, cx, cy, r, width):
    x, y = grid(w, h)
    d = np.sqrt((x - cx) ** 2 + (y - cy) ** 2)
    return np.clip(1 - np.abs(d - r) / max(width, 0.5), 0, 1) ** 1.5


def heat(t):
    """Cor do fogo: t=1 branco-amarelo, 0.6 laranja, 0.3 vermelho, 0 fumaça escura."""
    stops = [(0.0, (40, 34, 30)), (0.25, (120, 40, 18)), (0.45, (215, 80, 20)), (0.7, (255, 165, 40)), (0.9, (255, 235, 150)), (1.0, (255, 255, 235))]
    t = max(0.0, min(1.0, t))
    for (t0, c0), (t1, c1) in zip(stops, stops[1:]):
        if t <= t1:
            k = (t - t0) / (t1 - t0)
            return tuple(c0[i] + (c1[i] - c0[i]) * k for i in range(3))
    return stops[-1][1]


def save(img, name, i):
    os.makedirs(OUT, exist_ok=True)
    arr = np.clip(img * 255, 0, 255).astype(np.uint8)
    Image.fromarray(arr, "RGBA").save(os.path.join(OUT, "%s_%02d.png" % (name, i)))


def fireball(img, cx, cy, scale, p, rng_seed):
    """Explosão no quadro de progresso p (0..1) centrada em cx, cy."""
    h, w = img.shape[:2]
    rng = np.random.RandomState(rng_seed)
    R = scale * (0.18 + 0.42 * math.sqrt(p))
    # Onda de choque.
    if p < 0.45:
        k = p / 0.45
        over(img, (255, 230, 190), ring(w, h, cx, cy, scale * 0.9 * k, scale * 0.05) * (1 - k) * 0.8)
    # Fumaça (aparece no fim).
    puffs = [(rng.uniform(0, 2 * math.pi), rng.uniform(0.1, 0.75), rng.uniform(0.35, 0.6)) for _ in range(16)]
    smoke_a = max(0.0, min(1.0, (p - 0.25) / 0.35)) * (1 - max(0.0, (p - 0.75) / 0.25))
    if smoke_a > 0:
        for ang, dist, size in puffs:
            px = cx + math.cos(ang) * dist * R * 1.1
            py = cy + math.sin(ang) * dist * R * 0.8 - p * scale * 0.18
            over(img, (55, 48, 44), blob(w, h, px, py, size * R * 1.1, 1.3) * smoke_a * 0.75)
    # Bola de fogo.
    fire_t = 1 - p
    if fire_t > 0.05:
        for ang, dist, size in puffs:
            px = cx + math.cos(ang) * dist * R * 0.8
            py = cy + math.sin(ang) * dist * R * 0.7 - p * scale * 0.1
            t = fire_t * (1.05 - dist * 0.5)
            over(img, heat(t), blob(w, h, px, py, size * R, 1.4) * min(1, fire_t * 1.6))
        over(img, heat(min(1, fire_t * 1.2 + 0.1)), blob(w, h, cx, cy, R * 0.55, 1.8) * min(1, fire_t * 1.8))


def gen_explosion():
    for i in range(12):
        img = canvas(128, 128)
        fireball(img, 64, 66, 92, i / 11, 7)
        save(img, "explosion", i)


def gen_impact():
    for i in range(6):
        p = i / 5
        img = canvas(64, 64)
        over(img, (255, 200, 90), blob(64, 64, 32, 32, 26 * (0.4 + p * 0.6), 2.0) * (1 - p))
        over(img, (255, 250, 220), blob(64, 64, 32, 32, 12 * (1 - p * 0.7), 1.5) * (1 - p))
        rng = np.random.RandomState(3)
        for _ in range(6):
            ang = rng.uniform(0, 2 * math.pi)
            d = 8 + 20 * p
            over(img, (255, 220, 120), blob(64, 64, 32 + math.cos(ang) * d, 32 + math.sin(ang) * d, 3, 1.2) * (1 - p))
        save(img, "impact", i)


def gen_blood():
    for i in range(6):
        p = i / 5
        img = canvas(64, 64)
        rng = np.random.RandomState(11)
        for _ in range(9):
            ang = rng.uniform(0, 2 * math.pi)
            d = rng.uniform(4, 22) * (0.3 + p)
            over(img, (120, 10, 10), blob(64, 64, 32 + math.cos(ang) * d, 32 + math.sin(ang) * d, rng.uniform(3, 7), 1.0) * (1 - p * 0.8))
        over(img, (90, 80, 70), blob(64, 64, 32, 34, 14 * (0.5 + p), 1.4) * 0.5 * (1 - p))
        save(img, "blood", i)


def beam(img, cx, top, bottom, width, color, alpha):
    h, w = img.shape[:2]
    x, y = grid(w, h)
    inside = ((y >= top) & (y <= bottom)).astype(np.float32)
    core = np.clip(1 - np.abs(x - cx) / max(width * 0.3, 0.5), 0, 1)
    glow = np.clip(1 - np.abs(x - cx) / max(width, 0.5), 0, 1) ** 2
    over(img, color, glow * inside * alpha * 0.7)
    over(img, (255, 255, 245), core * inside * alpha)


def gen_orbital():
    ground = 200
    for i in range(14):
        img = canvas(128, 256)
        if i < 5:
            k = (i + 1) / 5
            bottom = ground * k
            beam(img, 64, 0, bottom, 10 + 6 * k, (255, 210, 120), 1.0)
            over(img, (255, 240, 200), blob(128, 256, 64, bottom, 12 + 8 * k, 1.5))
        else:
            p = (i - 5) / 8
            if p < 0.6:
                beam(img, 64, 0, ground, 16 * (1 - p / 0.6) + 2, (255, 200, 110), 1 - p / 0.6)
            fireball(img, 64, ground - 14, 88, p, 21)
        save(img, "orbital", i)


def gen_droppod():
    ground = 205
    for i in range(10):
        img = canvas(128, 256)
        if i < 5:
            k = (i + 1) / 5
            py = -20 + (ground + 10) * k
            px = 40 + 24 * k
            # Rastro de fogo.
            for j in range(10):
                t = j / 10
                over(img, heat(0.95 - t * 0.7), blob(128, 256, px - 24 * t * 0.5, py - 60 * t, 9 - 5 * t, 1.3) * (1 - t))
            over(img, (30, 30, 34), blob(128, 256, px, py, 9, 0.6, 0.8, 1.4))
            over(img, (255, 230, 160), blob(128, 256, px, py + 9, 6, 1.5))
        else:
            p = (i - 5) / 4
            over(img, (150, 130, 105), blob(128, 256, 64, ground, 30 + 30 * p, 1.2, 1.6, 0.6) * (1 - p * 0.7))
            over(img, (40, 38, 42), blob(128, 256, 64, ground - 6, 10, 0.5, 0.9, 1.3))
            over(img, (90, 85, 80), blob(128, 256, 64, ground - 6, 7, 0.5, 0.9, 1.3))
            if p < 0.6:
                over(img, (255, 210, 120), ring(128, 256, 64, ground, 18 + 40 * p, 4) * (1 - p / 0.6))
        save(img, "droppod", i)


def gen_fire():
    rng = np.random.RandomState(5)
    tongues = [(rng.uniform(30, 98), rng.uniform(0, 2 * math.pi), rng.uniform(14, 24), rng.uniform(30, 52)) for _ in range(9)]
    for i in range(8):
        img = canvas(128, 128)
        ph = 2 * math.pi * i / 8
        over(img, (40, 30, 26), blob(128, 128, 64, 104, 46, 1.2, 1.2, 0.45) * 0.6)
        for x0, phase, width, height in tongues:
            s = 0.75 + 0.25 * math.sin(ph * 2 + phase)
            sway = 4 * math.sin(ph + phase)
            hh = height * s
            over(img, heat(0.5), blob(128, 128, x0 + sway, 104 - hh * 0.45, width * 0.7, 1.2, 0.85, 1.0 * hh / width) * 0.9)
            over(img, heat(0.75), blob(128, 128, x0 + sway * 0.6, 104 - hh * 0.3, width * 0.5, 1.4, 0.85, 0.9 * hh / width) * 0.95)
            over(img, heat(0.95), blob(128, 128, x0, 104 - hh * 0.15, width * 0.3, 1.5, 0.9, 0.8 * hh / width))
        for j in range(6):
            t = ((i / 8) + j / 6) % 1
            ex = 40 + j * 9 + 5 * math.sin(ph + j)
            over(img, (255, 190, 80), blob(128, 128, ex, 96 - t * 90, 2.2, 1.0) * (1 - t))
        save(img, "fire", i)


def gen_smoke():
    rng = np.random.RandomState(9)
    puffs = [(rng.uniform(44, 84), rng.uniform(0, 1), rng.uniform(14, 22)) for _ in range(7)]
    for i in range(8):
        img = canvas(128, 128)
        for x0, off, size in puffs:
            t = (i / 8 + off) % 1
            over(img, (60, 56, 54), blob(128, 128, x0 + 18 * t, 112 - 100 * t, size * (0.6 + t * 0.9), 1.2) * (1 - t) * 0.7)
        save(img, "smoke", i)


def gen_ring():
    for i in range(10):
        p = i / 9
        img = canvas(128, 128)
        over(img, (255, 255, 255), ring(128, 128, 64, 64, 8 + 52 * p, 3 + 5 * p) * (1 - p) * 0.95)
        over(img, (255, 255, 255), ring(128, 128, 64, 64, 4 + 30 * p, 2 + 3 * p) * (1 - p) * 0.5)
        over(img, (255, 255, 255), blob(128, 128, 64, 64, 20 * (1 - p), 1.5) * (1 - p) * 0.6)
        save(img, "ring", i)


def gen_clash():
    rng = np.random.RandomState(13)
    bursts = [(rng.uniform(34, 94), rng.uniform(34, 94), rng.randint(0, 6)) for _ in range(5)]
    rays = [[rng.uniform(0, 2 * math.pi) for _ in range(7)] for _ in bursts]
    for i in range(10):
        img = canvas(128, 128)
        for (bx, by, start), angles in zip(bursts, rays):
            age = i - start
            if age < 0 or age > 4:
                continue
            p = age / 4
            over(img, (255, 200, 100), blob(128, 128, bx, by, 16 * (1 - p) + 4, 1.6) * (1 - p))
            for ang in angles:
                for k in range(5):
                    d = 4 + (6 + 22 * p) * (k / 4)
                    over(img, (255, 235, 160), blob(128, 128, bx + math.cos(ang) * d, by + math.sin(ang) * d, 2.2, 1.0) * (1 - p) * (1 - k / 6))
        save(img, "clash", i)


def gen_laser():
    for i in range(10):
        img = canvas(64, 256)
        pulse = 0.7 + 0.3 * math.sin(i / 10 * 2 * math.pi * 2)
        fade = 1 if i < 7 else (10 - i) / 3
        beam(img, 32, 0, 236, 12 * pulse, (140, 200, 255), fade)
        over(img, (200, 230, 255), blob(64, 256, 32, 236, 26 * pulse, 1.4, 1.0, 0.5) * fade)
        over(img, (255, 255, 255), blob(64, 256, 32, 236, 10 * pulse, 1.6) * fade)
        save(img, "laser", i)


def main():
    gen_explosion()
    gen_impact()
    gen_blood()
    gen_orbital()
    gen_droppod()
    gen_fire()
    gen_smoke()
    gen_ring()
    gen_clash()
    gen_laser()
    print("ok", len(os.listdir(OUT)), "quadros em", OUT)


if __name__ == "__main__":
    main()
