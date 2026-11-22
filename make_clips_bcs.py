#!/usr/bin/env python3
"""Build living-scene animation clips from the Arabian illustrations.
Each clip matches its page narration length. Effects are layered per scene:
ken burns camera, drifting clouds, rain, ark sway, flying birds, light rays,
golden dust, sparkles, sunset glow."""
import math, os, random, subprocess, sys
from PIL import Image, ImageDraw, ImageFilter

BASE = os.path.expanduser("~/workspace/golper-demo")
IMG = os.path.join(BASE, "assets/bcs1/img")
AUD = os.path.join(BASE, "assets/bcs1/audio")
OUT = os.path.join(BASE, "assets/bcs1/video")
os.makedirs(OUT, exist_ok=True)
W, H, FPS = 1024, 682, 20

def dur(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "csv=p=0", path], capture_output=True, text=True)
    return float(r.stdout.strip())

def ease(t):  # smooth in-out
    return t * t * (3 - 2 * t)

def cloud_layer(seed):
    rnd = random.Random(seed)
    layer = Image.new("RGBA", (W * 2, 260), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for _ in range(26):
        cx, cy = rnd.randint(0, W * 2), rnd.randint(30, 200)
        rx, ry = rnd.randint(70, 190), rnd.randint(22, 52)
        a = rnd.randint(28, 60)
        d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=(255, 255, 255, a))
    return layer.filter(ImageFilter.GaussianBlur(18))

def make_clip(page, effects):
    src = Image.open(os.path.join(IMG, f"{page}.webp")).convert("RGB")
    sw, sh = src.size
    length = dur(os.path.join(AUD, f"{page}.mp3")) + 0.4
    frames = int(length * FPS)
    clouds = cloud_layer(hash(page) % 9999)
    rnd = random.Random(page)
    # particles
    dust = [(rnd.uniform(0, W), rnd.uniform(0, H), rnd.uniform(4, 14), rnd.uniform(0, 6.28)) for _ in range(36)]
    rain = [(rnd.uniform(0, W + 200), rnd.uniform(0, H), rnd.uniform(420, 700), rnd.uniform(11, 19)) for _ in range(150)]
    spark = [(rnd.uniform(40, W - 40), rnd.uniform(30, H * 0.7), rnd.uniform(0, 6.28), rnd.uniform(5, 11)) for _ in range(16)]
    birds = [(rnd.uniform(0, 0.5), rnd.uniform(40, 190), rnd.uniform(6, 11), rnd.uniform(0.7, 1.3)) for _ in range(6)]

    cmd = ["ffmpeg", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
           "-r", str(FPS), "-i", "-", "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p",
           "-crf", "23", "-preset", "veryfast", "-movflags", "+faststart",
           os.path.join(OUT, f"{page}.mp4")]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=open(f"/tmp/ff-{page}.log","wb"))

    # ken burns: zoom from 1.00 to 1.13 of frame, slight pan; p7 zooms out
    zoom_out = page == "p7"
    for f in range(frames):
        t = f / FPS
        p = ease(min(1.0, t / length))
        z = (1.13 - 0.13 * p) if zoom_out else (1.00 + 0.13 * p)
        cw, ch = int(W * 1.18 / z), int(H * 1.18 / z)
        panx = (p - 0.5) * 26 if page in ("p3", "p4") else (p - 0.5) * 12
        cx = (sw - cw) // 2 + int(panx * sw / W)
        cy = (sh - ch) // 2
        cx = max(0, min(sw - cw, cx)); cy = max(0, min(sh - ch, cy))
        frame = src.crop((cx, cy, cx + cw, cy + ch)).resize((W, H), Image.LANCZOS)

        if "sway" in effects:
            ang = 0.65 * math.sin(2 * math.pi * t / 5.2)
            frame = frame.rotate(ang, resample=Image.BICUBIC, center=(W // 2, H // 2))
            yb = int(4 * math.sin(2 * math.pi * t / 5.2 + 1.0))
            big = frame.resize((W + 16, H + 16), Image.LANCZOS)
            frame = big.crop((8, 8 + yb // 2, 8 + W, 8 + yb // 2 + H)).resize((W, H))

        ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(ov)

        if "clouds" in effects:
            off = int((t * 14) % (W + 300)) - 300
            ov.alpha_composite(clouds, (off - W // 2, -30))
            ov.alpha_composite(clouds, (off + W // 2 + 60, -60))
            d = ImageDraw.Draw(ov)
        if "rays" in effects:
            a = int(26 + 16 * math.sin(2 * math.pi * t / 7.0))
            cxr = W // 2 + int(30 * math.sin(2 * math.pi * t / 11.0))
            d.polygon([(cxr - 60, 0), (cxr + 90, 0), (cxr + 330, H), (cxr - 190, H)], fill=(255, 244, 190, a))
            d.polygon([(cxr + 130, 0), (cxr + 210, 0), (cxr + 520, H), (cxr + 330, H)], fill=(255, 244, 190, int(a * 0.6)))
        if "glow" in effects:
            a = int(14 + 10 * math.sin(2 * math.pi * t / 6.0))
            d.rectangle([0, 0, W, H], fill=(255, 176, 92, a))
        if "dust" in effects:
            for (x, y, sp, ph) in dust:
                xx = (x + t * sp) % W
                yy = y + 12 * math.sin(t * 0.7 + ph)
                d.ellipse([xx - 2, yy - 2, xx + 2, yy + 2], fill=(255, 226, 150, 120))
        if "sparkles" in effects:
            for (x, y, ph, s) in spark:
                tw = math.sin(t * 2.2 + ph)
                if tw > 0.25:
                    a = int(190 * tw)
                    d.line([x - s, y, x + s, y], fill=(255, 250, 205, a), width=2)
                    d.line([x, y - s, x, y + s], fill=(255, 250, 205, a), width=2)
        if "birds" in effects:
            for (off, y0, s, spd) in birds:
                bx = ((off + t * 0.045 * spd) % 1.25 - 0.12) * W
                by = y0 + 10 * math.sin(t * 1.7 * spd + off * 20)
                flap = math.sin(t * 9 * spd + off * 30) * s * 0.55
                col = (52, 54, 66, 205)
                d.line([bx - s, by - flap, bx, by + 2], fill=col, width=2)
                d.line([bx, by + 2, bx + s, by - flap], fill=col, width=2)
        frame = Image.alpha_composite(frame.convert("RGBA"), ov).convert("RGB")
        if "rain" in effects:
            d = ImageDraw.Draw(frame, "RGBA")
            for (x, y, spd, ln) in rain:
                yy = (y + spd * t) % (H + 40) - 20
                xx = x - yy * 0.12
                d.line([xx, yy, xx - 3, yy + ln], fill=(235, 244, 255, 130), width=2)
        proc.stdin.write(frame.tobytes())
    proc.stdin.close(); proc.wait()
    print(page, "done", round(length, 1), "s", flush=True)

SCENES = {
    "p1": ["dust", "sparkles"],
    "p2": ["clouds", "dust"],
    "p3": ["clouds", "birds"],
    "p4": ["dust", "sparkles"],
    "p5": ["glow", "birds"],
    "p6": ["sway", "clouds"],
    "p7": ["birds", "dust"],
    "p8": ["rays", "sparkles"],
}
for pg in ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"]:
    make_clip(pg, SCENES[pg])
print("ALL DONE")
