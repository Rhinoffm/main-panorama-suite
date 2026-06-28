#!/usr/bin/env python3
"""Convert all site images to AVIF (from WebP or standalone HTML source)."""

import argparse
import base64
import io
import os
import re
from pathlib import Path
from typing import Optional

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent

IMAGE_CONFIG = [
    ("images/hero.avif", 1600, {"fetchpriority": "high"}, 55),
    ("images/thumbs/essen.avif", 400, {"loading": "lazy"}, 58),
    ("images/thumbs/schlafzimmer.avif", 400, {"loading": "lazy"}, 58),
    ("images/thumbs/bad.avif", 400, {"loading": "lazy"}, 58),
    ("images/thumbs/kueche.avif", 400, {"loading": "lazy"}, 58),
    ("images/about.avif", 800, {"loading": "lazy"}, 58),
    ("images/cards/wohnen.avif", 800, {"loading": "lazy"}, 58),
    ("images/cards/kueche.avif", 800, {"loading": "lazy"}, 58),
    ("images/cards/bad.avif", 800, {"loading": "lazy"}, 58),
    ("images/cards/schlaf.avif", 800, {"loading": "lazy"}, 58),
    ("images/stimmung/1.avif", 800, {"loading": "lazy"}, 58),
    ("images/stimmung/2.avif", 800, {"loading": "lazy"}, 58),
    ("images/stimmung/3.avif", 800, {"loading": "lazy"}, 58),
    ("images/gebaeude.avif", 600, {"loading": "lazy"}, 58),
    ("images/ausflug/1.avif", 800, {"loading": "lazy"}, 55),
    ("images/ausflug/2.avif", 800, {"loading": "lazy"}, 58),
    ("images/ausflug/3.avif", 800, {"loading": "lazy"}, 58),
    ("images/ausflug/4.avif", 800, {"loading": "lazy"}, 58),
]

LB_IMAGES = [
    "images/hero.avif",
    "images/thumbs/essen.avif",
    "images/thumbs/schlafzimmer.avif",
    "images/thumbs/bad.avif",
    "images/thumbs/kueche.avif",
    "images/about.avif",
    "images/cards/wohnen.avif",
    "images/cards/kueche.avif",
    "images/cards/bad.avif",
    "images/cards/schlaf.avif",
]


def resize_image(img: Image.Image, max_width: int) -> Image.Image:
    if img.width > max_width:
        ratio = max_width / img.width
        new_height = int(img.height * ratio)
        return img.resize((max_width, new_height), Image.Resampling.LANCZOS)
    return img


def save_avif(img: Image.Image, path: Path, quality: int = 58) -> tuple[int, int]:
    path.parent.mkdir(parents=True, exist_ok=True)
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
    img.save(path, "AVIF", quality=quality)
    return img.width, img.height


def build_img_tag(path: str, width: int, height: int, attrs: dict, alt: str = "") -> str:
    parts = [
        f'src="{path}"',
        f'width="{width}"',
        f'height="{height}"',
        "decoding=\"async\"",
    ]
    if alt:
        parts.append(f'alt="{alt}"')
    for key, val in attrs.items():
        parts.append(f'{key}="{val}"')
    return "<img " + " ".join(parts) + ">"


def convert_webp_to_avif() -> None:
    """Convert existing WebP assets to AVIF using matching quality settings."""
    mapping = {cfg[0].replace(".avif", ".webp"): cfg for cfg in IMAGE_CONFIG}
    for webp_path in sorted((ROOT / "images").rglob("*.webp")):
        rel = webp_path.relative_to(ROOT).as_posix()
        cfg = mapping.get(rel)
        if not cfg:
            avif_rel = rel.replace(".webp", ".avif")
            quality = 58
        else:
            avif_rel, _, _, quality = cfg
        avif_path = ROOT / avif_rel
        img = Image.open(webp_path)
        img = resize_image(img, cfg[1] if cfg else 800)
        w, h = save_avif(img, avif_path, quality=quality)
        webp_path.unlink()
        print(f"  {avif_rel}: {w}x{h} ({avif_path.stat().st_size // 1024} KB)")


