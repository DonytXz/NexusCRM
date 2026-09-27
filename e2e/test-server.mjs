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
    const fileStream = fs.createReadStream(filePath);
    fileStream.on('error', (err) => {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
      }
      res.end(`Internal Server Error: ${err.message}`);
    });
    return fileStream.pipe(res);
  }

  // SPA fallback
  const indexPath = path.join(distFolder, 'index.html');
  if (!fs.existsSync(indexPath)) {
    res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end(
      `Error: Build output not found at ${indexPath}.\nPlease run 'npm run build' before starting the E2E test server.`
    );
  }

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  const indexStream = fs.createReadStream(indexPath);
  indexStream.on('error', (err) => {
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
    }
    res.end(`Internal Server Error: ${err.message}`);
  });
  indexStream.pipe(res);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`E2E test server listening at http://127.0.0.1:${port}/NexusCRM/`);
});
