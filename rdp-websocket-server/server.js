const WebSocket = require('ws');
const rdp = require('node-rdpjs-2');
const express = require('express');

const app = express();
const PORT = 8080;

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.get('/', (req, res) => {
  res.json({ status: 'RDP WebSocket Server Running', port: PORT });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 RDP WebSocket server running on http://localhost:${PORT}`);
});

// WebSocket server
const wss = new WebSocket.Server({ server, path: '/remote' });

wss.on('connection', (ws, req) => {
  console.log('📱 New WebSocket connection');
  
  // Parse query parameters
  const params = new URLSearchParams(req.url.split('?')[1]);
  const targetIp = params.get('ip');
  const targetPort = params.get('port') || '3389';
  
  console.log(`🔌 Attempting to connect to RDP: ${targetIp}:${targetPort}`);
  
  if (!targetIp) {
    ws.send(JSON.stringify({ type: 'error', message: 'IP address is required' }));
    ws.close();
    return;
  }

  let rdpClient = null;
  let credentials = {
    domain: '',
    userName: '',
    password: ''
  };

  // Wait for credentials from client
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'credentials' && !rdpClient) {
        // Received credentials, now connect
        credentials.userName = data.username || '';
        credentials.password = data.password || '';
        credentials.domain = data.domain || '';
        
        console.log(`🔐 Connecting with username: ${credentials.userName || '(none)'}`);
        
        connectToRDP();
      } else if (data.type === 'connect' && !rdpClient) {
        // Connect without credentials (will likely fail)
        console.log('⚠️ Connecting without credentials');
        connectToRDP();
      } else if (rdpClient) {
        // Handle mouse/keyboard input
        if (data.type === 'mouse') {
          rdpClient.sendPointerEvent(data.x, data.y, data.button || 0, data.isPressed || false);
        } else if (data.type === 'keyboard') {
          rdpClient.sendKeyEventScancode(data.code, data.isPressed);
        }
      }
    } catch (err) {
      console.error('Error handling message:', err);
    }
  });

  function connectToRDP() {
    try {
      // Create RDP client with provided credentials
      rdpClient = rdp.createClient({
        domain: credentials.domain,
        userName: credentials.userName,
        password: credentials.password,
        enablePerf: true,
        autoLogin: true,
        decompress: false,
        screen: { width: 1280, height: 720 },
        locale: 'en',
        logLevel: 'INFO',
        security: 'rdp' // Use RDP security instead of TLS
      });

      // Connect to RDP server
      rdpClient.connect(targetIp, parseInt(targetPort));

      // RDP connected
      rdpClient.on('connect', () => {
        console.log('✅ Connected to RDP server');
        ws.send(JSON.stringify({ type: 'connected', message: 'Connected to RDP server' }));
      });

      // Receive screen data
      rdpClient.on('bitmap', (bitmap) => {
        try {
          // Send bitmap data to browser
          ws.send(JSON.stringify({
            type: 'bitmap',
            data: {
              x: bitmap.destLeft,
              y: bitmap.destTop,
              width: bitmap.width,
              height: bitmap.height,
              data: bitmap.data.toString('base64')
            }
          }));
        } catch (err) {
          console.error('Error sending bitmap:', err);
        }
      });

      // RDP errors
      rdpClient.on('error', (err) => {
        console.error('❌ RDP Error:', err);
        const errorMsg = err.code === 5 
          ? 'Access Denied. Please check your username and password. Make sure the user has permission for Remote Desktop access.'
          : err.message || 'Unknown RDP error';
        ws.send(JSON.stringify({ type: 'error', message: errorMsg, code: err.code }));
      });

      // RDP closed
      rdpClient.on('close', () => {
        console.log('🔌 RDP connection closed');
        ws.send(JSON.stringify({ type: 'disconnected' }));
        ws.close();
      });

    } catch (err) {
      console.error('❌ Error creating RDP client:', err);
      ws.send(JSON.stringify({ type: 'error', message: err.message }));
      ws.close();
    }
  }

  // Handle WebSocket close
  ws.on('close', () => {
    console.log('🔌 WebSocket disconnected');
    if (rdpClient) {
      rdpClient.close();
    }
  });

  // Handle WebSocket errors
  ws.on('error', (err) => {
    console.error('❌ WebSocket error:', err);
  });
});

console.log('📡 Waiting for connections...');
