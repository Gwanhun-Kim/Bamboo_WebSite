#!/usr/bin/env python3
"""Create responsive gallery and display images for all published exhibitions.

Source files are read only. Existing public originals remain untouched; optimized
display copies and WebP thumbnails are written into sibling subdirectories.
Re-running the script skips outputs that are newer than their source.
"""

from __future__ import annotations

import io
import json
from pathlib import Path

from PIL import Image, ImageCms, ImageOps, ImageStat


PROJECT_ROOT = Path(__file__).resolve().parents[1]
PUBLIC_ROOT = PROJECT_ROOT / "public"
PROCESSING_VERSION = "exhibition-images-v1"
DETAIL_MAX_EDGE = 2400
DETAIL_QUALITY = 88
THUMBNAIL_WIDTHS = (480, 800)
THUMBNAIL_QUALITY = 80
GALLERY_SIZES = (
    "(max-width: 760px) calc((100vw - 56px) / 2), "
    "(max-width: 1080px) calc((100vw - 96px) / 3), "
    "calc((100vw - 176px) / 4)"
)

EXHIBITIONS = (
    {
        "id": "2025-2-first",
        "data": "data/exhibitions/2025-2-offline-exhibition-first.json",
        "create_detail": True,
    },
    {
        "id": "2025-2-familiar-happiness",
        "data": "data/exhibitions/2025-2-familiar-happiness.json",
        "create_detail": True,
    },
    {
        "id": "2026-2-attraction",
        "data": "data/exhibitions/2026-2-attraction.json",
        "create_detail": False,
    },
)


def public_path(public_url: str) -> Path:
    return PUBLIC_ROOT / public_url.lstrip("/")


def resolve_source(work: dict) -> Path:
    image_files = work.get("source", {}).get("imageFiles", [])
    raw_path = image_files[0].get("rawImageFile") if image_files else None
    candidates = (
        raw_path,
        work.get("matchedRawFile"),
        work.get("webAsset", {}).get("originalPublicUrl"),
        work.get("webAsset", {}).get("publicUrl"),
    )
    for candidate in candidates:
        if not candidate:
            continue
        path = (
            public_path(candidate)
            if str(candidate).startswith("/")
            else PROJECT_ROOT / candidate
        )
        if path.is_file():
            return path
    raise FileNotFoundError(f"No usable image source for {work.get('id')}")


def convert_to_srgb(source_path: Path) -> Image.Image:
    with Image.open(source_path) as opened:
        embedded_profile = opened.info.get("icc_profile")
        image = ImageOps.exif_transpose(opened)
        if embedded_profile:
            try:
                source_profile = ImageCms.ImageCmsProfile(io.BytesIO(embedded_profile))
                target_profile = ImageCms.createProfile("sRGB")
                image = ImageCms.profileToProfile(
                    image,
                    source_profile,
                    target_profile,
                    outputMode="RGB",
                )
            except (ImageCms.PyCMSError, OSError, ValueError):
                image = image.convert("RGB")
        elif image.mode == "RGBA":
            background = Image.new("RGB", image.size, "white")
            background.paste(image, mask=image.getchannel("A"))
            image = background
        else:
            image = image.convert("RGB")
        return image.copy()


def resized_to_max_edge(image: Image.Image, max_edge: int) -> Image.Image:
    if max(image.size) <= max_edge:
        return image.copy()
    scale = max_edge / max(image.size)
    size = tuple(max(1, round(dimension * scale)) for dimension in image.size)
    return image.resize(size, Image.Resampling.LANCZOS)


def resized_to_width(image: Image.Image, target_width: int) -> Image.Image:
    width = min(target_width, image.width)
    height = max(1, round(image.height * width / image.width))
    if (width, height) == image.size:
        return image.copy()
    return image.resize((width, height), Image.Resampling.LANCZOS)


def is_current(output_path: Path, source_path: Path) -> bool:
    return (
        output_path.is_file()
        and output_path.stat().st_size > 0
        and output_path.stat().st_mtime >= source_path.stat().st_mtime
    )


def decoded_metadata(path: Path) -> dict:
    with Image.open(path) as image:
        image.load()
        displayed = ImageOps.exif_transpose(image)
        width, height = displayed.size
        sample = displayed.convert("RGB").resize((32, 32), Image.Resampling.BOX)
        extrema = ImageStat.Stat(sample).extrema
        if all(low == high == 0 for low, high in extrema):
            raise RuntimeError(f"Generated image is solid black: {path}")
    return {
        "width": width,
        "height": height,
        "fileSizeBytes": path.stat().st_size,
    }


