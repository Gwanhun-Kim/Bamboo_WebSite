from __future__ import annotations

import math
import random
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFont, ImageFilter


OUT = Path(__file__).resolve().parent / "output"
FONT = "/System/Library/Fonts/AppleSDGothicNeo.ttc"

PAPER = (248, 247, 243)
WHITE = (255, 255, 255)
INK = (23, 25, 24)
MUTED = (100, 108, 101)
LINE = (222, 222, 216)
GREEN = (15, 77, 54)
GREEN_2 = (30, 107, 76)
SOFT = (238, 243, 237)


def font(size: int, weight: str = "regular") -> ImageFont.FreeTypeFont:
    indexes = {
        "regular": 0,
        "bold": 7,
        "heavy": 8,
    }
    return ImageFont.truetype(FONT, size=size, index=indexes.get(weight, 0))


F = {
    "logo": font(28, "heavy"),
    "logo_m": font(20, "heavy"),
    "nav": font(15, "regular"),
    "nav_b": font(15, "bold"),
    "eyebrow": font(14, "bold"),
    "h1": font(56, "heavy"),
    "h1_m": font(31, "heavy"),
    "h2": font(24, "bold"),
    "h3": font(19, "bold"),
    "body": font(18, "regular"),
    "body_m": font(15, "regular"),
    "small": font(13, "regular"),
    "small_b": font(13, "bold"),
    "button": font(15, "bold"),
}


def shadow(base: Image.Image, box: tuple[int, int, int, int], radius=8, blur=22, alpha=28) -> None:
    layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    d.rounded_rectangle(box, radius=radius, fill=(15, 24, 18, alpha))
    layer = layer.filter(ImageFilter.GaussianBlur(blur))
    base.alpha_composite(layer)


def rr(draw: ImageDraw.ImageDraw, box, r=8, fill=WHITE, outline=LINE, width=1) -> None:
    draw.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=width)


def text(draw: ImageDraw.ImageDraw, xy, value: str, fnt, fill=INK, anchor=None, spacing=5) -> None:
    draw.multiline_text(xy, value, font=fnt, fill=fill, anchor=anchor, spacing=spacing)


def wrap(value: str, fnt, max_w: int) -> str:
    lines, line = [], ""
    for word in value.split(" "):
        test = word if not line else f"{line} {word}"
        if ImageDraw.Draw(Image.new("RGB", (1, 1))).textlength(test, font=fnt) <= max_w:
            line = test
        else:
            if line:
                lines.append(line)
            line = word
    if line:
        lines.append(line)
    return "\n".join(lines)


def button(draw, xy, label, primary=True, w=None):
    x, y = xy
    tw = int(draw.textlength(label, font=F["button"]))
    bw = w or tw + 34
    fill = GREEN if primary else WHITE
    outline = GREEN if primary else LINE
    rr(draw, (x, y, x + bw, y + 44), 8, fill, outline)
    text(draw, (x + bw / 2, y + 21), label, F["button"], WHITE if primary else INK, "mm")
    return bw


def nav(draw, w: int, active: str | None = None, mobile=False) -> None:
    y = 28 if not mobile else 14
    h = 56 if not mobile else 46
    x0 = 48 if not mobile else 16
    x1 = w - x0
    draw.line((x0, y + h, x1, y + h), fill=(225, 225, 219), width=1)
    text(draw, (x0, y + h / 2), "BAMBOO", F["logo_m" if mobile else "logo"], INK, "lm")
    if mobile:
        bx, by = x1 - 34, y + 6
        rr(draw, (bx, by, bx + 34, by + 34), 8, PAPER, LINE)
        draw.line((bx + 9, by + 12, bx + 25, by + 12), fill=INK, width=2)
        draw.line((bx + 9, by + 17, bx + 25, by + 17), fill=INK, width=2)
        draw.line((bx + 9, by + 22, bx + 25, by + 22), fill=INK, width=2)
        return
    tabs = ["동아리 소개", "사진전", "활동 사진", "신입부원 모집", "연락처"]
    x = x1
    for item in reversed(tabs):
        fnt = F["nav_b"] if item == active else F["nav"]
        tw = draw.textlength(item, font=fnt)
        text(draw, (x, y + h / 2), item, fnt, GREEN if item == active else (50, 56, 51), "rm")
        x -= tw + 26


