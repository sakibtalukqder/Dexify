const WebSocket = require('ws');
const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8080;

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.get('/', (req, res) => {
  res.json({ 
    status: 'RDP WebSocket Server Running', 
    port: PORT,
    info: 'This server requires mstsc.exe (Windows Remote Desktop Client)'
  });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 RDP WebSocket server running on http://localhost:${PORT}`);
  console.log('⚠️  Note: This implementation uses Windows native RDP client');
});

// WebSocket server
const wss = new WebSocket.Server({ server, path: '/remote' });

wss.on('connection', (ws, req) => {
  console.log('📱 New WebSocket connection');
  
  // Parse query parameters
  const params = new URLSearchParams(req.url.split('?')[1]);
  const targetIp = params.get('ip');
  const targetPort = params.get('port') || '3389';
  
  console.log(`🔌 Request to connect to RDP: ${targetIp}:${targetPort}`);
  
  if (!targetIp) {
    ws.send(JSON.stringify({ type: 'error', message: 'IP address is required' }));
    ws.close();
    return;
  }

  let credentials = {
    username: '',
    password: ''
  };

  // Wait for credentials from client
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'credentials') {
        credentials.username = data.username || '';
        credentials.password = data.password || '';
        
        console.log(`🔐 Received credentials for user: ${credentials.username}`);
        
        // For now, just simulate connection
        // Real implementation would need a screen capture solution
        simulateConnection(ws, targetIp, targetPort, credentials);
      } else if (data.type === 'mouse' || data.type === 'keyboard') {
        // Handle input events (not implemented yet)
        console.log(`Received ${data.type} event`);
      }
    } catch (err) {
      console.error('Error handling message:', err);
    }
  });

  ws.on('close', () => {
    console.log('🔌 WebSocket disconnected');
  });

  ws.on('error', (err) => {
    console.error('❌ WebSocket error:', err);
  });
});

function simulateConnection(ws, ip, port, credentials) {
  // Test if we can reach the RDP port
  const net = require('net');
  const socket = new net.Socket();
  
  socket.setTimeout(5000);
  
  socket.connect(parseInt(port), ip, () => {
    console.log('✅ RDP port is reachable');
    socket.destroy();
    
    ws.send(JSON.stringify({ 
      type: 'connected', 
      message: 'Connected to RDP server (screen sharing requires additional setup)' 
    }));
    
    // Send demo frame
    setTimeout(() => {
      ws.send(JSON.stringify({
        type: 'message',
        message: 'Screen capture requires FreeRDP, guacd, or Windows native tools. See documentation for setup instructions.'
      }));
    }, 1000);
  });
  
  socket.on('timeout', () => {
    socket.destroy();
    ws.send(JSON.stringify({ 
      type: 'error', 
      message: `Connection timeout. Cannot reach ${ip}:${port}` 
    }));
  });
  
  socket.on('error', (err) => {
    console.error('Connection error:', err);
    ws.send(JSON.stringify({ 
      type: 'error', 
      message: `Cannot connect to ${ip}:${port}. Error: ${err.message}` 
    }));
  });
}

console.log('📡 Waiting for connections...');
console.log('');
console.log('⚠️  IMPORTANT NOTICE:');
console.log('This is a basic WebSocket server. For actual RDP screen sharing, you need:');
console.log('1. Apache Guacamole (recommended)');
console.log('2. FreeRDP with websocket support');
console.log('3. Or use native Windows Remote Desktop Connection');
console.log('');
console.log('For now, you can test connectivity. See README for full setup.');
