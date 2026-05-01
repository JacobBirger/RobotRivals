const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const os = require('os');

const PORT = 3000;

// Serve static files
const server = http.createServer((req, res) => {
  let filePath;
  const url = req.url.split('?')[0]; // strip query string
  if (url === '/' || url === '/index.html') {
    filePath = path.join(__dirname, 'index.html');
  } else if (url === '/controller') {
    filePath = path.join(__dirname, 'controller.html');
  } else if (url.startsWith('/src/') || url.startsWith('/soundtrack/') || url.startsWith('/soundeffects/')) {
    filePath = path.join(__dirname, url);
  } else if (url === '/LobbyMusic.mp3') {
    filePath = path.join(__dirname, 'LobbyMusic.mp3');
  } else {
    res.writeHead(404); res.end('Not found'); return;
  }
  const ext = path.extname(filePath);
  const mime = ext === '.html' ? 'text/html'
    : ext === '.js' ? 'application/javascript'
    : ext === '.mp3' ? 'audio/mpeg'
    : ext === '.ogg' ? 'audio/ogg'
    : ext === '.wav' ? 'audio/wav'
    : 'application/octet-stream';
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
});

const wss = new WebSocketServer({ server });

let gameClient = null;
let controllerCount = 0;

wss.on('connection', (ws) => {
  // Assign player slot on connect: first controller = P1, second = P2
  controllerCount++;
  const assignedPlayer = controllerCount === 1 ? 1 : 2;
  ws.send(JSON.stringify({ type: 'welcome', player: assignedPlayer }));

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw);
      if (msg.type === 'register') {
        if (msg.role === 'game') {
          gameClient = ws;
          controllerCount = 0; // reset so next controllers get P1/P2 again
          console.log('Game connected');
        } else if (msg.role === 'controller') {
          console.log(`Controller registered (P${msg.player || 1})`);
        }
      } else if (msg.type === 'input') {
        if (gameClient && gameClient.readyState === 1) {
          gameClient.send(raw.toString());
        }
      }
    } catch (e) {}
  });
  ws.on('close', () => {
    if (ws === gameClient) { gameClient = null; console.log('Game disconnected'); }
    else { controllerCount = Math.max(0, controllerCount - 1); }
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