def build_from_source(source: Path) -> None:
    content = source.read_text(encoding="utf-8")
    pattern = r'<img([^>]*)\ssrc="(data:image/jpeg;base64,[^"]+)"([^>]*)>'
    matches = list(re.finditer(pattern, content))

    if len(matches) != len(IMAGE_CONFIG):
        raise SystemExit(f"Expected {len(IMAGE_CONFIG)} images, found {len(matches)}")

    new_content = content
    for i, m in enumerate(matches):
        path_str, max_w, attrs, quality = IMAGE_CONFIG[i]
        path = ROOT / path_str
        raw = base64.b64decode(m.group(2).split(",", 1)[1])
        img = resize_image(Image.open(io.BytesIO(raw)), max_w)
        w, h = save_avif(img, path, quality=quality)

        before = m.group(1)
        after = m.group(3)
        alt_m = re.search(r'alt="([^"]*)"', before + after)
        alt = alt_m.group(1) if alt_m else ""

        new_img = build_img_tag(path_str, w, h, attrs, alt)
        new_content = new_content.replace(m.group(0), new_img, 1)
        print(f"  {path_str}: {w}x{h} ({path.stat().st_size // 1024} KB)")

    style_match = re.search(r"<style>(.*?)</style>", new_content, re.DOTALL)
    (ROOT / "css" / "style.css").write_text(style_match.group(1).strip() + "\n", encoding="utf-8")

    script_match = re.search(r"<script>(.*?)</script>", new_content, re.DOTALL)
    js = script_match.group(1).strip()
    lb_str = "[" + ",".join(f"'{p}'" for p in LB_IMAGES) + "]"
    js = re.sub(r"var lbImages=\[[^\]]+\]", f"var lbImages={lb_str}", js)
    (ROOT / "js" / "main.js").write_text(js + "\n", encoding="utf-8")

    head_end = new_content.find("</head>")
    head = new_content[:head_end]
    head = re.sub(r"<link rel=\"preconnect\"[^>]+>\n?", "", head)
    head = re.sub(r"<link href=\"https://fonts\.googleapis\.com[^>]+>\n?", "", head)
    head = re.sub(r"<style>.*?</style>\s*", "", head, flags=re.DOTALL)
    head += (
        '<link rel="preload" href="images/hero.avif" as="image" type="image/avif" fetchpriority="high">\n'
        '<link rel="preload" href="fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin>\n'
        '<link rel="stylesheet" href="css/style.css">\n'
    )

    body_start = new_content.find("<body")
    body_end = new_content.rfind("</body>") + len("</body>")
    body = new_content[body_start:body_end]
    body = re.sub(r"<script>.*?</script>\s*", "", body, flags=re.DOTALL)
    body += "\n<script defer src=\"js/main.js\"></script>\n"

    (ROOT / "index.html").write_text(head + "</head>\n" + body + "\n</html>\n", encoding="utf-8")


def update_html_refs() -> None:
    index_path = ROOT / "index.html"
    text = index_path.read_text(encoding="utf-8")
    text = text.replace(".webp", ".avif")
    text = text.replace("type=\"image/webp\"", "type=\"image/avif\"")
    index_path.write_text(text, encoding="utf-8")

    js_path = ROOT / "js" / "main.js"
    js_path.write_text(js_path.read_text(encoding="utf-8").replace(".webp", ".avif"), encoding="utf-8")


def resolve_source(cli_source: Optional[str]) -> Optional[Path]:
    raw = cli_source or os.environ.get("BUILD_SOURCE")
    if not raw:
        return None
    path = Path(raw).expanduser().resolve()
    return path if path.exists() else None


def main():
    parser = argparse.ArgumentParser(description="Build AVIF images for Main Panorama Suite")
    parser.add_argument(
        "--source",
        help="Path to standalone HTML with embedded images (or set BUILD_SOURCE env var)",
    )
    args = parser.parse_args()
    source = resolve_source(args.source)

    webp_files = list((ROOT / "images").rglob("*.webp"))
    if webp_files:
        print("Converting WebP → AVIF …")
        convert_webp_to_avif()
        update_html_refs()
    elif source:
        print(f"Building from standalone HTML: {source}")
        build_from_source(source)
    else:
        raise SystemExit(
            "No WebP images found and no source HTML provided. "
            "Use --source path/to/standalone.html or set BUILD_SOURCE."
        )

    total = sum(f.stat().st_size for f in (ROOT / "images").rglob("*.avif"))
    print(f"\nimages total (AVIF): {total // 1024} KB")


if __name__ == "__main__":
    main()
