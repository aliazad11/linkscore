#!/usr/bin/env python3
"""Blog-banner compositor matching the SHIPPED blog design line (golden-hour /
headline-formula): full-bleed cinematic image, bottom ~30% semi-transparent
near-black band over the continuing scene, gold letter-spaced kicker + long gold
rule, Poppins ExtraBold headline in white with gold key words. NO logo.

Usage:
  python3 make_blog_banner.py --top topic.png \
    --headline "What Is a Good LinkedIn SSI Score?" \
    --kicker "LINKEDIN SCORES" --gold "SSI,Score?" --out banner.jpg
"""
import argparse
from PIL import Image, ImageDraw, ImageFont

W, H = 1376, 768
BAND_TOP = int(H * 0.63)        # band covers the bottom ~37%, like the shipped covers
BAND_ALPHA = 165                # ~65% near-black over the continuing scene
INK = (249, 250, 251)
GOLD = (200, 169, 110)

def font(path_candidates, size):
    for p in path_candidates:
        try:
            return ImageFont.truetype(p, size)
        except Exception:
            continue
    return ImageFont.load_default()

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--top", required=True)
    ap.add_argument("--headline", required=True)
    ap.add_argument("--kicker", default="LINKEDIN GROWTH")
    ap.add_argument("--gold", default="", help="comma-separated words rendered in gold (punctuation ignored)")
    ap.add_argument("--out", default="blog-banner.jpg")
    a = ap.parse_args()

    gold_words = {w.strip().lower().strip("?.,!") for w in a.gold.split(",") if w.strip()}

    # full-bleed topic image, cover-cropped
    im = Image.open(a.top).convert("RGB")
    sc = max(W / im.width, H / im.height)
    im = im.resize((round(im.width * sc), round(im.height * sc)), Image.LANCZOS)
    x0 = (im.width - W) // 2
    y0 = (im.height - H) // 2
    img = im.crop((x0, y0, x0 + W, y0 + H))

    # bottom band: translucent near-black over the continuing scene
    band = Image.new("RGBA", (W, H - BAND_TOP), (10, 10, 15, BAND_ALPHA))
    img = img.convert("RGBA")
    img.alpha_composite(band, (0, BAND_TOP))
    d = ImageDraw.Draw(img)

    kicker_f = font(["public/fonts/Poppins-SemiBold.ttf", "public/fonts/Poppins-ExtraBold.ttf"], 25)
    head_f = font(["public/fonts/Poppins-ExtraBold.ttf"], 56)

    margin = 78
    ky = BAND_TOP + 44
    # letter-spaced kicker
    kx = margin
    for ch in a.kicker.upper():
        d.text((kx, ky), ch, font=kicker_f, fill=GOLD)
        kx += d.textlength(ch, font=kicker_f) + 7
    # long gold rule after the kicker
    rule_y = ky + 16
    d.rectangle([kx + 24, rule_y, W - margin, rule_y + 3], fill=GOLD)

    # headline: wrap to width, white with gold key words
    words = a.headline.split()
    space_w = d.textlength(" ", font=head_f)
    max_w = W - 2 * margin
    lines, cur, cur_w = [], [], 0
    for w in words:
        ww = d.textlength(w, font=head_f)
        if cur and cur_w + space_w + ww > max_w:
            lines.append(cur); cur, cur_w = [w], ww
        else:
            cur_w += (space_w if cur else 0) + ww; cur.append(w)
    if cur: lines.append(cur)

    y = ky + 58
    lh = int(head_f.size * 1.18)
    for line in lines:
        x = margin
        for w in line:
            color = GOLD if w.lower().strip("?.,!") in gold_words else INK
            d.text((x, y), w, font=head_f, fill=color)
            x += d.textlength(w, font=head_f) + space_w
        y += lh

    img.convert("RGB").save(a.out, "JPEG", quality=85)
    print("Saved", a.out)

if __name__ == "__main__":
    main()
