// Local model of Pages _redirects plus an explicitly optional model of pending zone rules.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, resolve, extname, sep } from "node:path";
import { gzipSync } from "node:zlib";
import { legacyFilterDestination } from "../../lib/pages/legacy-filter.ts";
const dir = resolve(process.argv[2] || ".artifacts/pages/production-audit"),
  port = Number(process.argv[3] || 4401),
  zone = process.argv.includes("--zone-rules");
const rules = (await readFile(join(dir, "_redirects"), "utf8"))
  .trim()
  .split("\n")
  .filter((l) => l && !l.startsWith("#"))
  .map((l) => l.split(/\s+/));
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".txt": "text/plain",
  ".xml": "application/xml",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".pdf": "application/pdf",
};
createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    const path = decodeURIComponent(url.pathname);
    const legacy = zone && legacyFilterDestination(url.href);
    if (legacy) {
      res.writeHead(308, { location: legacy });
      return res.end();
    }
    const redirect = rules.find(([from]) => from === path);
    if (redirect) {
      res.writeHead(Number(redirect[2]), {
        location: redirect[1] + url.search,
      });
      return res.end();
    }
    const wanted = resolve(dir, "." + path);
    if (!wanted.startsWith(dir + sep) && wanted !== dir) {
      res.writeHead(403);
      return res.end();
    }
    let file;
    for (const p of [wanted, wanted + ".html", join(wanted, "index.html")])
      try {
        if ((await stat(p)).isFile()) {
          file = p;
          break;
        }
      } catch {}
    const status = file ? 200 : 404;
    file ||= join(dir, "404.html");
    let data = await readFile(file);
    const type =
      path === "/api/catalogo-resumen"
        ? "application/json"
        : mime[extname(file)] || "application/octet-stream";
    const compressed =
      /text|javascript|json|xml|svg/.test(type) &&
      /gzip/.test(req.headers["accept-encoding"] || "");
    if (compressed) data = gzipSync(data);
    const headers = await readFile(join(dir, "_headers"), "utf8");
    const noindex =
      /^  X-Robots-Tag:/m.test(headers);
    res.writeHead(status, {
      "content-type": type,
      "x-content-type-options": "nosniff",
      ...(compressed ? { "content-encoding": "gzip" } : {}),
      ...(noindex ? { "x-robots-tag": "noindex, nofollow" } : {}),
    });
    res.end(req.method === "HEAD" ? undefined : data);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}).listen(port, "127.0.0.1", () =>
  console.log(
    `Local static files ${dir} on ${port}; pending zone rule model: ${zone}`,
  ),
);
