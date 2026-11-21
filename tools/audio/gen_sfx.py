"""Gera os efeitos sonoros da batalha 2D por síntese (sem direitos autorais):
audio/interface/wh40k/<nome>.ogg (mono, 44.1 kHz, Vorbis via ffmpeg).

  las_1..3       laser (lasgun, pulso)
  bolt_1..3      bolter: estalo e baque
  auto_1..2      rajada de autocanhão / metralhadora
  cannon_1..2    canhão pesado
  explosion_1..3 explosão
  artillery      assobio de obus e explosão
  bomber         passagem de bombardeiros (motores com Doppler)
  bombs          tapete de bombas
  orbital        lança orbital: carga e impacto
  drop_pod       cápsula: queda e impacto
  flamer         lança-chamas
  chainsword     espada-serra / corpo a corpo
  warp           poder psíquico / disformidade
  horn           início da batalha
  ui_card, ui_click
  panic          batalhão em pânico (apito e gritos abafados)
  warcry_<f>     grito de guerra: imperial, astartes, ork, tyranid, necron, tau,
                 eldar, mechanicus, chaos, khorne
  amb_<p>        ambiente do planeta (~20 s): hive, jungle, wind, station, lava,
                 tomb, warp
"""
import os
import subprocess
import tempfile
import wave

import numpy as np
from scipy import signal

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "audio/interface/wh40k")
SR = 44100
rng = np.random.default_rng(40000)


def t_(d):
    return np.arange(int(d * SR)) / SR


def noise(d):
    return rng.standard_normal(int(d * SR))


def lp(x, f, order=2):
    b, a = signal.butter(order, min(f / (SR / 2), 0.99), "low")
    return signal.lfilter(b, a, x)


def hp(x, f, order=2):
    b, a = signal.butter(order, f / (SR / 2), "high")
    return signal.lfilter(b, a, x)


def bp(x, f1, f2, order=2):
    b, a = signal.butter(order, [f1 / (SR / 2), min(f2 / (SR / 2), 0.99)], "band")
    return signal.lfilter(b, a, x)


def env(d, attack, decay):
    t = t_(d)
    e = np.minimum(1, t / max(attack, 1e-4)) * np.exp(-t / decay)
    return e


def sweep(f0, f1, d, curve=1.0):
    t = t_(d)
    f = f0 + (f1 - f0) * (t / d) ** curve
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def mix(*parts):
    n = max(len(p) for _, p in parts)
    out = np.zeros(n)
    for off, p in parts:
        i = int(off * SR)
        m = min(len(p), n - i) if i < n else 0
        if i + len(p) > len(out):
            out = np.concatenate([out, np.zeros(i + len(p) - len(out))])
            m = len(p)
        out[i:i + m] += p[:m]
    return out


def norm(x, peak=0.9):
    x = x - np.mean(x)
    fade = min(len(x), int(0.01 * SR))
    x[-fade:] *= np.linspace(1, 0, fade)
    return x / (np.max(np.abs(x)) + 1e-9) * peak


def soft(x, drive=2.0):
    return np.tanh(x * drive) / np.tanh(drive)


# ------------------------------------------------------------ sons
def las(v):
    d = 0.22
    f0 = 2600 + 500 * v
    tone = sweep(f0, 320, d, 0.5) * env(d, 0.002, 0.05)
    hiss = hp(noise(d), 3000) * env(d, 0.001, 0.02) * 0.4
    return norm(soft(tone + hiss, 1.5), 0.7)


def bolt(v):
    d = 0.6
    crack = hp(noise(d), 1500) * env(d, 0.0005, 0.012 + 0.004 * v)
    body = lp(noise(d), 900) * env(d, 0.002, 0.06) * 2.5
    thump = sweep(140 - 10 * v, 45, d, 0.4) * env(d, 0.002, 0.09) * 1.2
    tail = lp(noise(d), 400) * env(d, 0.05, 0.18) * 0.5
    return norm(soft(crack + body + thump + tail, 2.5), 0.85)


def auto(v):
    shots = []
    n = 6 + v * 2
    gap = 0.075 - 0.01 * v
    for i in range(n):
        d = 0.25
        s = hp(noise(d), 800) * env(d, 0.0005, 0.015) + sweep(110, 50, d) * env(d, 0.001, 0.05) * 0.8 + lp(noise(d), 1200) * env(d, 0.001, 0.04)
        shots.append((i * gap + rng.uniform(0, 0.008), s * rng.uniform(0.75, 1)))
    tail = lp(noise(n * gap + 0.4), 300) * env(n * gap + 0.4, 0.05, 0.3) * 0.6
    return norm(soft(mix(*shots, (0, tail)), 2.0), 0.8)


