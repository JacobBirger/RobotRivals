const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const os = require('os');

const PORT = 3000;

// Serve static files
const server = http.createServer((req, res) => {
  let filePath;
  if (req.url === '/' || req.url === '/index.html') {
    filePath = path.join(__dirname, 'index.html');
  } else if (req.url === '/controller') {
    filePath = path.join(__dirname, 'controller.html');
  } else {
    res.writeHead(404); res.end('Not found'); return;
  }
  const ext = path.extname(filePath);
  const mime = ext === '.html' ? 'text/html' : 'application/octet-stream';
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(500); res.end('Error'); return; }
    res.writeHead(200, { 'Content-Type': mime + '; charset=utf-8' });
    res.end(data);
  });
});

const wss = new WebSocketServer({ server });

let gameClient = null;
const controllers = new Set();

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw);
      if (msg.type === 'register') {
        if (msg.role === 'game') {
          gameClient = ws;
          console.log('Game connected');
        } else if (msg.role === 'controller') {
          controllers.add(ws);
          console.log(`Controller connected (P${msg.player || 1})`);
        }
      } else if (msg.type === 'input') {
        // Relay controller input to game
        if (gameClient && gameClient.readyState === 1) {
          gameClient.send(raw.toString());
        }
      }
    } catch (e) {}
  });
  ws.on('close', () => {
    if (ws === gameClient) { gameClient = null; console.log('Game disconnected'); }
    controllers.delete(ws);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  // Find local IP
  const nets = os.networkInterfaces();
  let localIP = 'localhost';
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) { localIP = net.address; break; }
    }
  }
  console.log(`\n  Robot Rivals Server running!\n`);
  console.log(`  Game:       http://localhost:${PORT}`);
  console.log(`  Controller: http://${localIP}:${PORT}/controller`);
  console.log(`\n  Open the controller URL on your phone (same Wi-Fi)\n`);
});
