/*
 * tests/static-server.mjs — tiny static server for local browser tests only
 * (dev/test tooling; the deployed app is a static GitHub Pages site).
 * Serves the project root on 127.0.0.1:PORT (default 8080).
 */
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { extname, join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(join(dirname(fileURLToPath(import.meta.url)), '..'));
const PORT = Number(process.env.PORT || 8080);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json',
  '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.wasm': 'application/wasm', '.gz': 'application/gzip',
  '.txt': 'text/plain' };

http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p === '/') p = '/index.html';
  const fp = join(ROOT, p);
  if (!fp.startsWith(ROOT) || !existsSync(fp) || statSync(fp).isDirectory()) {
    res.writeHead(404); res.end('nf'); return;
  }
  res.writeHead(200, { 'Content-Type': MIME[extname(fp)] || 'application/octet-stream' });
  res.end(readFileSync(fp));
}).listen(PORT, '127.0.0.1', () => console.log(`static server on http://127.0.0.1:${PORT}`));
