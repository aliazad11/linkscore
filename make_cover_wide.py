#!/usr/bin/env python3
"""
LinkedScore editorial cover — 16:9 landscape (1920x1080).

Left: dark LinkedScore-branded panel (logo, gold kicker + rule, headline).
Right: your topic image, feathered into the panel.

You supply --top (a Higgsfield download, a stock shot, or your own image). This
script only composites; it never generates the photo.

Usage (run from your repo root where logo.png lives):

  python3 make_cover_wide.py \
      --top topic.jpg \
      --headline "The Golden Hour That Gets You Seen" \
      --kicker "LINKEDIN GROWTH" \
      --gold "golden,hour" \
      --logo logo.png \
      --out cover_16x9.png

Requires: pillow, numpy
"""
from PIL import Image, ImageDraw, ImageFont
import glob, os, argparse, numpy as np

W, H = 1920, 1080
BG, GOLD, GOLD_LT, TEXT = (10, 10, 15), (200, 169, 110), (232, 201, 142), (232, 232, 240)
PANEL = 820          # topic image region starts here
FEATHER = 240        # image left edge fades into the panel over this many px

FB_BOLD = ["/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
           "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"]
FB_MED = ["/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"]


_FONT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts")


def _pick(size, prefer, fb):
    # 1) bundled brand fonts (e.g. fonts/Poppins-ExtraBold.ttf) — cross-platform
    for fam, wt in prefer:
        bundled = os.path.join(_FONT_DIR, f"{fam}-{wt}.ttf")
        if os.path.exists(bundled):
            return ImageFont.truetype(bundled, size)
    # 2) Linux system fonts (original behavior)
    for fam, wt in prefer:
        for ext in ("ttf", "otf"):
            h = [x for x in glob.glob(f"/usr/share/fonts/**/*{fam}*{wt}*.{ext}", recursive=True)
                 if not any(b in x.lower() for b in ("italic", "oblique", "condensed"))]
            if h:
                return ImageFont.truetype(sorted(h)[0], size)
    for f in fb:
        if os.path.exists(f):
            return ImageFont.truetype(f, size)
    return ImageFont.load_default()


def make_cover_wide(top_image, headline, kicker="LINKEDIN GROWTH", out="cover_16x9.png",
                    logo_path="logo.png", gold_words=None):
    gw = set(w.lower() for w in (gold_words or []))
    head = _pick(62, [("Poppins", "Bold"), ("Montserrat", "ExtraBold"), ("Sora", "Bold"), ("Inter", "Bold")], FB_BOLD)
    kick = _pick(22, [("Poppins", "SemiBold"), ("Montserrat", "SemiBold"), ("Inter", "SemiBold"), ("Poppins", "Medium")], FB_MED)
    url_f = _pick(20, [("Poppins", "Medium"), ("Inter", "SemiBold")], FB_MED)

    img = Image.new("RGB", (W, H), BG)

    # topic image on the right, feathered into the dark panel
    region_w = W - PANEL
    top = Image.open(top_image).convert("RGB")
    sc = max(region_w / top.width, H / top.height)
    tw, th = int(top.width * sc), int(top.height * sc)
    top = top.resize((tw, th), Image.LANCZOS)
    l, t = (tw - region_w) // 2, (th - H) // 2
    top = top.crop((l, t, l + region_w, t + H))
    xs = np.arange(region_w)
    m = (np.clip(xs / FEATHER, 0, 1) * 255).astype("uint8")
    mask = Image.fromarray(np.repeat(m[None, :], H, axis=0), "L")
    img.paste(top, (PANEL, 0), mask)

    d = ImageDraw.Draw(img, "RGBA")
    d.rectangle([PANEL + FEATHER - 2, 0, PANEL + FEATHER + 1, H], fill=GOLD + (70,))  # faint gold seam

    pad = 78
    if os.path.exists(logo_path):
        lg = Image.open(logo_path).convert("RGBA")
        lw = 210; lh = int(lg.height * lw / lg.width)
        lg = lg.resize((lw, lh), Image.LANCZOS); img.paste(lg, (pad, 70), lg)
    d = ImageDraw.Draw(img, "RGBA")

    d.rectangle([pad, 175, pad + 50, 179], fill=GOLD)
    x = pad
    for ch in kicker.upper():
        d.text((x, 195), ch, font=kick, fill=GOLD); x += d.textlength(ch, font=kick) + 3

    maxw = 730
    words = headline.split(); lines, cur = [], []
    for w in words:
        if d.textlength(" ".join(cur + [w]), font=head) <= maxw or not cur:
            cur.append(w)
        else:
            lines.append(cur); cur = [w]
    lines.append(cur)
    hy = 255; lh = int(head.size * 1.14); sp = d.textlength(" ", font=head)
    for line in lines:
        xx = pad
        for w in line:
            col = GOLD if w.strip(",.!?").lower() in gw else TEXT
            d.text((xx, hy), w, font=head, fill=col); xx += d.textlength(w, font=head) + sp
        hy += lh

    d.text((pad, H - 78), "linkedscore.app", font=url_f, fill=GOLD)
    img.save(out)
    return out


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Generate a 16:9 branded LinkedScore editorial cover.")
    ap.add_argument("--top", required=True, help="path to the topic image")
    ap.add_argument("--headline", required=True)
    ap.add_argument("--kicker", default="LINKEDIN GROWTH")
    ap.add_argument("--gold", default="", help="comma-separated words to render in gold")
    ap.add_argument("--logo", default="logo.png")
    ap.add_argument("--out", default="cover_16x9.png")
    a = ap.parse_args()
    make_cover_wide(a.top, a.headline, a.kicker, a.out, a.logo,
                    [w.strip() for w in a.gold.split(",") if w.strip()])
    print("Saved", a.out)