def photo(size: tuple[int, int], seed: int, label: str | None = None, sub: str | None = None) -> Image.Image:
    random.seed(seed)
    w, h = size
    img = Image.new("RGB", size)
    pix = img.load()
    palettes = [
        ((20, 35, 29), (83, 108, 92), (223, 215, 198)),
        ((17, 22, 21), (63, 91, 76), (236, 229, 213)),
        ((34, 48, 43), (120, 130, 110), (205, 194, 170)),
        ((18, 25, 23), (36, 61, 52), (232, 223, 205)),
    ]
    a, b, c = palettes[seed % len(palettes)]
    for y in range(h):
        for x in range(w):
            t = (x / max(1, w - 1) * 0.55) + (y / max(1, h - 1) * 0.45)
            if t < 0.45:
                u = t / 0.45
                col = tuple(int(a[i] * (1 - u) + b[i] * u) for i in range(3))
            else:
                u = (t - 0.45) / 0.55
                col = tuple(int(b[i] * (1 - u) + c[i] * u) for i in range(3))
            noise = random.randint(-7, 7)
            pix[x, y] = tuple(max(0, min(255, v + noise)) for v in col)
    d = ImageDraw.Draw(img, "RGBA")
    for _ in range(8):
        cx = random.randint(-w // 8, w)
        cy = random.randint(0, h)
        rw = random.randint(w // 6, w // 2)
        rh = random.randint(h // 10, h // 3)
        color = (245, 239, 224, random.randint(24, 56))
        d.ellipse((cx, cy, cx + rw, cy + rh), fill=color)
    horizon = random.randint(int(h * 0.42), int(h * 0.68))
    d.polygon([(0, h), (0, horizon), (w * 0.22, horizon - 30), (w * 0.46, horizon + 18), (w, horizon - 12), (w, h)], fill=(10, 17, 15, 80))
    for i in range(5):
        x = random.randint(20, max(21, w - 50))
        y = random.randint(int(h * 0.48), int(h * 0.78))
        d.ellipse((x, y, x + 12, y + 12), fill=(22, 26, 24, 100))
        d.rounded_rectangle((x + 3, y + 12, x + 12, y + 42), radius=3, fill=(22, 26, 24, 92))
    d.rectangle((0, 0, w, h), fill=(0, 0, 0, 28))
    if label:
        d.rectangle((0, h - 92, w, h), fill=(0, 0, 0, 72))
        text(d, (18, h - 54), label, F["h3"], WHITE)
        if sub:
            text(d, (18, h - 28), sub, F["small"], (231, 235, 230))
    return img.filter(ImageFilter.UnsharpMask(radius=1.2, percent=120))


def paste_photo(base: Image.Image, box, seed, label=None, sub=None, r=8):
    x0, y0, x1, y1 = map(int, box)
    p = photo((x1 - x0, y1 - y0), seed, label, sub).convert("RGBA")
    mask = Image.new("L", p.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, p.width, p.height), radius=r, fill=255)
    base.alpha_composite(p, (x0, y0), mask)


def card(draw, box, fill=WHITE):
    rr(draw, box, 8, fill, (222, 222, 216))


def quick_cards(draw, x, y, w, items):
    gap = 13
    cw = (w - gap * (len(items) - 1)) // len(items)
    for i, (title, desc) in enumerate(items):
        bx = x + i * (cw + gap)
        card(draw, (bx, y, bx + cw, y + 100))
        text(draw, (bx + 18, y + 20), title, F["h3"])
        text(draw, (bx + 18, y + 51), wrap(desc, F["small"], cw - 36), F["small"], MUTED, spacing=4)


QUICK = [
    ("동아리 소개", "밤부가 기록하는 방식과 활동을 소개합니다."),
    ("사진전 다시보기", "온라인과 오프라인 전시 아카이브를 확인하세요."),
    ("활동 사진", "출사, MT, 소모임의 순간을 모았습니다."),
    ("신입부원 모집", "사진을 좋아하는 모든 세종인을 기다립니다."),
    ("연락처", "인스타그램, 이메일, 오픈채팅 문의"),
]

EXHIBITS = [
    ("여름의 잔상", "2026.06.18 - 06.24", "방학 전 마지막 빛과 색을 모은 온라인 사진전", 1),
    ("낯선 시선", "2025.11.03 - 11.09", "거리와 캠퍼스에서 발견한 새로운 장면들", 2),
    ("필름처럼", "2025.05.20 - 05.26", "아날로그 감성으로 기록한 봄 학기 전시", 3),
    ("밤의 대화", "2024.12.02 - 12.08", "야간 출사와 장노출 사진을 중심으로 구성", 4),
]


def base(w, h, mobile=False):
    return Image.new("RGBA", (w, h), PAPER if not mobile else (251, 250, 247, 255))


def main_desktop():
    img = base(1440, 1000)
    d = ImageDraw.Draw(img)
    nav(d, 1440)
    text(d, (48, 128), "SEJONG UNIVERSITY PHOTO CLUB", F["eyebrow"], GREEN)
    text(d, (48, 165), "세종대학교\n사진동아리 밤부", F["h1"], INK, spacing=8)
    text(d, (48, 306), "사진으로 순간을 기록하고, 함께 시선을 나누는 곳", F["body"], (77, 82, 78))
    button(d, (48, 362), "신입부원 지원하기")
    button(d, (220, 362), "Instagram 바로가기", False)
    shadow(img, (592, 104, 1392, 504))
    paste_photo(img, (592, 104, 1392, 504), 1, "2026 봄 정기 출사", "성수동 · 골목과 빛")
    quick_cards(d, 48, 548, 1344, QUICK)
    text(d, (48, 704), "최근 사진전", F["h2"])
    d.rounded_rectangle((1268, 696, 1392, 736), radius=20, fill=GREEN)
    text(d, (1330, 716), "아카이브 보기", F["small_b"], WHITE, "mm")
    x = 48
    for i, ex in enumerate(EXHIBITS[:3]):
        paste_photo(img, (x + i * 453, 754, x + i * 453 + 421, 932), ex[3], ex[0], ex[1])
    return img


def main_mobile():
    img = base(390, 844, True)
    d = ImageDraw.Draw(img)
    nav(d, 390, mobile=True)
    paste_photo(img, (16, 78, 374, 364), 1, "봄 정기 출사", "BAMBOO archive")
    text(d, (16, 390), "SEJONG PHOTO CLUB", F["eyebrow"], GREEN)
    text(d, (16, 417), "세종대학교\n사진동아리 밤부", F["h1_m"], spacing=5)
    text(d, (16, 498), "사진으로 순간을 기록하고, 함께 시선을 나누는 곳", F["body_m"], (77, 82, 78))
    button(d, (16, 532), "신입부원 지원하기", True, 358)
    y = 592
    for title, desc in QUICK:
        card(d, (16, y, 374, y + 66))
        text(d, (31, y + 15), title, F["nav_b"])
        text(d, (31, y + 40), desc, F["small"], MUTED)
        y += 76
    return img


def intro_desktop():
    img = base(1440, 1000)
    d = ImageDraw.Draw(img)
    nav(d, 1440, "동아리 소개")
    text(d, (48, 130), "ABOUT BAMBOO", F["eyebrow"], GREEN)
    text(d, (48, 166), "BAMBOO 소개", F["h1"])
    intro = "밤부는 세종대학교 사진동아리입니다. 사진을 좋아하는 사람들이 함께 촬영하고, 전시하고, 서로의 시선을 나누며 성장하는 커뮤니티입니다."
    text(d, (48, 248), wrap(intro, F["body"], 570), F["body"], (77, 82, 78), spacing=8)
    acts = [
        ("01", "정기 출사", "월 1회 서울 곳곳에서 함께 촬영합니다."),
        ("02", "사진 콘테스트", "1학기, 여름방학, 2학기, 겨울방학 연 4회 진행합니다."),
        ("03", "사진전", "온라인 전시와 오프라인 전시로 작품을 공유합니다."),
        ("04", "소모임 활동", "필름, 보정, 야경, 인물 등 다양한 관심사를 나눕니다."),
    ]
    for i, (num, title, desc) in enumerate(acts):
        bx = 48 + (i % 2) * 300
        by = 388 + (i // 2) * 154
        card(d, (bx, by, bx + 278, by + 132))
        d.rounded_rectangle((bx + 18, by + 18, bx + 50, by + 50), radius=8, fill=SOFT)
        text(d, (bx + 34, by + 34), num, F["small_b"], GREEN, "mm")
        text(d, (bx + 18, by + 66), title, F["h3"])
        text(d, (bx + 18, by + 94), wrap(desc, F["small"], 236), F["small"], MUTED, spacing=3)
    paste_photo(img, (706, 130, 1095, 570), 2, "전시 설치", "오프라인 사진전")
    paste_photo(img, (1110, 130, 1392, 344), 5, "소모임", "필름 스캔")
    paste_photo(img, (1110, 358, 1392, 570), 6, "캠퍼스 출사", "세종대학교")
    timeline = [("3월", "개강총회", "신입부원 오리엔테이션"), ("5월", "봄 정기 출사", "서울 근교 촬영"), ("9월", "가을 콘테스트", "학기별 주제 공모"), ("12월", "겨울 사진전", "연말 전시와 리뷰")]
    for i, t in enumerate(timeline):
        bx = 48 + i * 336
        card(d, (bx, 662, bx + 320, 776))
        text(d, (bx + 18, 682), t[0], F["small_b"], GREEN)
        text(d, (bx + 18, 713), t[1], F["h3"])
        text(d, (bx + 18, 744), t[2], F["small"], MUTED)
    return img


def intro_mobile():
    img = base(390, 844, True)
    d = ImageDraw.Draw(img)
    nav(d, 390, "동아리 소개", True)
    paste_photo(img, (16, 74, 374, 262), 2, "BAMBOO 활동", "촬영 · 전시 · 교류")
    text(d, (16, 292), "BAMBOO 소개", F["h1_m"])
    text(d, (16, 340), wrap("밤부는 사진을 좋아하는 세종대학교 학생들이 함께 촬영하고 전시하며 교류하는 사진동아리입니다.", F["body_m"], 350), F["body_m"], MUTED, spacing=5)
    acts = [("01", "정기 출사"), ("02", "사진 콘테스트"), ("03", "사진전"), ("04", "소모임")]
    y = 424
    for num, title in acts:
        card(d, (16, y, 374, y + 64))
        d.rounded_rectangle((30, y + 14, 62, y + 46), radius=8, fill=SOFT)
        text(d, (46, y + 30), num, F["small_b"], GREEN, "mm")
        text(d, (78, y + 30), title, F["nav_b"], INK, "lm")
        y += 74
    for i, (m, title) in enumerate([("3월", "개강총회"), ("5월", "정기 출사"), ("9월", "콘테스트"), ("12월", "사진전")]):
        bx = 16 + (i % 2) * 185
        by = 726 + (i // 2) * 58
        card(d, (bx, by, bx + 173, by + 48))
        text(d, (bx + 14, by + 11), m, F["small_b"], GREEN)
        text(d, (bx + 58, by + 24), title, F["small_b"], INK, "lm")
    return img


def chip(draw, x, y, label, active=False):
    tw = draw.textlength(label, font=F["small_b"])
    fill = GREEN if active else WHITE
    rr(draw, (x, y, x + tw + 28, y + 38), 19, fill, GREEN if active else LINE)
    text(draw, (x + (tw + 28) / 2, y + 19), label, F["small_b"], WHITE if active else INK, "mm")
    return int(tw + 38)


def exhibition_desktop():
    img = base(1440, 1000)
    d = ImageDraw.Draw(img)
    nav(d, 1440, "사진전")
    text(d, (48, 130), "EXHIBITION ARCHIVE", F["eyebrow"], GREEN)
    text(d, (48, 166), "사진전 다시보기", F["h1"])
    text(d, (48, 246), "그동안 진행한 온라인/오프라인 사진전을 다시 볼 수 있는 아카이브입니다.", F["body"], MUTED)
    x = 48
    for lab, active in [("2026", True), ("2025", False), ("2024", False), ("전체", True), ("온라인", False), ("오프라인", False)]:
        x += chip(d, x, 306, lab, active)
    rr(d, (x, 306, 1040, 344), 8, WHITE, LINE)
    text(d, (x + 14, 325), "전시명 검색", F["small"], MUTED, "lm")
    gx, gy = 48, 380
    for i, ex in enumerate(EXHIBITS):
        bx = gx + (i % 2) * 452
        by = gy + (i // 2) * 190
        card(d, (bx, by, bx + 432, by + 174))
        paste_photo(img, (bx, by, bx + 154, by + 174), ex[3])
        text(d, (bx + 172, by + 20), ex[0], F["h3"])
        text(d, (bx + 172, by + 50), ex[1], F["small"], MUTED)
        text(d, (bx + 172, by + 78), wrap(ex[2], F["small"], 230), F["small"], MUTED, spacing=3)
        d.rounded_rectangle((bx + 172, by + 126, bx + 244, by + 158), radius=8, fill=INK)
        text(d, (bx + 208, by + 142), "전시 보기", F["small_b"], WHITE, "mm")
    card(d, (1030, 380, 1392, 744))
    paste_photo(img, (1048, 398, 1374, 604), 1, "선택된 전시", "여름의 잔상")
    text(d, (1048, 632), "여름의 잔상", F["h2"])
    desc = "방학을 앞둔 캠퍼스와 도시의 온도를 기록한 전시입니다. 각자의 속도로 지나간 계절을 사진으로 다시 꺼내 봅니다."
    text(d, (1048, 672), wrap(desc, F["body_m"], 300), F["body_m"], MUTED, spacing=5)
    return img


def exhibition_mobile():
    img = base(390, 844, True)
    d = ImageDraw.Draw(img)
    nav(d, 390, "사진전", True)
    text(d, (16, 94), "사진전 다시보기", F["h1_m"])
    text(d, (16, 141), "밤부의 온라인/오프라인 사진전 아카이브", F["body_m"], MUTED)
    rr(d, (16, 174, 144, 216), 8, WHITE, LINE)
    text(d, (32, 195), "2026", F["small_b"], INK, "lm")
    x = 154
    for lab, active in [("전체", True), ("온라인", False), ("오프라인", False)]:
        x += chip(d, x, 176, lab, active)
    y = 236
    for ex in EXHIBITS[:3]:
        card(d, (16, y, 374, y + 184))
        paste_photo(img, (16, y, 374, y + 96), ex[3])
        text(d, (31, y + 112), ex[0], F["h3"])
        text(d, (31, y + 140), f"{ex[1]} · {ex[2]}", F["small"], MUTED)
        d.rounded_rectangle((302, y + 128, 360, y + 162), radius=8, fill=INK)
        text(d, (331, y + 145), "보기", F["small_b"], WHITE, "mm")
        y += 198
    return img


def gallery_desktop():
    img = base(1440, 1000)
    d = ImageDraw.Draw(img)
    nav(d, 1440, "활동 사진")
    text(d, (48, 130), "ACTIVITY GALLERY", F["eyebrow"], GREEN)
    text(d, (48, 166), "활동 사진", F["h1"])
    text(d, (48, 246), "연도와 활동별로 밤부의 기록을 둘러보세요.", F["body"], MUTED)
    card(d, (48, 306, 244, 738))
    text(d, (68, 330), "연도", F["nav_b"])
    y = 360
    for i, lab in enumerate(["2026", "2025", "2024"]):
        y += chip(d, 68, y, lab, i == 0)
    text(d, (68, y + 20), "활동", F["nav_b"])
    y += 50
    for i, lab in enumerate(["정기 출사", "MT", "개강총회", "소모임", "사진 콘테스트", "전시 준비"]):
        y += chip(d, 68, y, lab, i == 0)
    gallery = [(1, "정기 출사", "2026.05.18", 210), (2, "전시 준비", "2026.04.29", 285), (3, "소모임", "2026.04.12", 185), (4, "개강총회", "2026.03.08", 248), (5, "사진 콘테스트", "2025.12.21", 220), (6, "MT", "2025.09.14", 300)]
    cols = [276, 500, 724]
    ys = [306, 306, 306]
    for i, (seed, title, date, ph) in enumerate(gallery):
        col = i % 3
        x = cols[col]
        y = ys[col]
        paste_photo(img, (x, y, x + 200, y + ph), seed)
        text(d, (x, y + ph + 10), f"{title} · {date}", F["small"], MUTED)
        ys[col] += ph + 40
    card(d, (1032, 306, 1392, 758))
    paste_photo(img, (1048, 322, 1376, 598), 1, "선택한 사진", "정기 출사")
    text(d, (1048, 624), "성수동 정기 출사", F["h2"])
    text(d, (1048, 664), wrap("2026.05.18 · 골목의 그림자와 오후 빛을 함께 기록한 출사 사진입니다.", F["body_m"], 300), F["body_m"], MUTED, spacing=5)
    return img


def gallery_mobile():
    img = base(390, 844, True)
    d = ImageDraw.Draw(img)
    nav(d, 390, "활동 사진", True)
    text(d, (16, 94), "활동 사진", F["h1_m"])
    text(d, (16, 141), "연도와 활동별로 보는 밤부 아카이브", F["body_m"], MUTED)
    x = 16
    for lab, active in [("2026", True), ("2025", False), ("정기 출사", True), ("MT", False), ("소모임", False)]:
        x += chip(d, x, 176, lab, active)
    y0 = 232
    for i in range(6):
        x = 16 + (i % 2) * 184
        y = y0 + (i // 2) * 156
        paste_photo(img, (x, y, x + 174, y + 146), i + 1)
    shadow(img, (16, 644, 374, 828), blur=18, alpha=38)
    card(d, (16, 644, 374, 828))
    paste_photo(img, (30, 658, 360, 744), 1)
    text(d, (30, 764), "성수동 정기 출사", F["h3"])
    text(d, (30, 794), "2026.05.18 · 오후의 골목과 창가 빛을 기록했습니다.", F["small"], MUTED)
    return img


def recruit_desktop():
    img = base(1440, 1000)
    d = ImageDraw.Draw(img)
    nav(d, 1440, "신입부원 모집")
    text(d, (48, 130), "RECRUIT 2026", F["eyebrow"], GREEN)
    text(d, (48, 166), "2026 밤부\n신입부원 모집", F["h1"], spacing=8)
    text(d, (48, 306), wrap("사진을 좋아하는 세종대학교 학생이라면 누구나 밤부의 다음 기록에 함께할 수 있습니다.", F["body"], 620), F["body"], MUTED, spacing=6)
    button(d, (48, 368), "지원하기")
    button(d, (142, 368), "문의하기", False)
    blocks = [
        ("모집 대상", "사진을 좋아하거나 새롭게 시작하고 싶은 세종대학교 재학생"),
        ("활동 내용", "정기 출사, 사진 콘테스트, 사진전, 보정 스터디와 소모임"),
        ("모집 일정", "2026.03.02 - 03.15 서류 접수 후 개별 안내"),
        ("지원 방법", "지원 폼 작성 후 운영진 확인 메시지를 받으면 완료"),
        ("회비/준비물", "학기 회비 별도 공지, 카메라가 없어도 스마트폰으로 참여 가능"),
        ("FAQ", "초보자도 환영하며 장비보다 꾸준히 찍고 나누는 태도를 봅니다."),
    ]
    for i, b in enumerate(blocks):
        bx = 48 + (i % 2) * 328
        by = 454 + (i // 2) * 126
        card(d, (bx, by, bx + 306, by + 108))
        text(d, (bx + 18, by + 18), b[0], F["h3"])
        text(d, (bx + 18, by + 50), wrap(b[1], F["small"], 260), F["small"], MUTED, spacing=4)
    paste_photo(img, (950, 130, 1392, 722), 8, "BAMBOO 신입 모집", "카메라를 들고 함께 걷는 사람들")
    return img


def recruit_mobile():
    img = base(390, 844, True)
    d = ImageDraw.Draw(img)
    nav(d, 390, "신입부원 모집", True)
    paste_photo(img, (16, 74, 374, 242), 8, "2026 RECRUIT", "BAMBOO")
    text(d, (16, 270), "RECRUIT 2026", F["eyebrow"], GREEN)
    text(d, (16, 296), "2026 밤부\n신입부원 모집", F["h1_m"], spacing=5)
    button(d, (16, 378), "지원하기", True, 358)
    y = 446
    rows = [
        ("모집 대상", "사진을 좋아하는 세종대학교 재학생이라면 장비 유무와 경험에 상관없이 지원할 수 있습니다."),
        ("일정", "3월 2일부터 15일까지 지원 폼을 받고, 이후 운영진이 개별 안내합니다."),
        ("지원 방법", "온라인 지원 폼 작성 후 오픈채팅 또는 인스타그램 DM으로 문의할 수 있습니다."),
        ("FAQ", "초보자도 환영합니다. 스마트폰 촬영으로도 활동에 참여할 수 있습니다."),
    ]
    for i, (title, desc) in enumerate(rows):
        h = 96 if i == 0 else 58
        card(d, (16, y, 374, y + h))
        text(d, (31, y + 20), title, F["nav_b"])
        text(d, (350, y + 27), "+" if i else "−", F["h3"], GREEN, "mm")
        if i == 0:
            text(d, (31, y + 48), wrap(desc, F["small"], 310), F["small"], MUTED, spacing=4)
        y += h + 10
    d.rectangle((0, 770, 390, 844), fill=(251, 250, 247))
    d.line((0, 770, 390, 770), fill=LINE)
    button(d, (16, 786), "지원하기", True, 174)
    button(d, (200, 786), "문의하기", False, 174)
    return img


def contact_desktop():
    img = base(1440, 1000)
    d = ImageDraw.Draw(img)
    nav(d, 1440, "연락처")
    text(d, (48, 130), "CONTACT", F["eyebrow"], GREEN)
    text(d, (48, 166), "문의하기", F["h1"])
    text(d, (48, 246), "세종대학교 사진동아리 밤부에 궁금한 점이 있다면 편한 채널로 연락해 주세요.", F["body"], MUTED)
    channels = [
        ("01", "Instagram", "@sejong_bamboo", "전시 소식과 모집 공지를 가장 빠르게 확인할 수 있습니다."),
        ("02", "이메일", "bamboo.photo@sejong.ac.kr", "공식 문의와 제휴 제안은 이메일로 보내주세요."),
        ("03", "오픈채팅", "밤부 문의방", "지원, 활동, 장비 관련 질문을 남길 수 있습니다."),
        ("04", "운영진 문의", "회장 김관훈 외 운영진", "학기 중 활동과 일정 문의를 안내합니다."),
    ]
    for i, c in enumerate(channels):
        bx = 48 + (i % 2) * 330
        by = 326 + (i // 2) * 188
        card(d, (bx, by, bx + 306, by + 168))
        d.rounded_rectangle((bx + 22, by + 22, bx + 54, by + 54), radius=8, fill=SOFT)
        text(d, (bx + 38, by + 38), c[0], F["small_b"], GREEN, "mm")
        text(d, (bx + 22, by + 72), c[1], F["h3"])
        text(d, (bx + 22, by + 104), c[2], F["small_b"], INK)
        text(d, (bx + 22, by + 130), wrap(c[3], F["small"], 250), F["small"], MUTED)
    card(d, (760, 326, 1392, 704))
    d.rounded_rectangle((778, 344, 1374, 542), radius=8, fill=(225, 232, 222), outline=None)
    for x in range(798, 1374, 42):
        d.line((x, 344, x, 542), fill=(184, 204, 190))
    for y in range(364, 542, 42):
        d.line((778, y, 1374, y), fill=(184, 204, 190))
    d.rounded_rectangle((1030, 420, 1134, 460), radius=8, fill=GREEN)
    text(d, (1082, 440), "세종대학교", F["small_b"], WHITE, "mm")
    text(d, (778, 570), "동아리방 안내", F["h2"])
    text(d, (778, 610), "세종대학교 학생회관 인근에서 정기 모임과 전시 준비를 진행합니다.", F["body_m"], MUTED)
    button(d, (778, 650), "Instagram 바로가기")
    button(d, (952, 650), "메일 보내기", False)
    button(d, (1070, 650), "오픈채팅 문의", False)
    return img


def contact_mobile():
    img = base(390, 844, True)
    d = ImageDraw.Draw(img)
    nav(d, 390, "연락처", True)
    text(d, (16, 94), "CONTACT", F["eyebrow"], GREEN)
    text(d, (16, 120), "문의하기", F["h1_m"])
    text(d, (16, 168), "밤부 운영진에게 편한 방식으로 연락해 주세요.", F["body_m"], MUTED)
    channels = [
        ("IG", "인스타그램", "@sejong_bamboo", "전시와 모집 공지를 확인하세요."),
        ("@", "이메일", "bamboo.photo@sejong.ac.kr", "공식 문의를 보낼 수 있습니다."),
        ("톡", "오픈채팅", "밤부 문의방", "지원 관련 질문을 남겨 주세요."),
        ("위", "위치 정보", "세종대학교 학생회관 인근", "정기 모임과 전시 준비 공간"),
    ]
    y = 220
    for icon, title, main, desc in channels:
        card(d, (16, y, 374, y + 116))
        d.rounded_rectangle((31, y + 18, 63, y + 50), radius=8, fill=SOFT)
        text(d, (47, y + 34), icon, F["small_b"], GREEN, "mm")
        text(d, (78, y + 20), title, F["h3"])
        text(d, (78, y + 50), main, F["small_b"], INK)
        text(d, (78, y + 73), desc, F["small"], MUTED)
        button(d, (284, y + 66), "바로가기", False, 76)
        y += 128
    card(d, (16, 746, 374, 820))
    text(d, (31, 764), "운영진 안내", F["small_b"], INK)
    text(d, (31, 790), "회장 김관훈 및 운영진이 활동, 모집, 전시 문의를 확인합니다.", F["small"], MUTED)
    return img


SCREENS = [
    ("01-main-desktop.png", main_desktop),
    ("02-main-mobile.png", main_mobile),
    ("03-intro-desktop.png", intro_desktop),
    ("04-intro-mobile.png", intro_mobile),
    ("05-exhibition-desktop.png", exhibition_desktop),
    ("06-exhibition-mobile.png", exhibition_mobile),
    ("07-gallery-desktop.png", gallery_desktop),
    ("08-gallery-mobile.png", gallery_mobile),
    ("09-recruit-desktop.png", recruit_desktop),
    ("10-recruit-mobile.png", recruit_mobile),
    ("11-contact-desktop.png", contact_desktop),
    ("12-contact-mobile.png", contact_mobile),
]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, fn in SCREENS:
        img = fn().convert("RGB")
        img.save(OUT / name, quality=96)
        print(f"saved {OUT / name}")


if __name__ == "__main__":
    main()
