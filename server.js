'use strict';

// Servidor local do Sistema de Acompanhamento Calebe 2027 (npm start).
// No Vercel, a API roda em api/index.js e os arquivos de public/ são servidos estaticamente.

const http = require('http');
const fs = require('fs');
const path = require('path');
const { createApi } = require('./lib/api');

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

function serveStatic(req, res, url) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405);
    return res.end();
  }
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/' || !path.extname(rel)) rel = '/index.html';
  const file = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!file.startsWith(PUBLIC_DIR + path.sep)) {
    res.writeHead(403);
    return res.end();
  }
  fs.readFile(file, (err, buf) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Não encontrado');
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(buf);
  });
}

function createServer(handleApi = createApi()) {
  return http.createServer((req, res) => {
    let url;
    try {
      url = new URL(req.url, 'http://localhost');
      if (url.pathname.startsWith('/api/')) return handleApi(req, res, url.pathname.slice(5));
      return serveStatic(req, res, url);
    } catch {
      res.writeHead(400);
      res.end();
    }
  });
}

if (require.main === module) {
  createServer().listen(PORT, () => {
    console.log(`Calebe 2027 rodando em http://localhost:${PORT}`);
  });
}

module.exports = { createServer };