def cannon(v):
    d = 1.4
    blast = lp(noise(d), 600 + 200 * v, 3) * env(d, 0.002, 0.15) * 3
    boom = sweep(70, 28, d, 0.5) * env(d, 0.003, 0.35) * 2
    crack = hp(noise(d), 2000) * env(d, 0.0005, 0.01)
    rumble = lp(noise(d), 150) * env(d, 0.1, 0.5) * 1.5
    return norm(soft(blast + boom + crack + rumble, 2.5), 0.9)


def explosion(v):
    d = 2.2 + 0.3 * v
    burst = lp(noise(d), 1800, 2) * env(d, 0.003, 0.12) * 2
    body = lp(noise(d), 500 + 150 * v, 3) * env(d, 0.01, 0.4) * 3
    sub = sweep(55, 22, d, 0.3) * env(d, 0.005, 0.5) * 2.5
    debris = hp(noise(d), 2500) * env(d, 0.15, 0.35) * 0.25 * (rng.random(int(d * SR)) > 0.97)
    return norm(soft(burst + body + sub + debris, 3.0), 0.95)


def artillery():
    whistle = sweep(1500, 420, 1.1, 1.3) * np.minimum(1, t_(1.1) / 0.6) * 0.35
    return norm(mix((0, whistle), (1.05, explosion(1))), 0.95)


def bomber():
    d = 5.0
    t = t_(d)
    # Doppler: frequência cai ao passar (centro em 2.4 s).
    pos = (t - 2.4) * 3.0
    dop = 1 + 0.18 * (-pos / np.sqrt(1 + pos ** 2))
    gain = 1 / (1 + pos ** 2) ** 0.8
    phase = np.cumsum(95 * dop) / SR
    engine = sum(np.sin(2 * np.pi * phase * k) / k for k in (1, 2, 3, 5)) * 0.6
    roar = bp(noise(d), 200, 2500) * 1.2
    jet = hp(noise(d), 3000) * 0.4
    x = (engine + roar + jet) * gain
    return norm(lp(soft(x, 1.5), 6000), 0.85)


def bombs():
    parts = [(0.25 * i + rng.uniform(0, 0.08), explosion(i % 3) * rng.uniform(0.5, 1)) for i in range(7)]
    return norm(soft(mix(*parts), 1.6), 0.95)


def orbital():
    d = 1.4
    t = t_(d)
    charge = sweep(80, 900, d, 2) * (t / d) ** 2 * 0.5 + sweep(160, 1800, d, 2) * (t / d) ** 2 * 0.25
    beam_d = 0.7
    beam = (np.sin(2 * np.pi * 55 * t_(beam_d)) + hp(noise(beam_d), 1500) * 0.5) * env(beam_d, 0.005, 0.5)
    big = explosion(2) * 1.3
    return norm(soft(mix((0, charge), (1.35, beam), (1.4, big)), 2.0), 0.95)


def drop_pod():
    d = 1.3
    whoosh = bp(noise(d), 300, 3000) * np.minimum(1, t_(d) / d) ** 2
    whoosh *= sweep(1, 1, d) * 0 + 1
    impact = cannon(1)
    return norm(soft(mix((0, whoosh * 0.7), (1.25, impact)), 1.8), 0.95)


def flamer():
    d = 1.1
    t = t_(d)
    roar = bp(noise(d), 250, 2200) * (0.7 + 0.3 * np.sin(2 * np.pi * 9 * t + rng.uniform(0, 6)))
    crackle = hp(noise(d), 3000) * (rng.random(int(d * SR)) > 0.985) * 1.5
    e = np.minimum(1, t / 0.08) * np.minimum(1, (d - t) / 0.3)
    return norm(soft((roar + crackle) * e, 1.5), 0.75)


def chainsword():
    d = 0.8
    t = t_(d)
    f = 70 + 40 * np.sin(2 * np.pi * 3 * t) + 60 * (t / d)
    saw = signal.sawtooth(2 * np.pi * np.cumsum(f) / SR) * 0.6
    grind = bp(noise(d), 800, 4000) * 0.5 * (0.5 + 0.5 * np.sin(2 * np.pi * 23 * t))
    e = np.minimum(1, t / 0.03) * np.minimum(1, (d - t) / 0.15)
    clang = sum(np.sin(2 * np.pi * fr * t) * np.exp(-t / 0.15) for fr in (1250, 1870, 2930)) * 0.25
    return norm(soft((saw + grind) * e + clang, 2.0), 0.7)


def warp():
    d = 1.6
    t = t_(d)
    a = sweep(300, 1200, d, 0.7) * 0.4 + sweep(450, 90, d, 0.7) * 0.4
    shimmer = bp(noise(d), 1500, 6000) * 0.3 * (0.5 + 0.5 * np.sin(2 * np.pi * 7 * t))
    e = np.sin(np.pi * t / d) ** 1.5
    return norm(soft((a + shimmer) * e, 1.5), 0.7)


