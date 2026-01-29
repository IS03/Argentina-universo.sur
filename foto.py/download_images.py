import os
import re
import sys
import time
import hashlib
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup


IMG_EXTS = (".jpg", ".jpeg", ".png", ".webp", ".gif")
DEFAULT_TIMEOUT = 20


def pick_urls_from_srcset(srcset: str):
    """
    srcset format: "url1 300w, url2 1024w"
    We return all URLs found (we'll dedupe later).
    """
    urls = []
    for part in (srcset or "").split(","):
        part = part.strip()
        if not part:
            continue
        # take first token = url
        url = part.split()[0].strip()
        if url:
            urls.append(url)
    return urls


def looks_like_image(url: str) -> bool:
    u = url.lower().split("?")[0].split("#")[0]
    return u.endswith(IMG_EXTS)


def safe_filename_from_url(url: str, fallback_prefix="img"):
    """
    Build a safe filename:
    - tries to use URL path basename
    - adds short hash to avoid collisions
    """
    parsed = urlparse(url)
    base = os.path.basename(parsed.path) or fallback_prefix
    base = re.sub(r"[^\w\-.]+", "_", base).strip("_")
    if not base:
        base = fallback_prefix

    # add hash to avoid duplicates with same basename
    h = hashlib.sha1(url.encode("utf-8")).hexdigest()[:8]
    name, ext = os.path.splitext(base)
    if ext.lower() not in IMG_EXTS:
        ext = ".jpg"  # fallback; usually won't happen due to filtering
    return f"{name}_{h}{ext}"


def fetch_html(url: str) -> str:
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                      "AppleWebKit/537.36 (KHTML, like Gecko) "
                      "Chrome/120.0 Safari/537.36"
    }
    r = requests.get(url, headers=headers, timeout=DEFAULT_TIMEOUT)
    r.raise_for_status()
    return r.text


def extract_image_urls(page_url: str, html: str):
    soup = BeautifulSoup(html, "lxml")
    found = []

    # 1) normal <img>
    for img in soup.find_all("img"):
        for attr in ("src", "data-src", "data-lazy-src"):
            v = img.get(attr)
            if v:
                found.append(v)

        srcset = img.get("srcset") or img.get("data-srcset") or ""
        found.extend(pick_urls_from_srcset(srcset))

    # 2) inline styles like background-image:url(...)
    for tag in soup.find_all(style=True):
        style = tag.get("style") or ""
        # find all url(...) in style
        for m in re.findall(r'url\(([^)]+)\)', style, flags=re.IGNORECASE):
            u = m.strip(' "\'')
            if u:
                found.append(u)

    # Normalize -> absolute
    abs_urls = []
    for u in found:
        u = u.strip()
        if not u:
            continue
        abs_urls.append(urljoin(page_url, u))

    # Filter:
    # - must look like image
    # - prefer wp-content/uploads (tu caso)
    filtered = []
    for u in abs_urls:
        if looks_like_image(u) and "wp-content/uploads" in u:
            filtered.append(u)

    # Deduplicate while preserving order
    seen = set()
    out = []
    for u in filtered:
        if u not in seen:
            seen.add(u)
            out.append(u)

    return out


def download_one(session: requests.Session, url: str, out_dir: str, retries=3):
    os.makedirs(out_dir, exist_ok=True)
    filename = safe_filename_from_url(url)
    path = os.path.join(out_dir, filename)

    if os.path.exists(path) and os.path.getsize(path) > 0:
        return "skip", path

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                      "AppleWebKit/537.36 (KHTML, like Gecko) "
                      "Chrome/120.0 Safari/537.36"
    }

    last_err = None
    for attempt in range(1, retries + 1):
        try:
            with session.get(url, headers=headers, stream=True, timeout=DEFAULT_TIMEOUT) as r:
                r.raise_for_status()
                with open(path, "wb") as f:
                    for chunk in r.iter_content(chunk_size=1024 * 64):
                        if chunk:
                            f.write(chunk)
            return "ok", path
        except Exception as e:
            last_err = e
            # backoff simple
            time.sleep(1.5 * attempt)

    return f"error: {last_err}", path


def main():
    if len(sys.argv) < 2:
        print("Uso:\n  python download_images.py <URL> [carpeta_salida]\n")
        print("Ejemplo:\n  python download_images.py https://www.santafe.tur.ar/2025/12/22/complejo-social-tunel-subfluvial/ imagenes\n")
        sys.exit(1)

    page_url = sys.argv[1]
    out_dir = sys.argv[2] if len(sys.argv) >= 3 else "imagenes"

    print(f"[+] Leyendo HTML: {page_url}")
    html = fetch_html(page_url)

    urls = extract_image_urls(page_url, html)
    print(f"[+] Imágenes detectadas (filtradas): {len(urls)}")

    if not urls:
        print("[!] No encontré imágenes con el filtro wp-content/uploads y extensiones comunes.")
        print("    Si querés, te lo ajusto para no filtrar por wp-content/uploads.")
        sys.exit(0)

    session = requests.Session()

    ok = 0
    skipped = 0
    errors = 0

    for i, u in enumerate(urls, start=1):
        status, path = download_one(session, u, out_dir, retries=3)
        if status == "ok":
            ok += 1
            print(f"[{i}/{len(urls)}] OK   -> {path}")
        elif status == "skip":
            skipped += 1
            print(f"[{i}/{len(urls)}] SKIP -> {path}")
        else:
            errors += 1
            print(f"[{i}/{len(urls)}] FAIL -> {u}\n           {status}")

    print("\n--- RESUMEN ---")
    print(f"Descargadas: {ok}")
    print(f"Saltadas (ya existían): {skipped}")
    print(f"Errores: {errors}")
    print(f"Carpeta: {os.path.abspath(out_dir)}")


if __name__ == "__main__":
    main()
