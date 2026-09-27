import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distFolder = path.join(__dirname, '../dist/nexus-crm/browser');
const port = 4200;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/' || urlPath === '/NexusCRM') {
    res.writeHead(302, { Location: '/NexusCRM/' });
    return res.end();
  }

  if (urlPath.startsWith('/NexusCRM/')) {
    urlPath = urlPath.slice('/NexusCRM/'.length);
  }

  let filePath = path.join(distFolder, urlPath);
  if (urlPath && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    return fs.createReadStream(filePath).pipe(res);
  }

  // SPA fallback
  const indexPath = path.join(distFolder, 'index.html');
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(indexPath).pipe(res);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`E2E test server listening at http://127.0.0.1:${port}/NexusCRM/`);
});