def horn():
    d = 2.2
    t = t_(d)
    tone = sum(signal.sawtooth(2 * np.pi * f * t) * w for f, w in ((73.4, 1), (110, 0.7), (146.8, 0.5)))
    tone = lp(tone, 1400)
    e = np.minimum(1, t / 0.25) * np.minimum(1, (d - t) / 0.6)
    return norm(soft(tone * e, 1.4), 0.7)


def ui_card():
    d = 0.35
    w = bp(noise(d), 600, 5000) * np.sin(np.pi * t_(d) / d) ** 2
    chime = np.sin(2 * np.pi * 880 * t_(d)) * env(d, 0.005, 0.12) * 0.25 + np.sin(2 * np.pi * 1320 * t_(d)) * env(d, 0.005, 0.1) * 0.15
    return norm(w * 0.5 + chime, 0.5)


def ui_click():
    d = 0.08
    return norm(hp(noise(d), 1500) * env(d, 0.0005, 0.01) + np.sin(2 * np.pi * 700 * t_(d)) * env(d, 0.001, 0.02), 0.45)


# ------------------------------------------------------------ v0.6: pânico, gritos de guerra e ambientes
def panic():
    d = 1.2
    t = t_(d)
    whistle = np.sin(2 * np.pi * np.cumsum(2400 + 300 * np.sin(2 * np.pi * 14 * t)) / SR) * np.minimum(1, (d - t) / 0.4) * 0.3
    crowd = bp(noise(d), 300, 1500) * (0.5 + 0.5 * np.sin(2 * np.pi * 5 * t)) * 0.6
    return norm(soft(whistle + crowd, 1.4), 0.55)


def choir(freqs, d, vib=5.0, bright=2500):
    t = t_(d)
    x = np.zeros(len(t))
    for i, f in enumerate(freqs):
        ph = np.cumsum(f * (1 + 0.006 * np.sin(2 * np.pi * (vib + 0.3 * i) * t + i))) / SR
        x += signal.sawtooth(2 * np.pi * ph) / (1 + i * 0.3)
    return lp(x, bright)


def env_ad(d, a, r):
    t = t_(d)
    return np.minimum(1, t / a) * np.minimum(1, np.maximum(0, (d - t) / r))


def drums(d, bpm, pitch=70):
    t = t_(d)
    out = np.zeros(len(t))
    step = 60 / bpm
    for k in range(int(d / step)):
        i = int(k * step * SR)
        hit = sweep(pitch * 1.6, pitch * 0.6, 0.35, 0.5) * env(0.35, 0.002, 0.12) + lp(noise(0.35), 500) * env(0.35, 0.001, 0.05)
        m = min(len(hit), len(out) - i)
        out[i:i + m] += hit[:m] * (1.0 if k % 2 == 0 else 0.7)
    return out


def warcry(kind):
    d = 2.6
    t = t_(d)
    e = env_ad(d, 0.15, 0.8)
    if kind == "imperial":      # coro solene em quinta
        x = choir([146.8, 220, 293.7, 440], d) * e
    elif kind == "astartes":    # coro grave e trompa
        x = (choir([73.4, 110, 146.8], d, bright=1800) * 1.2 + choir([220], d) * 0.4) * e + drums(d, 100, 60) * 0.5
    elif kind == "ork":         # bramido rouco e tambores rápidos
        f = 110 + 60 * np.sin(np.pi * t / d)
        x = soft(signal.sawtooth(2 * np.pi * np.cumsum(f) / SR) * 2 + bp(noise(d), 200, 1500), 3) * e + drums(d, 180, 80) * 0.8
    elif kind == "tyranid":     # guinchos do enxame
        x = sum(np.sin(2 * np.pi * np.cumsum(1800 + 900 * np.sin(2 * np.pi * (3 + k) * t + k)) / SR) * rng.uniform(0.2, 0.5) for k in range(5))
        x = (x + bp(noise(d), 2000, 6000) * 0.5) * e
    elif kind == "necron":      # zumbido metálico e pulsos
        x = (signal.square(2 * np.pi * 55 * t) * 0.3 + np.sin(2 * np.pi * 880 * t) * (np.sin(2 * np.pi * 6 * t) > 0) * 0.3 + sweep(200, 60, d) * 0.4) * e
        x = lp(x, 3000)
    elif kind == "tau":         # sintetizador limpo, acorde
        x = sum(np.sin(2 * np.pi * f * t) * w for f, w in ((261.6, 1), (392, 0.6), (523.3, 0.4))) * e + np.sin(2 * np.pi * 1046 * t) * env(d, 0.01, 0.3) * 0.3
    elif kind == "eldar":       # sinos etéreos
        x = sum(np.sin(2 * np.pi * f * t) * np.exp(-((t - o) % d) / 1.2) * (t >= o) for f, o in ((659, 0), (880, 0.3), (987.8, 0.6), (1318, 0.9))) * 0.5
        x = x + choir([329.6, 493.9], d, bright=4000) * 0.2 * e
    elif kind == "mechanicus":  # cântico binário
        bits = (np.floor(t * 12) % 3 == 0)
        x = (np.sin(2 * np.pi * 1200 * t) * bits * 0.4 + np.sin(2 * np.pi * 600 * t) * (~bits) * 0.3) * e + choir([98, 147], d, bright=900) * 0.5 * e
    elif kind == "khorne":      # rugido e tambores de guerra
        x = soft(sweep(90, 60, d) * 2 + bp(noise(d), 100, 900) * 1.5, 3) * e + drums(d, 140, 55)
    else:                       # chaos: coro dissonante
        x = choir([73.4, 77.8, 110, 155.6], d, vib=3, bright=1500) * e + bp(noise(d), 300, 2000) * 0.3 * e
    return norm(soft(x, 1.3), 0.75)


