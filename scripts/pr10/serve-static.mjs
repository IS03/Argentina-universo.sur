// Local filesystem server: intentionally does NOT implement query rewrites or SSR.
import { createServer } from "node:http";
import { stat, readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { gzipSync } from "node:zlib";
import { pathToFileURL } from "node:url";
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".txt": "text/plain",
  ".xml": "application/xml",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".pdf": "application/pdf",
};
export function staticServer(directory, { redirects = true } = {}) {
  const base = resolve(directory);
  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      const path = decodeURIComponent(url.pathname);
      if (redirects && path === "/provincias/catarmaca") {
        res.writeHead(308, { location: "/provincias/catamarca" + url.search });
        return res.end();
      }
      if (redirects && /^\/actividades\/por-provincia\/[^/]+$/.test(path)) {
        res.writeHead(308, {
          location: "/actividades?provincia=" + path.split("/").at(-1),
        });
        return res.end();
      }
      const requested = resolve(base, "." + path);
      if (requested !== base && !requested.startsWith(base + sep)) {
        res.writeHead(403);
        return res.end();
      }
      let file = null;
      for (const candidate of [
        requested,
        requested + ".html",
        resolve(requested, "index.html"),
      ]) {
        try {
          if ((await stat(candidate)).isFile()) {
            file = candidate;
            break;
          }
        } catch {
          /* another static path shape */
        }
      }
      const status = file ? 200 : 404;
      if (!file) file = resolve(base, "404.html");
      let data;
      try {
        data = await readFile(file);
      } catch {
        res.writeHead(404);
        return res.end("Not found");
      }
      const type =
        path === "/api/catalogo-resumen"
          ? "application/json"
          : MIME[extname(file)] || "application/octet-stream";
      const compressed =
        /text\/|javascript|json|xml|svg/.test(type) &&
        /gzip/.test(req.headers["accept-encoding"] || "");
      if (compressed) data = gzipSync(data);
      res.writeHead(status, {
        ...(compressed
          ? { "content-encoding": "gzip", vary: "Accept-Encoding" }
          : {}),
        "timing-allow-origin": "*",
        "content-type": type,
        "access-control-allow-origin": "*",
        "x-content-type-options": "nosniff",
        ...(status === 404 || path.startsWith("/prototipo-pr10")
          ? { "x-robots-tag": "noindex, nofollow" }
          : {}),
      });
      res.end(req.method === "HEAD" ? undefined : data);
    } catch {
      res.writeHead(400);
      res.end("Invalid request");
    }
  });
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const [dir, port = "4301"] = process.argv.slice(2);
  staticServer(dir).listen(Number(port), "127.0.0.1", () =>
    console.log(`Local static files: http://127.0.0.1:${port}`),
  );
}