def save_detail(image: Image.Image, output_path: Path) -> dict:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    resized = resized_to_max_edge(image, DETAIL_MAX_EDGE)
    srgb_profile = ImageCms.ImageCmsProfile(ImageCms.createProfile("sRGB")).tobytes()
    resized.save(
        output_path,
        format="JPEG",
        quality=DETAIL_QUALITY,
        optimize=True,
        progressive=True,
        subsampling="4:2:0",
        icc_profile=srgb_profile,
    )
    return decoded_metadata(output_path)


def save_thumbnail(image: Image.Image, output_path: Path, width: int) -> dict:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    resized = resized_to_width(image, width)
    srgb_profile = ImageCms.ImageCmsProfile(ImageCms.createProfile("sRGB")).tobytes()
    resized.save(
        output_path,
        format="WEBP",
        quality=THUMBNAIL_QUALITY,
        method=6,
        icc_profile=srgb_profile,
    )
    return decoded_metadata(output_path)


def variant_url(exhibition_id: str, file_name: str, width: int) -> str:
    stem = Path(file_name).stem
    return f"/exhibitions/{exhibition_id}/images/thumbnails/{stem}-{width}.webp"


def process_exhibition(config: dict) -> dict:
    data_path = PROJECT_ROOT / config["data"]
    exhibition = json.loads(data_path.read_text(encoding="utf-8"))
    generated = 0
    skipped = 0
    source_bytes = 0
    detail_bytes = 0
    thumbnail_bytes = 0

    for work in exhibition["works"]:
        web_asset = work.setdefault("webAsset", {})
        if "originalPublicUrl" not in web_asset:
            web_asset["originalPublicUrl"] = web_asset["publicUrl"]
        source_path = resolve_source(work)
        source_bytes += source_path.stat().st_size
        image = None

        if config["create_detail"]:
            detail_url = (
                f"/exhibitions/{config['id']}/images/display/{web_asset['fileName']}"
            )
            detail_path = public_path(detail_url)
            if not is_current(detail_path, source_path):
                image = convert_to_srgb(source_path)
                detail_meta = save_detail(image, detail_path)
                generated += 1
            else:
                detail_meta = decoded_metadata(detail_path)
                skipped += 1
            web_asset.update(
                {
                    "publicUrl": detail_url,
                    "path": str(detail_path.relative_to(PROJECT_ROOT)),
                    "width": detail_meta["width"],
                    "height": detail_meta["height"],
                    "fileSizeBytes": detail_meta["fileSizeBytes"],
                }
            )
        else:
            detail_path = public_path(web_asset["publicUrl"])
            detail_meta = decoded_metadata(detail_path)
            web_asset.update(detail_meta)

        detail_bytes += detail_meta["fileSizeBytes"]
        variants = []
        for width in THUMBNAIL_WIDTHS:
            thumbnail_url = variant_url(config["id"], web_asset["fileName"], width)
            thumbnail_path = public_path(thumbnail_url)
            if not is_current(thumbnail_path, source_path):
                image = image or convert_to_srgb(source_path)
                thumbnail_meta = save_thumbnail(image, thumbnail_path, width)
                generated += 1
            else:
                thumbnail_meta = decoded_metadata(thumbnail_path)
                skipped += 1
            variants.append(
                {
                    "publicUrl": thumbnail_url,
                    "width": thumbnail_meta["width"],
                    "height": thumbnail_meta["height"],
                    "fileSizeBytes": thumbnail_meta["fileSizeBytes"],
                }
            )
            thumbnail_bytes += thumbnail_meta["fileSizeBytes"]

        # Do not emit duplicate width descriptors when a very small source is used.
        unique_variants = {variant["width"]: variant for variant in variants}
        variants = [unique_variants[width] for width in sorted(unique_variants)]
        largest = variants[-1]
        web_asset["thumbnail"] = {
            "publicUrl": largest["publicUrl"],
            "width": largest["width"],
            "height": largest["height"],
            "fileSizeBytes": largest["fileSizeBytes"],
            "srcSet": variants,
            "sizes": GALLERY_SIZES,
        }
        web_asset["optimizationVersion"] = PROCESSING_VERSION

    data_path.write_text(
        json.dumps(exhibition, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return {
        "id": config["id"],
        "works": len(exhibition["works"]),
        "generatedFiles": generated,
        "skippedFiles": skipped,
        "sourceBytes": source_bytes,
        "detailBytes": detail_bytes,
        "thumbnailBytesAllVariants": thumbnail_bytes,
    }


def main() -> None:
    reports = [process_exhibition(config) for config in EXHIBITIONS]
    print(json.dumps(reports, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
