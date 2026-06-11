#!/usr/bin/env python3
"""
LinkedScore banner generator — the reusable template for every blog/post banner.

Same branded background every time (near-black + champagne gold #c8a96e, logo,
golden-hour light, sun/clock rings). Only the kicker, headline and highlighted
words change per post.

Usage (run from your repo root, where logo.png lives):

  python3 make_banner.py \
      --headline "The LinkedIn Golden Hour That Gets Your Posts Seen" \
      --kicker "LINKEDIN GROWTH" \
      --gold "golden,hour" \
      --logo logo.png \
      --out golden-hour.png

Requires: pillow, numpy  (pip install pillow numpy)
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import glob, os, argparse, numpy as np, random

S = 2
W, H = 1200 * S, 630 * S
BG, GOLD, GOLD_LT, TEXT = (10, 10, 15), (200, 169, 110), (232, 201, 142), (232, 232, 240)

FB_BOLD = ["/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
           "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"]
FB_MED = ["/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"]


_FONT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts")


def _pick_font(size, prefer, fallbacks):
    # 1) bundled brand fonts (e.g. fonts/Poppins-ExtraBold.ttf) — cross-platform
    for fam, wt in prefer:
        bundled = os.path.join(_FONT_DIR, f"{fam}-{wt}.ttf")
        if os.path.exists(bundled):
            return ImageFont.truetype(bundled, size)
    # 2) Linux system fonts (original behavior)
    for fam, wt in prefer:
        for ext in ("ttf", "otf"):
            hits = [h for h in glob.glob(f"/usr/share/fonts/**/*{fam}*{wt}*.{ext}", recursive=True)
                    if not any(b in h.lower() for b in ("italic", "oblique", "condensed"))]
            if hits:
                return ImageFont.truetype(sorted(hits)[0], size)
    for fb in fallbacks:
        if os.path.exists(fb):
            return ImageFont.truetype(fb, size)
    return ImageFont.load_default()


def make_banner(headline, kicker="LINKEDIN GROWTH", out="banner.png",
                logo_path="logo.png", gold_words=None, seed=7):
    gold_words = set(w.lower() for w in (gold_words or []))
    random.seed(seed); np.random.seed(seed)

    head_font = _pick_font(66 * S, [("Poppins", "Bold"), ("Montserrat", "ExtraBold"),
                                     ("Sora", "Bold"), ("Inter", "Bold")], FB_BOLD)
    kick_font = _pick_font(20 * S, [("Poppins", "Medium"), ("Montserrat", "SemiBold"),
                                     ("Inter", "SemiBold")], FB_MED)
    url_font = _pick_font(19 * S, [("Poppins", "Medium"), ("Inter", "SemiBold")], FB_MED)

    # --- golden-hour atmosphere ---
    base = np.zeros((H, W, 3)); base[:] = BG
    yy, xx = np.mgrid[0:H, 0:W].astype(float)
    sx, sy = 1230 * S, 210 * S
    d = np.sqrt((xx - sx) ** 2 + (yy - sy) ** 2)
    glow = np.clip(1 - d / (770 * S), 0, 1) ** 2.3
    core = np.clip(1 - d / (150 * S), 0, 1) ** 2.0
    ang = np.arctan2(yy - sy, xx - sx)
    rays = (0.5 + 0.5 * np.cos(ang * 13.0)) ** 3.0
    rayglow = rays * np.clip(1 - d / (920 * S), 0, 1) ** 1.6
    light = np.clip(glow * 0.50 + core * 0.45 + rayglow * 0.15, 0, 0.92)
    glt = np.array(GOLD_LT, float)
    for c in range(3):
        base[:, :, c] += (glt[c] - base[:, :, c]) * light
    grad = np.clip(xx / (W * 0.60), 0, 1); scrim = ((1 - grad) ** 1.6) * 0.42
    for c in range(3):
        base[:, :, c] *= (1 - scrim)
    img = Image.fromarray(np.clip(base, 0, 255).astype("uint8"), "RGB")

    # --- bokeh ---
    part = Image.new("RGBA", (W, H), (0, 0, 0, 0)); pd = ImageDraw.Draw(part)
    for _ in range(34):
        px = int(np.random.uniform(0.55, 1.02) * W); py = int(np.random.uniform(0.04, 0.96) * H)
        r = int(np.random.uniform(3, 20) * S); a = int(np.random.uniform(18, 95))
        pd.ellipse([px - r, py - r, px + r, py + r], fill=(GOLD if np.random.rand() < 0.6 else GOLD_LT) + (a,))
    part = part.filter(ImageFilter.GaussianBlur(3 * S)); pd2 = ImageDraw.Draw(part)
    for _ in range(14):
        px = int(np.random.uniform(0.6, 1.0) * W); py = int(np.random.uniform(0.05, 0.95) * H)
        r = int(np.random.uniform(1.5, 4) * S); a = int(np.random.uniform(60, 140))
        pd2.ellipse([px - r, py - r, px + r, py + r], fill=GOLD_LT + (a,))
    img = Image.alpha_composite(img.convert("RGBA"), part).convert("RGB")

    # --- sun / clock rings ---
    draw = ImageDraw.Draw(img, "RGBA")
    for r, op in [(150 * S, 90), (245 * S, 60), (345 * S, 38)]:
        draw.ellipse([sx - r, sy - r, sx + r, sy + r], outline=GOLD + (op,), width=2 * S)

    # --- logo ---
    if os.path.exists(logo_path):
        logo = Image.open(logo_path).convert("RGBA")
        lw = 210 * S; lh = int(logo.height * lw / logo.width)
        lg = logo.resize((lw, lh), Image.LANCZOS); img.paste(lg, (72 * S, 68 * S), lg)
    draw = ImageDraw.Draw(img, "RGBA")

    # --- kicker (letter-spaced) ---
    draw.rectangle([72 * S, 166 * S, 120 * S, 170 * S], fill=GOLD)
    x, y = 72 * S, 184 * S
    for ch in kicker.upper():
        draw.text((x, y), ch, font=kick_font, fill=GOLD); x += draw.textlength(ch, font=kick_font) + 3 * S

    # --- headline (wrapped, gold keywords) ---
    maxw = 740 * S; words = headline.split(); lines, cur = [], []
    for w in words:
        if draw.textlength(" ".join(cur + [w]), font=head_font) <= maxw or not cur:
            cur.append(w)
        else:
            lines.append(cur); cur = [w]
    lines.append(cur)
    x0, y = 72 * S, 236 * S; lh2 = int(head_font.size * 1.14); sp = draw.textlength(" ", font=head_font)
    for line in lines:
        x = x0
        for w in line:
            col = GOLD if w.strip(",.").lower() in gold_words else TEXT
            draw.text((x, y), w, font=head_font, fill=col); x += draw.textlength(w, font=head_font) + sp
        y += lh2

    # --- url ---
    draw.text((72 * S, 560 * S), "linkedscore.app", font=url_font, fill=GOLD)

    img.save(out)
    return out


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Generate a branded LinkedScore banner.")
    ap.add_argument("--headline", required=True)
    ap.add_argument("--kicker", default="LINKEDIN GROWTH")
    ap.add_argument("--gold", default="", help="comma-separated words to render in gold")
    ap.add_argument("--logo", default="logo.png")
    ap.add_argument("--out", default="banner.png")
    a = ap.parse_args()
    gw = [w.strip() for w in a.gold.split(",") if w.strip()]
    make_banner(a.headline, a.kicker, a.out, a.logo, gw)
    print("Saved", a.out)
