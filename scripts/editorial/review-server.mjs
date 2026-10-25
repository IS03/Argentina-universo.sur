// Restricted review transport: loopback + unpredictable path + strict Host + asset allowlist.
// noindex is only supplementary. No arbitrary directory serving, scripts, API, or approval endpoint.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { randomBytes, createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { readPrivateJson, writePrivateJson, privatePath } from './private-io.mjs';

export async function startReviewServer(directory, { port = 4430 } = {}) {
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw Error('REVIEW_PORT_INVALID');
  const manifest = await readPrivateJson(join(directory, 'manifest.json'));
  if (manifest.privateReviewBundle !== true || !Array.isArray(manifest.files) || manifest.files.some(f => typeof f.name !== 'string' || !/^(?:[a-z0-9_-]+\.html|styles\.css|fonts\/[a-z0-9_.-]+\.woff2?|media\/review\/review-[a-f0-9]{16}-\d+\.webp)$/i.test(f.name) || !/^[a-f0-9]{64}$/.test(f.sha256))) throw Error('REVIEW_MANIFEST_INVALID');
  const files = new Map(manifest.files.map(f => [f.name, f.sha256]));
  const key = randomBytes(24).toString('hex'), prefix = '/review/' + key + '/';
  const types = { html: 'text/html; charset=utf-8', css: 'text/css; charset=utf-8', webp: 'image/webp', woff2: 'font/woff2', woff: 'font/woff' };
  const server = createServer(async (req, res) => {
    const address = server.address(), expectedHost = '127.0.0.1:' + address.port;
    res.setHeader('Cache-Control', 'private, no-store'); res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive'); res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'self'; font-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
    if (req.socket.remoteAddress !== '127.0.0.1' || req.headers.host !== expectedHost || req.headers.origin && req.headers.origin !== 'http://' + expectedHost) { res.writeHead(403); res.end(); return; }
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
    let path;
    try { path = new URL(req.url, 'http://' + expectedHost).pathname; } catch { res.writeHead(400); res.end(); return; }
    if (!path.startsWith(prefix)) { res.writeHead(404); res.end(); return; }
    const name = path.slice(prefix.length) || 'index.html';
    if (!files.has(name)) { res.writeHead(404); res.end(); return; }
    try {
      const bytes = await readFile(await privatePath(join(directory, name)));
      if (createHash('sha256').update(bytes).digest('hex') !== files.get(name)) { res.writeHead(409); res.end(); return; }
      res.setHeader('Content-Type', types[name.split('.').pop()]); res.writeHead(200); res.end(req.method === 'HEAD' ? undefined : bytes);
    } catch { res.writeHead(404); res.end(); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  const url = 'http://127.0.0.1:' + server.address().port + prefix;
  await writePrivateJson(join(directory, 'access.json'), { url, boundTo: '127.0.0.1', public: false });
  return { server, url };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [directory, ...extra] = process.argv.slice(2);
    if (!directory || extra.length) throw Error('PRIVATE_DIRECTORY_REQUIRED');
    const { server } = await startReviewServer(directory);
    console.log(JSON.stringify({ localReview: true, port: server.address().port, tokenWrittenToPrivateAccessFile: true, public: false }));
  } catch { console.error('PRIVATE_REVIEW_SERVER_FAILED'); process.exitCode = 1; }
}
