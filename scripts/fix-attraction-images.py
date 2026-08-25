#!/usr/bin/env python3
"""Repair black web JPEGs from the attraction exhibition source images.

The source directory is read-only. Only web assets whose decoded pixels are
effectively black while the matching source image is not black are rewritten.
"""

from __future__ import annotations

import io
import json
import sys
import unicodedata
from pathlib import Path

from PIL import Image, ImageCms, ImageOps, ImageStat


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = PROJECT_ROOT / "data/exhibitions/2026-2-attraction.json"
OUTPUT_DIRECTORY = (
    PROJECT_ROOT / "public/exhibitions/2026-2-attraction/images"
)
MAX_EDGE = 2400


def normalized_stem(path: Path) -> str:
    return unicodedata.normalize("NFC", path.stem)


def mean_luminance(image: Image.Image) -> float:
    sample = image.convert("RGB").resize((1, 1), Image.Resampling.BOX)
    red, green, blue = sample.getpixel((0, 0))
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue


def convert_to_srgb(image: Image.Image) -> Image.Image:
    image = ImageOps.exif_transpose(image)
    embedded_profile = image.info.get("icc_profile")

    if embedded_profile:
        try:
            source_profile = ImageCms.ImageCmsProfile(io.BytesIO(embedded_profile))
            target_profile = ImageCms.createProfile("sRGB")
            return ImageCms.profileToProfile(
                image,
                source_profile,
                target_profile,
                outputMode="RGB",
            )
        except (ImageCms.PyCMSError, OSError, ValueError):
            pass

    return image.convert("RGB")


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit(
            "Usage: python3 scripts/fix-attraction-images.py "
            "<source exhibition directory>"
        )

    source_directory = Path(sys.argv[1]) / "사진"
    source_by_artist = {
        normalized_stem(path): path
        for path in source_directory.iterdir()
        if path.name != ".DS_Store" and path.suffix.lower() in {".jpg", ".jpeg"}
    }
    exhibition = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    repaired: list[dict[str, object]] = []
    checked = 0

    for work in exhibition["works"]:
        checked += 1
        output_path = OUTPUT_DIRECTORY / work["webAsset"]["fileName"]
        source_path = source_by_artist.get(unicodedata.normalize("NFC", work["artist"]))
        if source_path is None:
            raise FileNotFoundError(f"Source image not found for {work['artist']}")
        if not output_path.is_file() or output_path.stat().st_size == 0:
            raise FileNotFoundError(f"Web image missing or empty: {output_path}")

        with Image.open(output_path) as web_image:
            web_luminance = mean_luminance(web_image)
        with Image.open(source_path) as source_image:
            source_luminance = mean_luminance(source_image)

            if web_luminance > 1 or source_luminance <= 1:
                continue

            normalized = convert_to_srgb(source_image)
            normalized.thumbnail((MAX_EDGE, MAX_EDGE), Image.Resampling.LANCZOS)
            normalized.save(
                output_path,
                format="JPEG",
                quality=88,
                optimize=True,
                progressive=True,
                subsampling="4:2:0",
                icc_profile=ImageCms.ImageCmsProfile(
                    ImageCms.createProfile("sRGB")
                ).tobytes(),
            )

        with Image.open(output_path) as repaired_image:
            repaired_luminance = mean_luminance(repaired_image)
            width, height = repaired_image.size
        if repaired_luminance <= 1:
            raise RuntimeError(f"Repaired image is still black: {output_path}")

        work["webAsset"]["width"] = width
        work["webAsset"]["height"] = height
        work["webAsset"]["fileSizeBytes"] = output_path.stat().st_size
        repaired.append(
            {
                "artist": work["artist"],
                "title": work["title"],
                "fileName": output_path.name,
                "sourceLuminance": round(source_luminance, 2),
                "beforeLuminance": round(web_luminance, 2),
                "afterLuminance": round(repaired_luminance, 2),
                "width": width,
                "height": height,
            }
        )

    DATA_PATH.write_text(
        json.dumps(exhibition, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        json.dumps(
            {"checked": checked, "blackImagesRemaining": 0, "repaired": repaired},
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
