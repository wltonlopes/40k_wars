"""Arte do menu principal (art/textures/ui/pregame/):

  backgrounds/wh40k_armageddon.png  fundo (tools/source/menu_background.png
                                     esticado para 2048x1024; a proporção
                                     original vai em gui/pregame/backgrounds/background.js)
  wh40k/logo.png                     logotipo "40K WARS" (512x256)
  wh40k/button*.png, panel.png,      painel e botões góticos, copiados do mod
  vignette.png                       warhr (do mesmo autor, GPL) para não depender dele

Rode de novo se trocar a imagem de fundo ou o texto do logotipo.
"""
import os
import shutil

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "art/textures/ui/pregame")
WARHR = os.path.join(ROOT, "..", "warhr", "art/textures/ui/pregame/warhr")
FONT = "/usr/share/fonts/opentype/urw-base35/C059-Bold.otf"
TEXTURES_XML = '<?xml version="1.0" encoding="utf-8"?>\n<Textures>\n  <File pattern="*" mipmap="true" alpha="transparency"/>\n</Textures>\n'


def background():
    d = os.path.join(OUT, "backgrounds")
    os.makedirs(d, exist_ok=True)
    src = Image.open(os.path.join(ROOT, "tools/source/menu_background.png")).convert("RGB")
    print("fundo original", src.size)
    src.resize((2048, 1024), Image.LANCZOS).save(os.path.join(d, "wh40k_armageddon.png"))
    with open(os.path.join(d, "textures.xml"), "w") as f:
        f.write(TEXTURES_XML)
    return src.size


def gold_text(img, xy, text, font, anchor="mm"):
    """Texto dourado com degradê, contorno escuro e brilho."""
    w, h = img.size
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).text(xy, text, font=font, fill=255, anchor=anchor)
    m = np.asarray(mask).astype(np.float32) / 255
    # contorno e sombra
    outline = np.asarray(mask.filter(ImageFilter.MaxFilter(7))).astype(np.float32) / 255
    shadow = np.asarray(mask.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(6))).astype(np.float32) / 255
    ys = np.nonzero(m.max(axis=1) > 0)[0]
    y0, y1 = (ys.min(), ys.max()) if len(ys) else (0, h)
    t = np.clip((np.arange(h) - y0) / max(1, y1 - y0), 0, 1)[:, None]
    top = np.array((255, 236, 170), np.float32)
    mid = np.array((214, 160, 60), np.float32)
    bot = np.array((120, 70, 20), np.float32)
    grad = np.where(t[..., None] < 0.5, top + (mid - top) * (t[..., None] * 2), mid + (bot - mid) * ((t[..., None] - 0.5) * 2))
    grad = np.broadcast_to(grad, (h, w, 3))
    base = np.asarray(img).astype(np.float32)
    rgb, a = base[..., :3], base[..., 3] / 255
    # sombra
    sa = shadow * 0.8
    rgb = rgb * (1 - sa[..., None]) * (a[..., None] > 0) + 0 * sa[..., None]
    a = np.maximum(a, sa)
    # contorno
    rgb = rgb * (1 - outline[..., None]) + np.array((30, 12, 8), np.float32) * outline[..., None]
    a = np.maximum(a, outline)
    # letras
    rgb = rgb * (1 - m[..., None]) + grad * m[..., None]
    out = np.dstack([np.clip(rgb, 0, 255), np.clip(a * 255, 0, 255)]).astype(np.uint8)
    img.paste(Image.fromarray(out, "RGBA"))


def logo():
    d = os.path.join(OUT, "wh40k")
    os.makedirs(d, exist_ok=True)
    img = Image.new("RGBA", (512, 256), (0, 0, 0, 0))
    gold_text(img, (256, 88), "40K WARS", ImageFont.truetype(FONT, 84))
    gold_text(img, (256, 178), "CRUZADA DE ARMAGEDDON", ImageFont.truetype(FONT, 30))
    dr = ImageDraw.Draw(img)
    for y in (146, 208):
        dr.line((60, y, 452, y), fill=(201, 160, 72, 230), width=2)
        dr.polygon([(256, y - 6), (264, y), (256, y + 6), (248, y)], fill=(201, 160, 72, 255))
    img.save(os.path.join(d, "logo.png"))


def warhr_textures():
    d = os.path.join(OUT, "wh40k")
    os.makedirs(d, exist_ok=True)
    for name in ("button.png", "button_over.png", "button_pressed.png", "button_disabled.png", "panel.png", "vignette.png"):
        src = os.path.join(WARHR, name)
        if os.path.exists(src):
            shutil.copy(src, os.path.join(d, name))
        elif not os.path.exists(os.path.join(d, name)):
            raise SystemExit("falta " + src + " (o mod warhr precisa estar ao lado só para gerar a arte)")
    # O menu do 40k Wars fica à direita: a vinheta escurece o lado direito.
    vig = os.path.join(d, "vignette.png")
    Image.open(vig).transpose(Image.FLIP_LEFT_RIGHT).save(vig)
    with open(os.path.join(d, "textures.xml"), "w") as f:
        f.write(TEXTURES_XML)


if __name__ == "__main__":
    size = background()
    warhr_textures()
    logo()
    print("ok; proporção do fundo", size[0] / size[1])
