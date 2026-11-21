const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { createDatabase } = require('../server/db.cjs');
const { createHandler } = require('../server/handler.cjs');
const root = path.resolve(__dirname, '..');

function createDevServer(options = {}) {
  const url = options.databaseUrl || process.env.TURSO_DATABASE_URL;
  const authToken = options.authToken || process.env.TURSO_AUTH_TOKEN;
  if (url && !authToken && !url.startsWith('file:')) throw new Error('Thiếu TURSO_AUTH_TOKEN. Điền cả URL và token, hoặc để trống cả hai để dùng SQLite tại máy.');
  if (!url && authToken) throw new Error('Thiếu TURSO_DATABASE_URL.');
  const dataFile = path.join(root, '.data', 'sky.db');
  if (!url) fs.mkdirSync(path.dirname(dataFile), { recursive: true });
  const database = options.database || createDatabase({ url: url || pathToFileURL(dataFile).href, authToken });
  const api = createHandler({ getDatabase: () => database, secureCookies: false, now: options.now });
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg' };
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/api/account') return api(req, res);
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); return res.end(); }
    let pathname;
    try { pathname = decodeURIComponent(url.pathname); } catch { res.writeHead(400); return res.end(); }
    // Chỉ phục vụ FE, không để lộ .env, mã backend, DB hoặc node_modules.
    if (pathname !== '/' && pathname !== '/index.html' && !pathname.startsWith('/assets/')) { res.writeHead(404); return res.end(); }
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (pathname.startsWith('/assets/') && !file.startsWith(path.join(root, 'assets') + path.sep)) { res.writeHead(404); return res.end(); }
    try {
      const stat = await fs.promises.stat(file);
      if (!stat.isFile()) { res.writeHead(404); return res.end(); }
      res.setHeader('Content-Type', (mime[path.extname(file)] || 'application/octet-stream') + (/\.(html|js|css)$/.test(file) ? '; charset=utf-8' : ''));
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'no-store');
      if (req.method === 'HEAD') return res.end();
      fs.createReadStream(file).pipe(res);
    } catch { res.writeHead(404); res.end(); }
  });
  return { server, database };
}
if (require.main === module) {
  const { server } = createDevServer();
  const port = Number(process.env.PORT || 5173);
  server.listen(port, '127.0.0.1', () => console.log(`Phòng Nhạc Sky: http://localhost:${port} (${process.env.TURSO_DATABASE_URL ? 'Turso' : 'SQLite tại máy — không cần tài khoản dịch vụ'})`));
}
module.exports = { createDevServer };
