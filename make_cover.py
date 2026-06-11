#!/usr/bin/env python3
"""
LinkedScore editorial cover generator.

Layout (matches the magazine/newsletter-cover style): a topic image fills the
top ~68%, then a near-black LinkedScore-branded box below carries a gold kicker
with a rule line, the headline (with optional gold keywords) and the logo.

You supply the top image (a Higgsfield generation you've downloaded, a stock
shot, your own art, anything). This script never generates the photo, it only
composites it into the locked branded frame.

Usage (run from your repo root where logo.png lives):

  python3 make_cover.py \
      --top topic.jpg \
      --headline "The Golden Hour That Gets You Seen" \
      --kicker "LINKEDIN GROWTH" \
      --gold "golden,hour" \
      --logo logo.png \
      --out cover.png

Square 1080x1080 by default (LinkedIn-friendly). Keep headlines punchy (the box
is shallow): 4-7 words reads best.

Requires: pillow  (pip install pillow)
"""
from PIL import Image, ImageDraw, ImageFont
import glob, os, argparse

S = 2
W, H = 1080 * S, 1080 * S
BG, GOLD, GOLD_LT, TEXT = (10, 10, 15), (200, 169, 110), (232, 201, 142), (232, 232, 240)
IMG_FRAC = 0.68

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


def make_cover(top_image, headline, kicker="LINKEDIN GROWTH", out="cover.png",
               logo_path="logo.png", gold_words=None):
    gold_words = set(w.lower() for w in (gold_words or []))
    head = _pick(54 * S, [("Poppins", "Bold"), ("Montserrat", "ExtraBold"), ("Sora", "Bold"), ("Inter", "Bold")], FB_BOLD)
    kick = _pick(23 * S, [("Poppins", "SemiBold"), ("Montserrat", "SemiBold"), ("Inter", "SemiBold"), ("Poppins", "Medium")], FB_MED)

    img_h = int(IMG_FRAC * H)
    img = Image.new("RGB", (W, H), BG)

    # top image, cover-fit + center crop
    top = Image.open(top_image).convert("RGB")
    sc = max(W / top.width, img_h / top.height)
    tw, th = int(top.width * sc), int(top.height * sc)
    top = top.resize((tw, th), Image.LANCZOS)
    l, t = (tw - W) // 2, (th - img_h) // 2
    img.paste(top.crop((l, t, l + W, t + img_h)), (0, 0))

    d = ImageDraw.Draw(img, "RGBA")
    d.rectangle([0, img_h - 2 * S, W, img_h + 2 * S], fill=GOLD)  # gold seam

    pad = 64 * S
    by = img_h + 58 * S
    # kicker + rule line
    x = pad
    for ch in kicker.upper():
        d.text((x, by), ch, font=kick, fill=GOLD); x += d.textlength(ch, font=kick) + 3 * S
    ry = by + int(kick.size * 0.45)
    d.rectangle([x + 18 * S, ry - 1 * S, x + 18 * S + 150 * S, ry + 2 * S], fill=GOLD)

    # headline
    maxw = W - 2 * pad
    words = headline.split(); lines, cur = [], []
    for w in words:
        if d.textlength(" ".join(cur + [w]), font=head) <= maxw or not cur:
            cur.append(w)
        else:
            lines.append(cur); cur = [w]
    lines.append(cur)
    hy = by + 54 * S; lh = int(head.size * 1.12); sp = d.textlength(" ", font=head)
    for line in lines:
        xx = pad
        for w in line:
            col = GOLD if w.strip(",.!?").lower() in gold_words else TEXT
            d.text((xx, hy), w, font=head, fill=col); xx += d.textlength(w, font=head) + sp
        hy += lh

    # logo bottom-right of box
    if os.path.exists(logo_path):
        lg = Image.open(logo_path).convert("RGBA")
        lw = 150 * S; lh2 = int(lg.height * lw / lg.width)
        img.paste(lg.resize((lw, lh2), Image.LANCZOS), (W - pad - lw, H - pad - lh2 + 8 * S),
                  lg.resize((lw, lh2), Image.LANCZOS))

    img.save(out)
    return out


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Generate a branded LinkedScore editorial cover.")
    ap.add_argument("--top", required=True, help="path to the top topic image")
    ap.add_argument("--headline", required=True)
    ap.add_argument("--kicker", default="LINKEDIN GROWTH")
    ap.add_argument("--gold", default="", help="comma-separated words to render in gold")
    ap.add_argument("--logo", default="logo.png")
    ap.add_argument("--out", default="cover.png")
    a = ap.parse_args()
    make_cover(a.top, a.headline, a.kicker, a.out, a.logo,
               [w.strip() for w in a.gold.split(",") if w.strip()])
    print("Saved", a.out)