def ambient(kind):
    d = 20.0
    t = t_(d)
    fade = np.minimum(1, t / 2.5) * np.minimum(1, (d - t) / 2.5)
    if kind == "hive":       # zumbido de máquinas e sirenes distantes
        x = lp(noise(d), 300) * 0.8 + np.sin(2 * np.pi * 50 * t) * 0.2 + np.sin(2 * np.pi * np.cumsum(500 + 120 * np.sin(2 * np.pi * 0.25 * t)) / SR) * 0.05 * (np.sin(2 * np.pi * t / 10) > 0.6)
    elif kind == "jungle":   # insetos e vento nas folhas
        x = bp(noise(d), 300, 2000) * 0.3 * (0.6 + 0.4 * np.sin(2 * np.pi * 0.1 * t)) + np.sin(2 * np.pi * 4200 * t) * (np.sin(2 * np.pi * 9 * t) > 0.7) * 0.05
    elif kind == "wind":     # vento gelado
        x = bp(noise(d), 300, 1500) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.07 * t) ** 2)
    elif kind == "station":  # zumbido do casco
        x = np.sin(2 * np.pi * 60 * t) * 0.3 + np.sin(2 * np.pi * 120 * t) * 0.15 + lp(noise(d), 200) * 0.4
    elif kind == "lava":     # borbulhar e ronco
        x = lp(noise(d), 120) * 1.2 + lp(noise(d), 900) * (rng.random(len(t)) > 0.9993) * 4
    elif kind == "tomb":     # ressonância antiga
        x = (np.sin(2 * np.pi * 41 * t) + np.sin(2 * np.pi * 61.5 * t) * 0.5) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.2 * t)) * 0.5 + lp(noise(d), 150) * 0.2
    else:                    # warp: sussurros e coro distante
        x = bp(noise(d), 800, 3000) * (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * 0.6 * t))) * 0.3 + choir([55, 58.3, 82.4], d, vib=0.5, bright=600) * 0.25
    return norm(x * fade, 0.3)


SOUNDS = {
    "las_1": lambda: las(0), "las_2": lambda: las(1), "las_3": lambda: las(2),
    "bolt_1": lambda: bolt(0), "bolt_2": lambda: bolt(1), "bolt_3": lambda: bolt(2),
    "auto_1": lambda: auto(0), "auto_2": lambda: auto(1),
    "cannon_1": lambda: cannon(0), "cannon_2": lambda: cannon(1),
    "explosion_1": lambda: explosion(0), "explosion_2": lambda: explosion(1), "explosion_3": lambda: explosion(2),
    "artillery": artillery, "bomber": bomber, "bombs": bombs, "orbital": orbital, "drop_pod": drop_pod,
    "flamer": flamer, "chainsword": chainsword, "warp": warp, "horn": horn,
    "ui_card": ui_card, "ui_click": ui_click, "panic": panic,
}
for _k in ("imperial", "astartes", "ork", "tyranid", "necron", "tau", "eldar", "mechanicus", "chaos", "khorne"):
    SOUNDS["warcry_" + _k] = (lambda k: lambda: warcry(k))(_k)
for _k in ("hive", "jungle", "wind", "station", "lava", "tomb", "warp"):
    SOUNDS["amb_" + _k] = (lambda k: lambda: ambient(k))(_k)


def write_ogg(name, x):
    pcm = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        path = tmp.name
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-y", "-i", path, "-c:a", "libvorbis", "-q:a", "4",
                    os.path.join(OUT, name + ".ogg")], check=True)
    os.unlink(path)


def main():
    os.makedirs(OUT, exist_ok=True)
    for name, fn in SOUNDS.items():
        write_ogg(name, fn())
    print(len(SOUNDS), "sons em", OUT)


if __name__ == "__main__":
    main()
