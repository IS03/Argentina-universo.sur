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


def is_img(url: str) -> bool:
    u = url.lower().split("?")[0].split("#")[0]
    return u.endswith(IMG_EXTS)


def parse_srcset_best(srcset: str):
    """
    Devuelve el URL "mejor" (más grande) de un srcset.
    srcset: "url1 300w, url2 1024w"
    """
    best = None
    best_w = -1
    for part in (srcset or "").split(","):
        part = part.strip()
        if not part:
            continue
        tokens = part.split()
        url = tokens[0].strip()
        w = -1
        if len(tokens) >= 2 and tokens[1].endswith("w"):
            try:
                w = int(tokens[1][:-1])
            except:
                w = -1
        if w > best_w:
            best_w = w
            best = url
        elif best is None:
            best = url
    return best


def canonicalize(url: str) -> str:
    """
    Normaliza para deduplicar:
    - quita querystring
    - quita sufijos de tamaño tipo -1024x682
    - quita -scaled
    """
    u = url.split("?")[0].split("#")[0]
    path = urlparse(u).path

    # sacá basename y canonicalizá
    base = os.path.basename(path)
    name, ext = os.path.splitext(base)

    # -1024x768 / -300x200 etc
    name = re.sub(r"-\d{2,5}x\d{2,5}$", "", name)
    # -scaled
    name = re.sub(r"-scaled$", "", name)

    # reconstruí con mismo host + dirs
    parsed = urlparse(u)
    canon_path = "/".join(path.split("/")[:-1] + [name + ext])
    return f"{parsed.scheme}://{parsed.netloc}{canon_path}"


def safe_filename(url: str) -> str:
    parsed = urlparse(url)
    base = os.path.basename(parsed.path) or "img"
    base = re.sub(r"[^\w\-.]+", "_", base).strip("_")

    h = hashlib.sha1(url.encode("utf-8")).hexdigest()[:8]
    name, ext = os.path.splitext(base)
    if ext.lower() not in IMG_EXTS:
        ext = ".jpg"
    return f"{name}_{h}{ext}"


def fetch_html(url: str) -> str:
    headers = {
        "User-Agent": "Mozilla/5.0"
    }
    r = requests.get(url, headers=headers, timeout=DEFAULT_TIMEOUT)
    r.raise_for_status()
    return r.text


def extract_best_image_urls(page_url: str, html: str):
    soup = BeautifulSoup(html, "lxml")
    candidates = []

    # 1) imgs
    for img in soup.find_all("img"):
        # prioriza srcset grande
        srcset = img.get("srcset") or img.get("data-srcset") or ""
        best_from_srcset = parse_srcset_best(srcset)
        if best_from_srcset:
            candidates.append(best_from_srcset)

        # luego src / data-src
        for attr in ("data-src", "data-lazy-src", "src"):
            v = img.get(attr)
            if v:
                candidates.append(v)

    # 2) background-image inline
    for tag in soup.find_all(style=True):
        style = tag.get("style") or ""
        for m in re.findall(r'url\(([^)]+)\)', style, flags=re.IGNORECASE):
            u = m.strip(' "\'')
            if u:
                candidates.append(u)

    # absolutizar y filtrar
    abs_urls = []
    for u in candidates:
        u = (u or "").strip()
        if not u:
            continue
        abs_urls.append(urljoin(page_url, u))

    # quedate con uploads del sitio (ajustable)
    abs_urls = [u for u in abs_urls if is_img(u) and "wp-content/uploads" in u]

    # dedupe por canonical (misma imagen, distintos tamaños)
    by_canon = {}
    for u in abs_urls:
        canon = canonicalize(u)
        # preferí la URL que tenga "scaled" NO; y si hay tamaño, preferí la sin -1024x...
        # simple: preferir la más "larga" suele ser la original o scaled grande
        prev = by_canon.get(canon)
        if prev is None:
            by_canon[canon] = u
        else:
            # preferir la que NO tenga -###x### (más original)
            score = (0 if re.search(r"-\d{2,5}x\d{2,5}\.", u) else 10) + (0 if "-scaled" in u else 2) + len(u) / 1000
            prev_score = (0 if re.search(r"-\d{2,5}x\d{2,5}\.", prev) else 10) + (0 if "-scaled" in prev else 2) + len(prev) / 1000
            if score > prev_score:
                by_canon[canon] = u

    # devolver en orden estable (orden de aparición)
    out = []
    seen = set()
    for u in abs_urls:
        canon = canonicalize(u)
        chosen = by_canon.get(canon)
        if chosen and chosen not in seen:
            seen.add(chosen)
            out.append(chosen)

    return out


def download(urls, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    headers = {"User-Agent": "Mozilla/5.0"}
    s = requests.Session()

    ok = 0
    for i, url in enumerate(urls, start=1):
        fn = safe_filename(url)
        path = os.path.join(out_dir, fn)
        if os.path.exists(path) and os.path.getsize(path) > 0:
            print(f"[{i}/{len(urls)}] SKIP -> {fn}")
            continue

        for attempt in range(1, 4):
            try:
                with s.get(url, headers=headers, stream=True, timeout=DEFAULT_TIMEOUT) as r:
                    r.raise_for_status()
                    with open(path, "wb") as f:
                        for chunk in r.iter_content(1024 * 64):
                            if chunk:
                                f.write(chunk)
                print(f"[{i}/{len(urls)}] OK   -> {fn}")
                ok += 1
                break
            except Exception as e:
                if attempt == 3:
                    print(f"[{i}/{len(urls)}] FAIL -> {url} ({e})")
                time.sleep(1.2 * attempt)

    print(f"\nListo. Descargadas: {ok} / {len(urls)}")
    print(f"Carpeta: {os.path.abspath(out_dir)}")


def main():
    if len(sys.argv) < 2:
        print("Uso: python download_images.py <URL> [carpeta_salida]")
        sys.exit(1)

    page_url = sys.argv[1]
    out_dir = sys.argv[2] if len(sys.argv) >= 3 else "imagenes"

    html = fetch_html(page_url)
    urls = extract_best_image_urls(page_url, html)

    print(f"[+] Imágenes únicas detectadas: {len(urls)}")
    for u in urls:
        print(" -", u)

    download(urls, out_dir)


if __name__ == "__main__":
    main()
