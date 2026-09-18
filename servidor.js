/**
 * Diário do Professor - Servidor Local Leve (Node.js nativo, sem dependências externas)
 * Permite rodar como servidor HTTP local e acessar pelo PC, celular ou tablet na mesma rede Wi-Fi.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORTA = process.env.PORT || 3000;
const DIRETORIO_BASE = __dirname;

const TIPOS_MIME = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function obterIpLocal() {
  const interfaces = os.networkInterfaces();
  for (const nome in interfaces) {
    for (const iface of interfaces[nome]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const servidor = http.createServer((req, res) => {
  let urlLimpa = req.url.split('?')[0];
  if (urlLimpa === '/' || urlLimpa === '') {
    urlLimpa = '/index.html';
  }

  const caminhoArquivo = path.join(DIRETORIO_BASE, decodeURIComponent(urlLimpa));

  // Proteção contra path traversal
  if (!caminhoArquivo.startsWith(DIRETORIO_BASE)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=UTF-8' });
    res.end('Acesso negado');
    return;
  }

  fs.stat(caminhoArquivo, (erro, stats) => {
    if (erro || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end('Arquivo não encontrado: ' + urlLimpa);
      return;
    }

    const extensao = path.extname(caminhoArquivo).toLowerCase();
    const contentType = TIPOS_MIME[extensao] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(caminhoArquivo);
    stream.pipe(res);
  });
});

servidor.listen(PORTA, '0.0.0.0', () => {
  const ip = obterIpLocal();
  console.log('====================================================');
  console.log('📘⚙️ Diário do Professor — Educação Profissionalizante');
  console.log('====================================================');
  console.log(`💻 Acesso no Computador : http://localhost:${PORTA}`);
  console.log(`📱 Acesso no Celular/Tablet : http://${ip}:${PORTA}`);
  console.log('====================================================');
  console.log('Credenciais Padrão: professor@educacao.tec.br | 123456');
  console.log('Pressione Ctrl+C para encerrar o servidor.');
});
